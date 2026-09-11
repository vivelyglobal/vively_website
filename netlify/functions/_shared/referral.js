// Referral / affiliate helpers shared by auth-signup and me.
const crypto = require("crypto");

// No 0/O/1/I so codes read unambiguously when typed from a screenshot.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_PREFIX = "VLY-";
const CODE_LENGTH = 6;

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "noreply@vivelyglobal.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Vively";
const SITE_URL = (process.env.SITE_URL || "https://www.vivelyglobal.com").replace(/\/$/, "");
const IS_DEV = process.env.NODE_ENV !== "production";

function randomCode() {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return CODE_PREFIX + out;
}

function normalizeCode(value) {
  const raw = String(value || "").trim().toUpperCase().replace(/\s+/g, "");
  if (!raw) return "";
  return raw.startsWith(CODE_PREFIX) ? raw : CODE_PREFIX + raw;
}

function isValidCodeFormat(code) {
  return new RegExp(`^${CODE_PREFIX}[${ALPHABET}]{${CODE_LENGTH}}$`).test(code);
}

// Assigns a unique code to a user document that doesn't have one yet
// (accounts created before the referral feature). Returns the code.
async function ensureReferralCode(users, user) {
  if (user.referralCode) return user.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      const result = await users.updateOne(
        { _id: user._id, referralCode: { $exists: false } },
        { $set: { referralCode: code, referralCount: user.referralCount || 0, updatedAt: new Date() } }
      );
      if (result.matchedCount === 0) {
        const fresh = await users.findOne({ _id: user._id }, { projection: { referralCode: 1 } });
        return fresh?.referralCode || null;
      }
      return code;
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
  }
  throw new Error("Could not allocate a unique referral code");
}

// Same idea for brand-new users: pick a code that doesn't collide before insert.
async function allocateReferralCode(users) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const taken = await users.findOne({ referralCode: code }, { projection: { _id: 1 } });
    if (!taken) return code;
  }
  throw new Error("Could not allocate a unique referral code");
}

function referralLink(code) {
  return `${SITE_URL}/?ref=${encodeURIComponent(code)}`;
}

function buildReferralEmailHTML({ referrerName, newUsername, code }) {
  const myPageUrl = `${SITE_URL}/my-page.html`;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#111;letter-spacing:-0.5px;">Vively</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 20px;text-align:center;">
          <h2 style="margin:16px 0 8px;font-size:20px;color:#111;">Someone joined with your code</h2>
          <p style="margin:0;color:#666;font-size:14px;line-height:1.6;">
            Hi ${referrerName || "there"},<br />
            <strong>@${newUsername}</strong> just created a Vively account using your referral code
            <span style="display:inline-block;padding:2px 8px;background:#faf5f5;border:1px solid #f0dcdc;border-radius:6px;font-family:'Courier New',monospace;font-weight:700;color:#b13a3a;">${code}</span>.
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <a href="${myPageUrl}" style="display:inline-block;padding:12px 22px;background:#e0362c;color:#fff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:700;">View on My Page</a>
        </td></tr>
        <tr><td style="padding:16px 32px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:12px;line-height:1.5;">&copy; ${new Date().getFullYear()} Vively Global</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendReferralEmail({ to, referrerName, newUsername, code }) {
  if (IS_DEV) console.log(`[DEV] Referral notification for ${to}: @${newUsername} used ${code}`);
  if (!BREVO_API_KEY) return { sent: false, reason: "no-api-key" };
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        subject: `@${newUsername} joined Vively with your referral code`,
        htmlContent: buildReferralEmailHTML({ referrerName, newUsername, code }),
        textContent: `@${newUsername} just created a Vively account using your referral code ${code}. See who's joined on your My Page: ${SITE_URL}/my-page.html`,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Brevo referral send failed (${res.status}):`, body.slice(0, 300));
      return { sent: false, reason: "brevo-error" };
    }
    return { sent: true };
  } catch (error) {
    console.error("[email] Referral send error:", error);
    return { sent: false, reason: "exception" };
  }
}

module.exports = {
  CODE_PREFIX,
  normalizeCode,
  isValidCodeFormat,
  ensureReferralCode,
  allocateReferralCode,
  referralLink,
  sendReferralEmail,
};
