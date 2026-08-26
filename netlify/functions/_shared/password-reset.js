// Shared password-reset token lifecycle — used by auth-login.js (creators +
// admins, both live in the `users` collection) and auth-brand.js (brands).
// Keeping token generation / email / consumption in one place means both
// account types behave identically and only get fixed once.
const crypto = require("crypto");
const { getPasswordResetTokensCollection } = require("../db");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL =
  process.env.BREVO_SENDER_EMAIL || "noreply@vivelyglobal.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Vively";
const SITE_URL = (process.env.SITE_URL || "http://localhost:8888").replace(/\/$/, "");
const IS_DEV = process.env.NODE_ENV !== "production";
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

function buildResetEmailHTML(resetUrl) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#111;letter-spacing:-0.5px;">Vively</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;text-align:center;">
          <h2 style="margin:16px 0 8px;font-size:20px;color:#111;">Reset your password</h2>
          <p style="margin:0;color:#666;font-size:14px;line-height:1.5;">
            Click the button below to choose a new password. This link expires in 30 minutes.
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;background:#b13a3a;color:#fff;border-radius:8px;font-size:15px;font-weight:700;text-decoration:none;">
            Reset Password
          </a>
        </td></tr>
        <tr><td style="padding:16px 32px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:12px;line-height:1.5;">
            Didn't request this? You can safely ignore this email — your password won't change.<br>
            &copy; ${new Date().getFullYear()} Vively Global
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendResetEmail(email, resetUrl) {
  if (IS_DEV) console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);

  if (!BREVO_API_KEY) {
    console.warn(
      "[email] BREVO_API_KEY not set — reset email not sent. Add it to .env.local to enable delivery."
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
        subject: "Reset your Vively password",
        htmlContent: buildResetEmailHTML(resetUrl),
        textContent: `Reset your Vively password: ${resetUrl}\n\nThis link expires in 30 minutes. If you didn't request this, ignore this email.`,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Brevo reset send failed (${res.status}):`, body.slice(0, 500));
      return { sent: false, reason: "brevo-error", status: res.status };
    }

    const data = await res.json().catch(() => ({}));
    return { sent: true, messageId: data.messageId };
  } catch (error) {
    console.error("[email] Reset send exception:", error);
    return { sent: false, reason: "exception", error: error.message };
  }
}

// accountType: "user" | "brand". Always call this even when the email
// wasn't found — the caller should return the same generic response either
// way, so requesting a reset can't be used to enumerate registered emails.
async function requestPasswordReset(email, accountType) {
  const tokens = await getPasswordResetTokensCollection();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  // Requesting again invalidates any link already sent.
  await tokens.deleteMany({ email, accountType });
  await tokens.insertOne({ email, accountType, token, expiresAt, createdAt: new Date() });

  const resetUrl = `${SITE_URL}/reset-password.html?token=${token}&type=${accountType}`;
  const emailResult = await sendResetEmail(email, resetUrl);
  return { token, resetUrl, emailResult };
}

// Returns the token record (and deletes it — single use) or null if the
// token doesn't exist or has expired.
async function consumeResetToken(token, accountType) {
  const tokens = await getPasswordResetTokensCollection();
  const record = await tokens.findOne({ token, accountType });
  if (!record) return null;

  await tokens.deleteOne({ _id: record._id });
  if (new Date() > new Date(record.expiresAt)) return null;
  return record;
}

function validateNewPassword(password) {
  if (!password || typeof password !== "string") return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number";
  }
  return null;
}

module.exports = { requestPasswordReset, consumeResetToken, validateNewPassword };
