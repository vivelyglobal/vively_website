// Event stamp rally backend (Vively Thanks-Giving event).
//
// Staff codes and the admin key live ONLY in Netlify environment variables:
//   EVENT_CODE_1, EVENT_CODE_2, EVENT_CODE_3   (one secret code per task)
//   EVENT_ADMIN_KEY                            (opens event-admin.html)
// They are never sent to the browser. Do not hard-code them here.
//
// One POST endpoint: /api/event-stamps   body: { action, ... }
//   register  { name, phone, instagram, consent, terms, termsVersion } -> { token, participant }
//   status    { token }                            -> { participant }
//   complete  { token, task, code }                -> { participant }
//   admin     (header x-admin-key)                 -> { participants, counts }
//   admin + { purge: "DELETE ALL" }                -> deletes every record (post-event cleanup)
const crypto = require("crypto");
const { connectToDatabase } = require("./db");

const TASKS = 3;
const MAX_WRONG = 5; // wrong codes before a short lock
const LOCK_MS = 30 * 1000;

const HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};
const reply = (status, body) => ({
  statusCode: status,
  headers: HEADERS,
  body: JSON.stringify(body),
});

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const norm = (s) => String(s || "").trim().toLowerCase();

// ---- per-IP limiter (Mongo, auto-expiring). Venue wifi shares one IP, so limits are generous
// for normal use but stop scripted guessing. ----
const WINDOW_MS = 10 * 60 * 1000;
const LIMITS = { adminFail: 8, codeFail: 40, register: 60 };
const MIN_CODE_LEN = 6; // env codes shorter than this are treated as "not set up"
const MIN_KEY_LEN = 16;

function clientIp(event) {
  const h = event.headers || {};
  return String(
    h["x-nf-client-connection-ip"] || (h["x-forwarded-for"] || "").split(",")[0] || "unknown"
  ).trim();
}
async function getRate() {
  const { db } = await connectToDatabase();
  const col = db.collection("event_rate");
  await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  return col;
}
async function isBlocked(key, limit) {
  const col = await getRate();
  const d = await col.findOne({ key });
  return !!(d && d.expiresAt > new Date() && d.count >= limit);
}
async function bump(key) {
  const col = await getRate();
  const d = await col.findOne({ key });
  const now = new Date();
  if (d && d.expiresAt > now) await col.updateOne({ key }, { $inc: { count: 1 } });
  else await col.updateOne({ key }, { $set: { count: 1, expiresAt: new Date(now.getTime() + WINDOW_MS) } }, { upsert: true });
}

// Atomic counter: hands every sign-up its own entry number even when 50 people scan at once.
// (Numbers can have gaps if a sign-up is rejected afterwards; that is fine for a draw list.)
async function nextEntryNo() {
  const { db } = await connectToDatabase();
  const r = await db
    .collection("event_counters")
    .findOneAndUpdate({ _id: "entry" }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
  const doc = r && typeof r.seq === "number" ? r : r && r.value; // driver v6+ returns the doc; older returns {value}
  if (!doc || typeof doc.seq !== "number") throw new Error("entry counter unavailable");
  return doc.seq;
}

async function getCol() {
  const { db } = await connectToDatabase();
  const col = db.collection("event_stamps");
  await col.createIndex({ token: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ phone: 1 }, { unique: true }).catch(() => {});
  await col.createIndex({ entryNo: 1 }, { unique: true }).catch(() => {});
  return col;
}

// What the browser is allowed to see about its own record.
function publicView(p) {
  return {
    name: p.name,
    entryNo: p.entryNo,
    done: (p.tasks || []).map((t) => !!t),
    completedAt: p.completedAt || null,
    lockedUntil: p.lockedUntil && p.lockedUntil > Date.now() ? p.lockedUntil : 0,
  };
}

function cleanPhone(raw) {
  const s = String(raw || "").replace(/[^\d+]/g, "");
  const digits = s.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return s.startsWith("+") ? "+" + digits : digits;
}

function cleanInstagram(raw) {
  let s = String(raw || "").trim();
  s = s.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  s = s.replace(/^@/, "").split(/[/?#]/)[0];
  return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s : null;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return reply(405, { error: "POST only" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return reply(400, { error: "Bad request" });
  }
  if (!body || typeof body !== "object") return reply(400, { error: "Bad request" });
  const action = body.action;

  try {
    // ---------- admin ----------
    if (action === "admin") {
      const adminKey = process.env.EVENT_ADMIN_KEY;
      if (!adminKey || adminKey.length < MIN_KEY_LEN)
        return reply(503, { error: "Admin key not configured (needs 16+ characters)" });
      const ip = clientIp(event);
      if (await isBlocked("admin:" + ip, LIMITS.adminFail))
        return reply(429, { error: "Too many wrong keys. Try again in 10 minutes." });
      const sent = event.headers["x-admin-key"] || event.headers["X-Admin-Key"] || "";
      if (!safeEqual(sent, adminKey)) {
        await bump("admin:" + ip);
        return reply(401, { error: "Wrong key" });
      }

      const col = await getCol();

      // Wipe everything after the event (the page promises deletion). Needs the exact phrase.
      if (body.purge !== undefined) {
        if (body.purge !== "DELETE ALL") return reply(400, { error: "Type DELETE ALL to confirm." });
        const r = await col.deleteMany({});
        const rate = await getRate();
        await rate.deleteMany({});
        const { db } = await connectToDatabase();
        await db.collection("event_counters").deleteMany({}); // next event starts at #1
        console.log("event-stamps: purged", r.deletedCount, "records"); // count only, no PII
        return reply(200, { deleted: r.deletedCount });
      }

      const rows = await col.find({}).sort({ entryNo: 1 }).toArray();
      const participants = rows.map((p) => ({
        termsAt: p.termsAt || null,
        termsVersion: p.termsVersion || "",
        entryNo: p.entryNo,
        name: p.name,
        phone: p.phone,
        instagram: p.instagram,
        registeredAt: p.registeredAt,
        tasks: p.tasks || [null, null, null],
        completedAt: p.completedAt || null,
      }));
      return reply(200, {
        participants,
        counts: {
          registered: participants.length,
          finished: participants.filter((p) => p.completedAt).length,
        },
      });
    }

    const col = await getCol();

    // ---------- register ----------
    if (action === "register") {
      const name = String(body.name || "").trim().slice(0, 80);
      const phone = cleanPhone(body.phone);
      const instagram = cleanInstagram(body.instagram);
      if (!name) return reply(400, { error: "Please enter your name." });
      if (!phone) return reply(400, { error: "Please enter a valid phone number." });
      if (!instagram) return reply(400, { error: "Please enter your Instagram handle or link." });
      if (body.terms !== true)
        return reply(400, { error: "Please read and agree to the Terms & Conditions to join." });
      if (body.consent !== true)
        return reply(400, { error: "Please tick the box so we can keep your details." });

      const regKey = "reg:" + clientIp(event);
      if (await isBlocked(regKey, LIMITS.register))
        return reply(429, { error: "Too many sign-ups from this connection. Ask staff for help." });
      await bump(regKey);

      const existing = await col.findOne({ phone });
      if (existing) {
        // Same phone again (new device / cleared browser): resume ONLY if name and Instagram
        // also match. Otherwise never hand out someone else's token.
        if (norm(existing.name) === norm(name) && norm(existing.instagram) === norm(instagram))
          return reply(200, { token: existing.token, participant: publicView(existing) });
        return reply(409, { error: "This phone number is already checked in. Please ask a Vively staff member." });
      }

      const token = crypto.randomBytes(24).toString("hex");
      // entryNo has a unique index; if two sign-ups collide, recompute and retry.
      for (let attempt = 0; attempt < 6; attempt++) {
        const entryNo = await nextEntryNo();
        const doc = {
          token,
          entryNo,
          name,
          phone,
          instagram,
          consentAt: new Date(),
          termsAt: new Date(),
          termsVersion: String(body.termsVersion || "").slice(0, 40),
          registeredAt: new Date(),
          tasks: [null, null, null],
          wrong: 0,
          lockedUntil: 0,
          completedAt: null,
        };
        try {
          await col.insertOne(doc);
          return reply(200, { token, participant: publicView(doc) });
        } catch (e) {
          // Only a duplicate-key error is expected here; anything else (network, auth) is a real
          // failure and must not be retried silently.
          if (!e || e.code !== 11000) throw e;
          // Duplicate key: either the same phone just signed up (double/triple tap, two requests in
          // flight) or two people hit the same entryNo. Same phone => treat as the same person.
          const ex = await col.findOne({ phone });
          if (ex) {
            if (norm(ex.name) === norm(name) && norm(ex.instagram) === norm(instagram))
              return reply(200, { token: ex.token, participant: publicView(ex) });
            return reply(409, { error: "This phone number is already checked in. Please ask a Vively staff member." });
          }
          // else entryNo collision: loop and try the next number
        }
      }
      return reply(409, { error: "Busy, please tap again." });
    }

    // ---------- status / complete need a participant ----------
    const token = String(body.token || "");
    if (!/^[a-f0-9]{48}$/.test(token)) return reply(401, { error: "Please register again." });
    const p = await col.findOne({ token });
    if (!p) return reply(401, { error: "Please register again." });

    if (action === "status") return reply(200, { participant: publicView(p) });

    if (action === "complete") {
      const task = Number(body.task);
      if (!Number.isInteger(task) || task < 1 || task > TASKS)
        return reply(400, { error: "Unknown task." });

      const tasks = p.tasks || [null, null, null];
      if (tasks[task - 1]) return reply(200, { participant: publicView(p) }); // already done
      if (task > 1 && !tasks[task - 2])
        return reply(400, { error: "Finish the earlier task first." });

      if (p.lockedUntil && p.lockedUntil > Date.now()) {
        return reply(429, {
          error: "Too many tries. Wait a moment, then ask staff again.",
          participant: publicView(p),
        });
      }

      const expected = process.env["EVENT_CODE_" + task];
      if (!expected || expected.length < MIN_CODE_LEN)
        return reply(503, { error: "Task code not set up yet. Ask staff." });

      const failKey = "code:" + clientIp(event);
      if (await isBlocked(failKey, LIMITS.codeFail))
        return reply(429, { error: "Too many wrong codes from this connection. Ask staff." });

      if (!safeEqual(norm(body.code), norm(expected))) {
        await bump(failKey);
        // Atomic increment so parallel guesses can't all read wrong=0.
        await col.updateOne({ token }, { $inc: { wrong: 1 } });
        const after = await col.findOne({ token });
        const lock = (after.wrong || 0) >= MAX_WRONG;
        if (lock) await col.updateOne({ token }, { $set: { wrong: 0, lockedUntil: Date.now() + LOCK_MS } });
        return reply(400, {
          error: lock ? "Too many tries. Wait 30 seconds." : "That code is not right. Check with staff.",
        });
      }

      // Atomic, idempotent stamp: only writes if this task is still empty AND the previous one is
      // done. Double/triple submits (or two staff taps) can't stamp twice or overwrite each other.
      const now = new Date();
      const idx = task - 1;
      const filter = { token, ["tasks." + idx]: null };
      if (idx > 0) filter["tasks." + (idx - 1)] = { $ne: null };
      const upd = await col.updateOne(filter, { $set: { ["tasks." + idx]: now, wrong: 0, lockedUntil: 0 } });
      let fresh = await col.findOne({ token });
      if (upd && upd.modifiedCount === 0 && !(fresh.tasks || [])[idx]) {
        // Nothing was written and the stop is still empty: the earlier stop isn't done.
        return reply(400, { error: "Finish the earlier task first." });
      }
      if ((fresh.tasks || []).every(Boolean) && !fresh.completedAt) {
        await col.updateOne({ token, completedAt: null }, { $set: { completedAt: now } });
        fresh = await col.findOne({ token });
      }
      return reply(200, { participant: publicView(fresh) });
    }

    return reply(400, { error: "Unknown action" });
  } catch (err) {
    console.error("event-stamps error:", err.message); // no body/PII in logs
    return reply(500, { error: "Something went wrong. Please try again." });
  }
};
