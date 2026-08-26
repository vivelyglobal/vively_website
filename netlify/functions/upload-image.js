// Upload image — goes to Cloudinary when configured (required in production;
// Render's disk is ephemeral and wipes /assets/uploads on every deploy).
// Falls back to local disk only in dev, when CLOUDINARY_* env vars are unset.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { verifyRequest } = require("./auth");
const { requirePermission, PERMISSIONS } = require("./_shared/permissions");
const cloudinaryClient = require("./_shared/cloudinary");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Project root: netlify/functions -> ../../
const UPLOAD_DIR = path.join(__dirname, "..", "..", "assets", "uploads");
const IS_PROD = process.env.NODE_ENV === "production";

if (!IS_PROD && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Require auth + upload permission (admin, brand, creator — anyone signed in
  // may upload for their own content). We rely on the caller's endpoint using
  // the returned URL responsibly.
  const auth = verifyRequest(event);
  const denial = requirePermission(auth, PERMISSIONS.UPLOAD_IMAGE);
  if (denial) return denial;

  try {
    const body = JSON.parse(event.body || "{}");
    const { file, filename, contentType } = body;

    if (!file || !contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing 'file' (base64) or 'contentType'",
        }),
      };
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF",
        }),
      };
    }

    // Strip data URL prefix if present
    const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > MAX_SIZE_BYTES) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `File too large. Max ${MAX_SIZE_BYTES / 1024 / 1024} MB`,
        }),
      };
    }

    if (cloudinaryClient.isConfigured()) {
      const { url: imageUrl } = await cloudinaryClient.uploadPublicImage(file);
      return {
        statusCode: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          message: "Upload successful",
          imageUrl,
          size: buffer.length,
        }),
      };
    }

    if (IS_PROD) {
      // Cloudinary is required in production — local disk doesn't survive
      // a Render redeploy, so failing loudly beats silently losing files.
      console.error("Upload rejected: CLOUDINARY_* env vars are not set in production");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Image storage is not configured" }),
      };
    }

    // Dev fallback: write to local disk (fine for local dev, never for prod).
    const ext = contentType.split("/")[1] || "bin";
    const uniqueName = `${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);
    fs.writeFileSync(filePath, buffer);
    const imageUrl = `/assets/uploads/${uniqueName}`;

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Upload successful",
        filename: uniqueName,
        imageUrl,
        size: buffer.length,
      }),
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Upload failed",
        details: error.message,
      }),
    };
  }
};
