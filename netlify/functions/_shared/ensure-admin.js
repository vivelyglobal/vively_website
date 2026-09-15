// Keeps the admin account in sync with ADMIN_EMAIL / ADMIN_PASSWORD env vars:
// creates it if missing, resets the password if it no longer matches.
const { getUsersCollection, getBrandsCollection } = require("../db");
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

// Optional test brand for the brand portal (login + dashboard + Find Creators).
// Only created when DEMO_BRAND_EMAIL / DEMO_BRAND_PASSWORD are set; always
// forced to status "approved" so login works without admin review.
async function ensureDemoBrand() {
  const email = (process.env.DEMO_BRAND_EMAIL || "").trim().toLowerCase();
  const password = process.env.DEMO_BRAND_PASSWORD || "";
  if (!email || !password) {
    return { skipped: true, reason: "DEMO_BRAND_EMAIL / DEMO_BRAND_PASSWORD not set" };
  }

  const brands = await getBrandsCollection();
  const existing = await brands.findOne({ email });
  const now = new Date();

  if (!existing) {
    await brands.insertOne({
      email,
      passwordHash: await hashPassword(password),
      role: "brand",
      status: "approved",
      isDemo: true,
      createdAt: now,
      updatedAt: now,
      companyName: "Vively Demo Brand",
      industry: "Beauty",
      industryOther: null,
      address: "Seongsu-dong, Seoul",
      website: "https://www.vivelyglobal.com",
      phone: "02-000-0000",
      businessRegNumber: "000-00-00000",
      businessRegCert: null,
      repName: "Demo Manager",
      repTitle: "Marketing Manager",
      repEmail: email,
      influencerTypes: ["Micro"],
      targetRegions: ["Indonesia", "Japan"],
      contentCategories: ["Beauty", "Lifestyle"],
      budgetRange: "₩1,000,000 - ₩3,000,000",
      notes: "Auto-created test account (DEMO_BRAND_EMAIL).",
    });
    return { created: true, email };
  }

  const update = {};
  if (existing.status !== "approved") update.status = "approved";
  const passwordMatches = existing.passwordHash
    ? await comparePassword(password, existing.passwordHash)
    : false;
  if (!passwordMatches) update.passwordHash = await hashPassword(password);
  if (Object.keys(update).length === 0) return { unchanged: true, email };

  update.updatedAt = now;
  await brands.updateOne({ _id: existing._id }, { $set: update });
  return { updated: Object.keys(update).filter((k) => k !== "updatedAt"), email };
}

module.exports = { ensureAdminAccount, ensureDemoBrand };
