// Shared email footer + one-click unsubscribe links.
//
// Two kinds of email leave this system:
//   "transactional" — verification codes, password resets, account-change
//                     codes. Required to operate the account; no opt-out.
//   "notification"  — referral joined, brand invitation, application status.
//                     Service notifications about actions the user or a brand
//                     took. Footer links to the email-preferences section.
//
// No marketing email is sent anywhere in this codebase today. If one is ever
// added it MUST: (1) only go to users with `marketingOptIn: true`, and
// (2) include `unsubscribeUrl(userId)` in the body — that link works without
// logging in and flips marketingOptIn to false (see email-preferences.js).
const crypto = require("crypto");
const { JWT_SECRET } = require("../auth");

const SITE_URL = (process.env.SITE_URL || "https://www.vivelyglobal.com").replace(/\/$/, "");
const BUSINESS_NAME = "Vively";
const CONTACT_EMAIL = process.env.BREVO_SENDER_EMAIL || "vivelyglobal@gmail.com";

function unsubscribeToken(userId) {
  return crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`unsubscribe:${String(userId)}`)
    .digest("hex")
    .slice(0, 40);
}

function verifyUnsubscribeToken(userId, token) {
  if (!userId || !token) return false;
  const expected = Buffer.from(unsubscribeToken(userId));
  const given = Buffer.from(String(token));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

function unsubscribeUrl(userId) {
  return `${SITE_URL}/unsubscribe.html?u=${encodeURIComponent(String(userId))}&t=${unsubscribeToken(userId)}`;
}

function preferencesUrl() {
  return `${SITE_URL}/my-page.html#email-preferences`;
}

function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// kind: "transactional" | "notification" | "marketing"
function emailFooterHTML({ kind = "transactional", userId = null, reason = "" } = {}) {
  const year = new Date().getFullYear();
  let why = reason;
  if (!why) {
    if (kind === "transactional") why = "This is a service email about your Vively account.";
    else if (kind === "notification") why = "You received this because of activity on your Vively account.";
    else why = "You received this because you opted in to updates from Vively.";
  }
  const links = [`<a href="${SITE_URL}/privacy.html" style="color:#999;">Privacy Policy</a>`];
  if (kind !== "transactional") {
    links.push(`<a href="${preferencesUrl()}" style="color:#999;">Email preferences</a>`);
  }
  if (kind === "marketing" && userId) {
    links.push(`<a href="${unsubscribeUrl(userId)}" style="color:#999;">Unsubscribe</a>`);
  }
  return `
        <tr><td style="padding:16px 32px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:12px;line-height:1.6;">
            ${esc(why)}<br>
            ${links.join(" &middot; ")}<br>
            &copy; ${year} ${esc(BUSINESS_NAME)} &middot; <a href="mailto:${esc(CONTACT_EMAIL)}" style="color:#999;">${esc(CONTACT_EMAIL)}</a>
          </p>
        </td></tr>`;
}

function emailFooterText({ kind = "transactional", userId = null } = {}) {
  const lines = [`Privacy Policy: ${SITE_URL}/privacy.html`];
  if (kind !== "transactional") lines.push(`Email preferences: ${preferencesUrl()}`);
  if (kind === "marketing" && userId) lines.push(`Unsubscribe: ${unsubscribeUrl(userId)}`);
  lines.push(`${BUSINESS_NAME} · ${CONTACT_EMAIL}`);
  return `\n\n--\n${lines.join("\n")}`;
}

module.exports = {
  unsubscribeToken,
  verifyUnsubscribeToken,
  unsubscribeUrl,
  preferencesUrl,
  emailFooterHTML,
  emailFooterText,
};
