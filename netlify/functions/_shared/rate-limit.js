// Fixed-window rate limiter backed by MongoDB, so it works across Netlify
// Function instances and Render restarts (an in-memory Map would not).
// Counters are keyed by caller-supplied strings (e.g. "login:ip:1.2.3.4") and
// expire automatically via a TTL index. If the database is unreachable the
// check FAILS OPEN (allows the request) so a DB hiccup can never lock every
// user out of login.
const { getRateLimitsCollection } = require("../db");

async function rateLimit(key, { limit, windowMs }) {
  try {
    const col = await getRateLimitsCollection();
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const _id = `${key}:${windowStart}`;
    const result = await col.findOneAndUpdate(
      { _id },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date(windowStart + windowMs * 2) },
      },
      { upsert: true, returnDocument: "after" }
    );
    // Driver v6+ returns the document; older drivers wrap it in { value }.
    const doc = result && result.value !== undefined ? result.value : result;
    const count = (doc && doc.count) || 1;
    if (count > limit) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000)),
      };
    }
    return { ok: true, remaining: limit - count };
  } catch (error) {
    console.error("[rate-limit] check failed, allowing request:", error && error.message);
    return { ok: true, remaining: limit };
  }
}

function tooManyRequests(retryAfterSeconds, message) {
  return {
    statusCode: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSeconds),
    },
    body: JSON.stringify({
      error: message || "Too many attempts. Please wait a moment and try again.",
      retryAfterSeconds,
    }),
  };
}

// Convenience: run several limits and return the first 429 (or null).
async function enforce(checks) {
  for (const { key, limit, windowMs, message } of checks) {
    const r = await rateLimit(key, { limit, windowMs });
    if (!r.ok) return tooManyRequests(r.retryAfterSeconds, message);
  }
  return null;
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

module.exports = { rateLimit, tooManyRequests, enforce, MINUTE, HOUR };
