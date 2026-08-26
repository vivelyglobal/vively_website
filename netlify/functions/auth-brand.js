// Brand (company/client) auth: signup + login.
// Separate from users (creators) and admins.
//
// Signup flow:
//   1. Client POSTs {action:"signup", ...brandData}
//   2. We hash password, insert brand with status:"pending"
//   3. Admin reviews in admin panel, sets status:"approved" (or "rejected")
//   4. Brand can then log in (login blocked while pending/rejected)
//
// Login flow:
//   POST {action:"login", email, password}
//   - Returns JWT with role:"brand" so brand-dashboard.html can auth its API calls

const { getBrandsCollection } = require("./db");
const { generateToken, hashPassword, comparePassword } = require("./auth");
const cloudinaryClient = require("./_shared/cloudinary");
const {
  requestPasswordReset,
  consumeResetToken,
  validateNewPassword,
} = require("./_shared/password-reset");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5 MB
const IS_PROD = process.env.NODE_ENV === "production";

const UPLOAD_DIR = path.join(
  __dirname,
  "..",
  "..",
  "assets",
  "uploads",
  "business-docs"
);
if (!IS_PROD && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Stores the business registration cert (사업자등록증). This is a KYC
// document, not public content, so it's uploaded to Cloudinary as
// type:"authenticated" — not reachable at a guessable public URL — and we
// persist only the Cloudinary publicId/resourceType, never a direct link.
// A signed URL is generated on demand (see cloudinaryClient.getSignedDocumentUrl)
// only when an authorized admin endpoint needs to display it.
// Dev fallback (no Cloudinary configured, NODE_ENV !== production) writes to
// local disk, same as before — fine for local testing only.
async function saveBusinessDoc(dataUrl) {
  const match = /^data:([\w/.+-]+);base64,(.+)$/.exec(dataUrl || "");
  if (!match) throw new Error("Invalid file data URL");
  const contentType = match[1];
  if (!ALLOWED_DOC_TYPES.includes(contentType)) {
    throw new Error("Invalid file type. Allowed: PDF, JPEG, PNG, WebP");
  }
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_DOC_SIZE) {
    throw new Error(`File too large. Max ${MAX_DOC_SIZE / 1024 / 1024} MB`);
  }

  if (cloudinaryClient.isConfigured()) {
    const { publicId, resourceType } = await cloudinaryClient.uploadPrivateDocument(dataUrl);
    return { provider: "cloudinary", publicId, resourceType };
  }

  if (IS_PROD) {
    throw new Error("Document storage is not configured");
  }

  const ext = contentType === "application/pdf" ? "pdf" : contentType.split("/")[1];
  const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, uniqueName), buffer);
  return { provider: "local", url: `/assets/uploads/business-docs/${uniqueName}` };
}

function bad(status, error, extra = {}) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error, ...extra }),
  };
}

function ok(status, payload) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

function normalizeEmail(v) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return bad(405, "Method not allowed");
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return bad(400, "Invalid JSON body");
  }

  const { action } = body;
  const brands = await getBrandsCollection();

  // ============
  // SIGNUP
  // ============
  if (action === "signup") {
    const email = normalizeEmail(body.email);
    const password = body.password;

    // Required fields — mirror the frontend form validation.
    const required = {
      companyName: body.companyName,
      email,
      password,
      phone: body.phone,
      industry: body.industry,
      address: body.address,
      businessRegNumber: body.businessRegNumber, // 사업자등록번호 (text)
      repName: body.repName,
      repTitle: body.repTitle,
    };
    for (const [k, v] of Object.entries(required)) {
      if (!v || (typeof v === "string" && !v.trim())) {
        return bad(400, `Missing required field: ${k}`);
      }
    }
    if (password.length < 8) {
      return bad(400, "Password must be at least 8 characters");
    }

    const existing = await brands.findOne({ email });
    if (existing) {
      return bad(409, "A brand account with this email already exists");
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const brand = {
      // login
      email,
      passwordHash,
      role: "brand",
      status: "pending", // pending | approved | rejected
      createdAt: now,
      updatedAt: now,

      // company
      companyName: body.companyName.trim(),
      industry: body.industry,
      industryOther: body.industryOther || null,
      address: body.address.trim(),
      website: body.website || null,
      phone: body.phone.trim(),

      // 사업자등록증 (Korean business registration)
      businessRegNumber: body.businessRegNumber.trim(),
      businessRegCert: null, // { provider, publicId, resourceType } — set below if provided

      // representative
      repName: body.repName.trim(),
      repTitle: body.repTitle.trim(),
      repEmail: normalizeEmail(body.repEmail) || email,

      // campaign needs
      influencerTypes: Array.isArray(body.influencerTypes)
        ? body.influencerTypes
        : [],
      targetRegions: Array.isArray(body.targetRegions)
        ? body.targetRegions
        : [],
      contentCategories: Array.isArray(body.contentCategories)
        ? body.contentCategories
        : [],
      budgetRange: body.budgetRange || null,
      notes: body.notes || null,
    };

    // Optional: business registration certificate file (base64 data URL).
    if (body.businessRegCertFile) {
      try {
        brand.businessRegCert = await saveBusinessDoc(body.businessRegCertFile);
      } catch (err) {
        return bad(400, err.message);
      }
    }

    const result = await brands.insertOne(brand);

    return ok(201, {
      message:
        "Application received. We'll review your account and email you once it's approved.",
      brandId: result.insertedId,
      status: "pending",
    });
  }

  // ============
  // LOGIN
  // ============
  if (action === "login") {
    const email = normalizeEmail(body.email);
    const password = body.password;
    if (!email || !password) {
      return bad(400, "Email and password required");
    }

    const brand = await brands.findOne({ email });
    if (!brand) {
      return bad(401, "Invalid email or password");
    }

    const valid = await comparePassword(password, brand.passwordHash);
    if (!valid) {
      return bad(401, "Invalid email or password");
    }

    if (brand.status === "pending") {
      return bad(403, "Your account is pending admin approval.", {
        status: "pending",
      });
    }
    if (brand.status === "rejected") {
      return bad(403, "Your account application was not approved.", {
        status: "rejected",
      });
    }

    const token = generateToken(brand._id, brand.email, "brand");
    return ok(200, {
      message: "Login successful",
      token,
      brand: {
        _id: brand._id,
        email: brand.email,
        companyName: brand.companyName,
        repName: brand.repName,
        role: "brand",
        status: brand.status,
      },
    });
  }

  // ============
  // FORGOT PASSWORD
  // ============
  if (action === "forgot-password") {
    const email = normalizeEmail(body.email);
    if (!email) return bad(400, "Email required");

    const existing = await brands.findOne({ email });
    // Only send when the account exists, but always return the same
    // generic response — otherwise this would leak which emails are
    // registered brand accounts.
    if (existing) {
      await requestPasswordReset(email, "brand");
    }

    return ok(200, {
      message: "If that email is registered, a reset link has been sent.",
    });
  }

  // ============
  // RESET PASSWORD
  // ============
  if (action === "reset-password") {
    const { token: resetToken, newPassword } = body;
    if (!resetToken || !newPassword) {
      return bad(400, "Token and new password required");
    }

    const passwordError = validateNewPassword(newPassword);
    if (passwordError) return bad(400, passwordError);

    const record = await consumeResetToken(resetToken, "brand");
    if (!record) {
      return bad(400, "This reset link is invalid or has expired.");
    }

    const passwordHash = await hashPassword(newPassword);
    const result = await brands.updateOne(
      { email: record.email },
      { $set: { passwordHash, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return bad(404, "Account no longer exists");
    }

    return ok(200, { message: "Password updated. You can now log in." });
  }

  return bad(400, "Invalid action");
};
