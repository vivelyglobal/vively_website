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
//   admin + { purge: "DELETE ALL" }                -> deletes every attendee record (post-event cleanup)
//   admin + { saveContent, baseRev }               -> publishes new page wording
//   content   (public)                             -> { rev, content, termsVersion }
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
const LIMITS = { adminFail: 20, codeFail: 200, register: 300 };
const MIN_CODE_LEN = 6; // env codes shorter than this are treated as "not set up"
const MIN_KEY_LEN = 16;

function clientIp(event) {
  const h = event.headers || {};
  // Trust only the header the current host sets itself. On Render (behind
  // Cloudflare) the caller can forge x-nf-* and the start of x-forwarded-for.
  const trusted = process.env.RENDER ? h["cf-connecting-ip"] : h["x-nf-client-connection-ip"];
  return String(trusted || (h["x-forwarded-for"] || "").split(",").pop() || "unknown").trim();
}
async function getRate() {
  const { db } = await connectToDatabase();
  const col = db.collection("event_rate");
  await col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }).catch(() => {});
  return col;
}
// Count FIRST, compare second. One atomic upsert per attempt, so a burst of parallel guesses
// cannot all slip past the limit. Fixed windows; the TTL index clears old ones.
async function take(key, limit, windowMs = WINDOW_MS) {
  const col = await getRate();
  const bucket = Math.floor(Date.now() / windowMs);
  const id = key + ":" + bucket;
  const resetAt = (bucket + 1) * windowMs;
  const r = await col.findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(resetAt) } },
    { upsert: true, returnDocument: "after" }
  );
  const doc = r && typeof r.count === "number" ? r : r && r.value;
  if (!doc || typeof doc.count !== "number") throw new Error("rate limiter unavailable");
  return { id, resetAt, count: doc.count, ok: doc.count <= limit };
}
// A correct code or key should not use up the allowance.
async function giveBack(slot) {
  const col = await getRate();
  await col.updateOne({ _id: slot.id }, { $inc: { count: -1 } });
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

// ---- Page wording edited on the desk page. Every save is a new revision (never overwritten), so
// the terms a creator agreed to can be looked up later by termsVersion. ----
class BadContent extends Error {}
function cleanContent(c) {
  const obj = (v, label) => {
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new BadContent(label + " is missing.");
    return v;
  };
  const text = (v, label, max, required) => {
    if (typeof v !== "string") throw new BadContent(label + " is missing.");
    const t = v.replace(/\r\n/g, "\n").trim();
    if (required && !t) throw new BadContent(label + " can't be empty.");
    if (t.length > max) throw new BadContent(label + " is too long (max " + max + " characters).");
    return t;
  };
  const list = (v, label, max) => {
    if (!Array.isArray(v) || v.length > max) throw new BadContent(label + " can have up to " + max + " entries.");
    return v;
  };
  const lines = (v, label, max, len) => list(v, label, max).map((x) => text(x, label, len, false)).filter(Boolean);
  const pairs = (v, label, max, len) =>
    list(v, label, max)
      .map((p) => {
        if (!Array.isArray(p)) throw new BadContent(label + " has a broken entry.");
        const q = text(p[0], label + " heading", 200, false);
        const a = text(p[1], label + " text", len, false);
        if (!q !== !a) throw new BadContent(label + ": fill in both boxes, or clear both.");
        return [q, a];
      })
      .filter((p) => p[0]);

  obj(c, "Content");
  const e = obj(c.event, "Event details");
  const w = obj(c.welcome, "Welcome");
  const z = obj(c.prizes, "Prizes");
  const r = obj(c.register, "Sign-in");
  const tp = obj(c.tasksPage, "Stamp page");
  const d = obj(c.done, "Finish screen");
  const f = obj(c.faq, "FAQ");
  if (!Array.isArray(c.tasks) || c.tasks.length !== TASKS) throw new BadContent("There must be " + TASKS + " stops.");
  const terms = pairs(c.terms, "Terms", 20, 2000);
  if (!terms.length) throw new BadContent("Terms can't be empty.");
  return {
    event: {
      dateLabel: text(e.dateLabel, "Date", 60, true),
      chip: text(e.chip, "Date badge", 30, true),
      time: text(e.time, "Time", 60, false),
      place: text(e.place, "Venue", 200, false),
      note: text(e.note, "Today line", 200, false),
    },
    welcome: {
      title: text(w.title, "Welcome title", 80, true),
      lead: text(w.lead, "Welcome intro", 400, false),
      steps: lines(w.steps, "Steps", 6, 120),
      footer: text(w.footer, "Footer line", 120, false),
    },
    prizes: {
      heading: text(z.heading, "Prize heading", 80, false),
      items: lines(z.items, "Prizes", 6, 160),
      note: text(z.note, "Prize note", 300, false),
    },
    register: { title: text(r.title, "Sign-in title", 80, true), lead: text(r.lead, "Sign-in intro", 300, false) },
    tasksPage: { intro: text(tp.intro, "Stamp page intro", 300, false), handoff: text(tp.handoff, "Staff handoff text", 300, false) },
    tasks: c.tasks.map((t, i) => {
      const label = "Stop " + (i + 1);
      obj(t, label);
      return {
        title: text(t.title, label + " name", 60, true),
        instruction: text(t.instruction, label + " instruction", 400, true),
        faq: pairs(t.faq, label + " FAQ", 8, 600),
      };
    }),
    done: { title: text(d.title, "Finish title", 80, true), lead: text(d.lead, "Finish text", 400, false) },
    faq: {
      welcome: pairs(f.welcome, "Welcome FAQ", 12, 600),
      register: pairs(f.register, "Sign-in FAQ", 12, 600),
      tasks: pairs(f.tasks, "Stamp page FAQ", 12, 600),
      done: pairs(f.done, "Finish FAQ", 12, 600),
    },
    terms,
  };
}
async function latestContent() {
  const { db } = await connectToDatabase();
  const rows = await db.collection("event_content").find({}).sort({ _id: -1 }).limit(1).toArray();
  return rows[0] || null;
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
      const slot = await take("admin:" + ip, LIMITS.adminFail);
      if (!slot.ok)
        return reply(429, { error: "Too many wrong keys. Try again in 10 minutes." });
      const sent = event.headers["x-admin-key"] || event.headers["X-Admin-Key"] || "";
      if (!safeEqual(sent, adminKey)) return reply(401, { error: "Wrong key" });
      await giveBack(slot);

      // Publish new wording. baseRev stops two staff members overwriting each other.
      if (body.saveContent !== undefined) {
        let content;
        try {
          content = cleanContent(body.saveContent);
        } catch (e) {
          if (e instanceof BadContent) return reply(400, { error: e.message });
          throw e;
        }
        const current = await latestContent();
        const currentRev = current ? current._id : 0;
        const stale = { error: "Someone else saved changes first. Reload the wording, then edit again." };
        if (body.baseRev !== currentRev) return reply(409, stale);
        // The version changes only when the terms or prizes change.
        const termsVersion =
          "t-" + crypto.createHash("sha256").update(JSON.stringify([content.terms, content.prizes])).digest("hex").slice(0, 12);
        const { db } = await connectToDatabase();
        try {
          await db.collection("event_content").insertOne({ _id: currentRev + 1, content, termsVersion, savedAt: new Date() });
        } catch (e) {
          if (e && e.code === 11000) return reply(409, stale);
          throw e;
        }
        return reply(200, { rev: currentRev + 1, content, termsVersion });
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

    // ---------- public wording ----------
    if (action === "content") {
      const c = await latestContent();
      return reply(200, c ? { rev: c._id, content: c.content, termsVersion: c.termsVersion } : { rev: 0, content: null, termsVersion: "" });
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

      if (!(await take("reg:" + clientIp(event), LIMITS.register)).ok)
        return reply(429, { error: "Too many sign-ups from this connection. Ask staff for help." });

      const existing = await col.findOne({ phone });
      if (existing) {
        // Same phone again (new device / cleared browser): resume ONLY if name and Instagram
        // also match. Otherwise never hand out someone else's token.
        if (norm(existing.name) === norm(name) && norm(existing.instagram) === norm(instagram))
          return reply(200, { token: existing.token, participant: publicView(existing) });
        return reply(409, { error: "This phone number is already checked in. Please ask a Vively staff member." });
      }

      // If staff changed the terms or prizes while this page was open, show the new ones first.
      const published = await latestContent();
      if (published && body.termsVersion !== published.termsVersion)
        return reply(409, { error: "The Terms were just updated. Please read and agree again.", termsChanged: true });

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

      // Reserve an attempt for this person, then for this connection, BEFORE checking the code.
      const mine = await take("p:" + token, MAX_WRONG, LOCK_MS);
      if (!mine.ok) return reply(429, { error: "Too many tries. Wait 30 seconds.", participant: publicView(p) });
      const net = await take("code:" + clientIp(event), LIMITS.codeFail);
      if (!net.ok)
        return reply(429, { error: "Too many wrong codes from this connection. Ask staff." });

      if (!safeEqual(norm(body.code), norm(expected))) {
        const lock = mine.count >= MAX_WRONG;
        if (lock) await col.updateOne({ token }, { $set: { lockedUntil: mine.resetAt } });
        return reply(400, {
          error: lock ? "Too many tries. Wait 30 seconds." : "That code is not right. Check with staff.",
        });
      }
      await giveBack(net);
      await giveBack(mine); // only this attempt; parallel correct taps can't bank extra guesses

      // Atomic, idempotent stamp: only writes if this task is still empty AND the previous one is
      // done. Double/triple submits (or two staff taps) can't stamp twice or overwrite each other.
      const now = new Date();
      const idx = task - 1;
      const filter = { token, ["tasks." + idx]: null };
      if (idx > 0) filter["tasks." + (idx - 1)] = { $ne: null };
      const upd = await col.updateOne(filter, { $set: { ["tasks." + idx]: now, lockedUntil: 0 } });
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
