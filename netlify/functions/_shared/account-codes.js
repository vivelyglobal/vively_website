// One-time email codes that gate sensitive account actions (profile edits,
// account deletion). One active code per user+purpose, 10 minute expiry,
// 5 attempts, 60s resend cooldown.
const crypto = require("crypto");
const { getAccountCodesCollection } = require("../db");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "noreply@vivelyglobal.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Vively";
const IS_DEV = process.env.NODE_ENV !== "production";

const PURPOSES = {
  "update-profile": {
    subject: "Your Vively code to confirm profile changes",
    title: "Confirm your profile changes",
    body: "Enter this code on My Page to save the changes to your account.",
  },
  "delete-account": {
    subject: "Your Vively code to delete your account",
    title: "Confirm account deletion",
    body: "Enter this code on My Page to permanently delete your Vively account. If this wasn't you, ignore this email and consider changing your password.",
  },
};

const TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function isValidPurpose(purpose) {
  return Object.prototype.hasOwnProperty.call(PURPOSES, purpose);
}

function buildHTML({ title, body, code }) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#111;letter-spacing:-0.5px;">Vively</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;text-align:center;">
          <h2 style="margin:16px 0 8px;font-size:20px;color:#111;">${title}</h2>
          <p style="margin:0;color:#666;font-size:14px;line-height:1.5;">${body} This code expires in 10 minutes.</p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;text-align:center;">
          <div style="display:inline-block;padding:16px 24px;background:#faf5f5;border:1px solid #f0dcdc;border-radius:8px;font-size:32px;font-weight:700;letter-spacing:8px;color:#b13a3a;font-family:'Courier New',monospace;">${code}</div>
        </td></tr>
        <tr><td style="padding:16px 32px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:12px;line-height:1.5;">&copy; ${new Date().getFullYear()} Vively Global</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendCodeEmail(email, purpose, code) {
  const copy = PURPOSES[purpose];
  if (IS_DEV) console.log(`[DEV] ${purpose} code for ${email}: ${code}`);
  if (!BREVO_API_KEY) return { sent: false, reason: "no-api-key" };
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email }],
        subject: copy.subject,
        htmlContent: buildHTML({ ...copy, code }),
        textContent: `${copy.title}\n\n${copy.body}\n\nYour code: ${code}\n\nThis code expires in 10 minutes.`,
      }),
    });
    if (!res.ok) {
      console.error(`[email] Brevo ${purpose} send failed (${res.status})`);
      return { sent: false, reason: "brevo-error" };
    }
    return { sent: true };
  } catch (error) {
    console.error("[email] account code send error:", error);
    return { sent: false, reason: "exception" };
  }
}

// Returns { ok, retryAfterSeconds?, devCode? }
async function issueCode(userId, email, purpose) {
  const codes = await getAccountCodesCollection();
  const existing = await codes.findOne({ userId, purpose });
  if (existing && Date.now() - new Date(existing.createdAt).getTime() < RESEND_COOLDOWN_MS) {
    const retryAfterSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - new Date(existing.createdAt).getTime())) / 1000
    );
    return { ok: false, retryAfterSeconds };
  }
  const code = String(crypto.randomInt(100000, 1000000));
  const now = new Date();
  await codes.updateOne(
    { userId, purpose },
    { $set: { userId, purpose, code, attempts: 0, createdAt: now, expiresAt: new Date(now.getTime() + TTL_MS) } },
    { upsert: true }
  );
  const emailResult = await sendCodeEmail(email, purpose, code);
  const out = { ok: true, emailSent: emailResult.sent === true };
  if (IS_DEV) out.devCode = code;
  return out;
}

// Returns { ok } or { ok:false, error }
async function consumeCode(userId, purpose, submitted) {
  const codes = await getAccountCodesCollection();
  const record = await codes.findOne({ userId, purpose });
  if (!record) return { ok: false, error: "No verification code requested. Send a code first." };
  if (new Date() > new Date(record.expiresAt)) {
    await codes.deleteOne({ _id: record._id });
    return { ok: false, error: "Code expired. Request a new one." };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await codes.deleteOne({ _id: record._id });
    return { ok: false, error: "Too many attempts. Request a new code." };
  }
  if (String(submitted || "").trim() !== record.code) {
    await codes.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    return { ok: false, error: "Invalid verification code" };
  }
  await codes.deleteOne({ _id: record._id });
  return { ok: true };
}

module.exports = { isValidPurpose, issueCode, consumeCode };
