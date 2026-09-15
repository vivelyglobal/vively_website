// Keeps the admin account in sync with ADMIN_EMAIL / ADMIN_PASSWORD env vars:
// creates it if missing, resets the password if it no longer matches.
const { getUsersCollection } = require("../db");
const { hashPassword, comparePassword } = require("../auth");

async function ensureAdminAccount() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || !password) {
    return { skipped: true, reason: "ADMIN_EMAIL / ADMIN_PASSWORD not set" };
  }

  const users = await getUsersCollection();
  const existing = await users.findOne({ email });
  const now = new Date();

  if (!existing) {
    await users.insertOne({
      email,
      name: "Admin",
      username: "admin",
      passwordHash: await hashPassword(password),
      role: "admin",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    return { created: true, email };
  }

  const update = {};
  if (existing.role !== "admin" && existing.role !== "super_admin") update.role = "admin";
  if (existing.isActive === false) update.isActive = true;
  const passwordMatches = existing.passwordHash
    ? await comparePassword(password, existing.passwordHash)
    : false;
  if (!passwordMatches) update.passwordHash = await hashPassword(password);

  if (Object.keys(update).length === 0) return { unchanged: true, email };

  update.updatedAt = now;
  await users.updateOne({ _id: existing._id }, { $set: update });
  return { updated: Object.keys(update).filter((k) => k !== "updatedAt"), email };
}

module.exports = { ensureAdminAccount };
