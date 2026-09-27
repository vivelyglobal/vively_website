// One-click unsubscribe from marketing email. No login required: the link in
// the email carries an HMAC token bound to the user id (see
// _shared/email-footer.js), so only someone holding that email can use it.
// Deliberately does nothing else — service/transactional email is unaffected.
const { ObjectId } = require("mongodb");
const { getUsersCollection } = require("./db");
const { verifyUnsubscribeToken } = require("./_shared/email-footer");
const { json, preflight, clientIp } = require("./_shared/http");
const { enforce, MINUTE } = require("./_shared/rate-limit");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflight("POST, OPTIONS", "Content-Type");
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const limited = await enforce([
    { key: `unsub:ip:${clientIp(event)}`, limit: 20, windowMs: 15 * MINUTE },
  ]);
  if (limited) return limited;

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const { u: userIdRaw, t: token } = body;
  let userId;
  try {
    userId = new ObjectId(String(userIdRaw || ""));
  } catch {
    return json(400, { error: "This unsubscribe link is not valid." });
  }
  if (!verifyUnsubscribeToken(userId, token)) {
    return json(400, { error: "This unsubscribe link is not valid." });
  }

  try {
    const users = await getUsersCollection();
    const now = new Date();
    const result = await users.updateOne(
      { _id: userId },
      {
        $set: {
          marketingOptIn: false,
          "consents.marketing": { optIn: false, updatedAt: now, source: "unsubscribe-link" },
          updatedAt: now,
        },
      }
    );
    // Same response whether or not the account still exists — the link is
    // only ever sent to the account holder, and this avoids confirming
    // account existence to anyone else.
    return json(200, { ok: true, unsubscribed: result.matchedCount > 0 || true });
  } catch (error) {
    console.error("email-preferences error:", error);
    return json(500, { error: "Could not update your preferences. Please try again." });
  }
};
