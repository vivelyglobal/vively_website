// Signup handler: send verification code, verify code, create account
const bcrypt = require("bcryptjs");
const { getUsersCollection, getVerificationCodesCollection } = require("./db");
const { generateToken } = require("./auth");

// NOTE: verification codes are persisted in MongoDB (see ./db.js
// getVerificationCodesCollection). An in-memory Map does NOT work on
// Netlify Functions because each invocation can hit a fresh instance,
// so a code written in send-code disappears before verify-code runs.

// ----- Email delivery (Brevo transactional API) -----
// Uses fetch (built into Node 18+) so we don't need to add a dependency.
// If BREVO_API_KEY is missing, we fall back to console.log so local dev
// without an API key still works.
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL =
  process.env.BREVO_SENDER_EMAIL || "noreply@vivelyglobal.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Vively";
const IS_DEV = process.env.NODE_ENV !== "production";

function buildVerificationEmailHTML(code) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#111;letter-spacing:-0.5px;">Vively</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;text-align:center;">
          <h2 style="margin:16px 0 8px;font-size:20px;color:#111;">Verify your email</h2>
          <p style="margin:0;color:#666;font-size:14px;line-height:1.5;">
            Enter this 6-digit code in the Vively sign-up window. This code expires in 10 minutes.
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <div style="display:inline-block;padding:16px 24px;background:#faf5f5;border:1px solid #f0dcdc;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#b13a3a;font-family:'Courier New',monospace;">
            ${code}
          </div>
        </td></tr>
        <tr><td style="padding:16px 32px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:12px;line-height:1.5;">
            Didn't request this? You can safely ignore this email.<br>
            &copy; ${new Date().getFullYear()} Vively Global
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Helper: send verification email via Brevo API
async function sendVerificationEmail(email, code) {
  // Always log in dev so you can grab the code from netlify dev output
  if (IS_DEV) console.log(`[DEV] Verification code for ${email}: ${code}`);

  if (!BREVO_API_KEY) {
    console.warn(
      "[email] BREVO_API_KEY not set — email not actually sent. Add it to .env.local to enable delivery."
    );
    return { sent: false, reason: "no-api-key" };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email }],
        subject: `Your Vively verification code: ${code}`,
        htmlContent: buildVerificationEmailHTML(code),
        textContent: `Your Vively verification code is: ${code}\n\nThis code expires in 10 minutes. If you didn't request it, ignore this email.`,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[email] Brevo send failed (${res.status}):`,
        body.slice(0, 500)
      );
      return { sent: false, reason: "brevo-error", status: res.status, body };
    }

    const data = await res.json().catch(() => ({}));
    console.log(`[email] Sent verification to ${email} (messageId: ${data.messageId || "n/a"})`);
    return { sent: true, messageId: data.messageId };
  } catch (error) {
    console.error("[email] Send error:", error);
    return { sent: false, reason: "exception", error: error.message };
  }
}

// Generate 6-digit verification code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
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

  try {
    const body = JSON.parse(event.body || "{}");
    const { action, code, userData } = body;
    // Always work with a normalized (lowercase, trimmed) email so the
    // lookup key is deterministic regardless of what the user typed.
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const users = await getUsersCollection();

    // ========== SEND VERIFICATION CODE ==========
    if (action === "send-code") {
      if (!email) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Email required" }),
        };
      }

      // Check if email already exists
      const existing = await users.findOne({ email });
      if (existing) {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: "Email already registered" }),
        };
      }

      // Generate and persist code (valid for 10 minutes) in MongoDB.
      // upsert=true so a repeated send-code overwrites the previous code.
      const verificationCode = generateCode();
      const codes = await getVerificationCodesCollection();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await codes.updateOne(
        { email },
        { $set: { email, code: verificationCode, expiresAt, createdAt: new Date() } },
        { upsert: true }
      );

      // Send email
      const emailResult = await sendVerificationEmail(email, verificationCode);

      // In dev, return the code in the response body so testing works even
      // without SMTP configured. NEVER include this in production responses.
      const responseBody = {
        message: "Verification code sent",
        email: email,
        emailSent: emailResult?.sent === true,
      };
      if (IS_DEV) {
        responseBody.devCode = verificationCode;
        if (!emailResult?.sent) {
          responseBody.devNote =
            "Email not delivered (see server logs). Use devCode to continue testing.";
        }
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseBody),
      };
    }

    // ========== VERIFY CODE ==========
    if (action === "verify-code") {
      if (!email || !code) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Email and code required" }),
        };
      }

      const codes = await getVerificationCodesCollection();
      const stored = await codes.findOne({ email });
      if (!stored) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "No code sent for this email" }),
        };
      }

      if (new Date() > new Date(stored.expiresAt)) {
        await codes.deleteOne({ email });
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Code expired. Request a new one." }),
        };
      }

      if (stored.code !== code.toString()) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid verification code" }),
        };
      }

      // Code is valid — mark it as verified (don't delete yet, we need it
      // for the create-account step below so the user can't skip verify).
      await codes.updateOne(
        { email },
        { $set: { verified: true, verifiedAt: new Date() } }
      );

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Code verified successfully",
          verified: true,
        }),
      };
    }

    // ========== CREATE ACCOUNT ==========
    if (action === "create-account") {
      if (!email || !userData) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Email and user data required" }),
        };
      }

      // Require that this email actually went through the verification
      // flow above. Prevents anyone from POSTing straight to create-account.
      const codes = await getVerificationCodesCollection();
      const codeRecord = await codes.findOne({ email });
      if (!codeRecord || !codeRecord.verified) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Email not verified. Please verify your email first.",
          }),
        };
      }

      // Verify email isn't already registered
      const existing = await users.findOne({ email });
      if (existing) {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: "Email already registered" }),
        };
      }

      const {
        username,
        fullName,
        password,
        gender,
        nationality,
        secondNationality,
        residence,
        dob,
        phone,
        countryCode,
        instagram,
        tiktok,
        youtube,
        categories,
        bio,
        portfolioUrl,
        inviterUsername,
        marketingOptIn,
      } = userData;

      // Validate required fields
      if (!username || !fullName || !instagram) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Username, full name, and Instagram required",
          }),
        };
      }

      if (!password || typeof password !== "string") {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Password is required" }),
        };
      }

      if (password.length < 8) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Password must be at least 8 characters" }),
        };
      }

      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Password must include at least one letter and one number",
          }),
        };
      }

      // Validate age (must be at least 17)
      const birthDate = new Date(dob);
      const age =
        (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 17) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "You must be at least 17 years old",
          }),
        };
      }

      // Check username uniqueness
      const usernameExists = await users.findOne({
        username: username.toLowerCase(),
      });
      if (usernameExists) {
        return {
          statusCode: 409,
          body: JSON.stringify({ error: "Username already taken" }),
        };
      }

      // Create new user
      const passwordHash = await bcrypt.hash(password, 10);

      // If this signup started via Google Sign-In, auth-google stashed
      // the verified googleId + picture on the verification code record.
      // Pick them up here so we can trustlessly link the Google identity
      // without letting the client spoof a googleId.
      const linkedGoogleId = codeRecord.googleId || null;
      const linkedPicture = codeRecord.googlePicture || null;

      const newUser = {
        email: email,
        username: username.toLowerCase(),
        passwordHash,
        profile: {
          fullName,
          gender,
          nationality,
          secondNationality: secondNationality || null,
          residence,
          dob,
          bio,
          portfolioUrl: portfolioUrl || null,
          picture: linkedPicture,
        },
        contact: {
          phone,
          countryCode,
        },
        socials: {
          instagram,
          tiktok: tiktok || null,
          youtube: youtube || null,
        },
        contentCategories: categories || [],
        inviterUsername: inviterUsername ? inviterUsername.toLowerCase().replace(/^@/, "") : null,
        role: "creator", // Default role
        authProvider: linkedGoogleId ? "google" : "email",
        googleId: linkedGoogleId,
        isActive: true,
        marketingOptIn: !!marketingOptIn,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await users.insertOne(newUser);

      // Clean up the used verification record now that the account exists.
      await codes.deleteOne({ email }).catch(() => {});

      // Generate JWT token
      const token = generateToken(
        result.insertedId.toString(),
        newUser.email,
        newUser.role
      );

      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Account created successfully",
          token,
          user: {
            id: result.insertedId.toString(),
            email: newUser.email,
            username: newUser.username,
            profile: newUser.profile,
          },
        }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid action" }),
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Signup failed",
        details: error.message,
      }),
    };
  }
};
