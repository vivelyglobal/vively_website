// Creator "My Page": profile, referral code + who used it, notifications,
// and email-verified account changes (profile edits, account deletion).
const { ObjectId } = require("mongodb");
const {
  getUsersCollection,
  getReferralsCollection,
  getNotificationsCollection,
  getApplicationsCollection,
  getCampaignsCollection,
  getInvitationsCollection,
} = require("./db");
const { verifyRequest } = require("./auth");
const { ensureReferralCode, referralLink } = require("./_shared/referral");
const { isValidPurpose, issueCode, consumeCode } = require("./_shared/account-codes");
const { deleteCreatorAccount } = require("./_shared/account-deletion");
const { preflight } = require("./_shared/http");

const JSON_HEADERS = { "Content-Type": "application/json" };

function json(statusCode, body, extraHeaders = {}) {
  return { statusCode, headers: { ...JSON_HEADERS, ...extraHeaders }, body: JSON.stringify(body) };
}

function str(v, max = 200) {
  return String(v ?? "").trim().slice(0, max);
}

function cleanHandle(v) {
  return str(v, 60).replace(/^@+/, "");
}

function publicProfile(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    fullName: user.profile?.fullName || user.name || "",
    picture: user.profile?.picture || user.picture || null,
    bio: user.profile?.bio || "",
    portfolioUrl: user.profile?.portfolioUrl || "",
    phone: user.contact?.phone || "",
    countryCode: user.contact?.countryCode || "+82",
    instagram: cleanHandle(user.socials?.instagram),
    tiktok: cleanHandle(user.socials?.tiktok),
    youtube: cleanHandle(user.socials?.youtube),
    instagramFollowers: user.stats?.instagramFollowers ?? "",
    tiktokFollowers: user.stats?.tiktokFollowers ?? "",
    youtubeSubscribers: user.stats?.youtubeSubscribers ?? "",
    marketingOptIn: user.marketingOptIn === true,
    policyVersion: user.consents?.policyVersion || null,
    createdAt: user.createdAt,
  };
}

// Validates + normalizes the editable fields. Returns { $set } or { error }.
async function buildProfileUpdate(users, user, changes) {
  const set = {};
  const c = changes || {};

  if (c.username !== undefined) {
    const username = str(c.username, 30).toLowerCase().replace(/^@+/, "");
    if (!/^[a-z0-9._]{3,30}$/.test(username)) {
      return { error: "Username must be 3-30 characters: letters, numbers, dots or underscores", field: "username" };
    }
    if (username !== user.username) {
      const taken = await users.findOne({ username, _id: { $ne: user._id } }, { projection: { _id: 1 } });
      if (taken) return { error: "Username already taken", field: "username" };
      set.username = username;
    }
  }
  if (c.fullName !== undefined) {
    const fullName = str(c.fullName, 80);
    if (!fullName) return { error: "Full name is required", field: "fullName" };
    set["profile.fullName"] = fullName;
  }
  if (c.instagram !== undefined) {
    const instagram = cleanHandle(c.instagram);
    if (!instagram) return { error: "Instagram is required", field: "instagram" };
    set["socials.instagram"] = instagram;
  }
  if (c.tiktok !== undefined) set["socials.tiktok"] = cleanHandle(c.tiktok) || null;
  if (c.youtube !== undefined) set["socials.youtube"] = cleanHandle(c.youtube) || null;
  if (c.phone !== undefined) {
    const phone = str(c.phone, 20).replace(/[\s-]/g, "");
    if (!/^\d{7,15}$/.test(phone)) return { error: "Phone must be 7-15 digits", field: "phone" };
    set["contact.phone"] = phone;
  }
  if (c.countryCode !== undefined) {
    const cc = str(c.countryCode, 6);
    if (!/^\+\d{1,4}$/.test(cc)) return { error: "Invalid country code", field: "countryCode" };
    set["contact.countryCode"] = cc;
  }
  for (const key of ["instagramFollowers", "tiktokFollowers", "youtubeSubscribers"]) {
    if (c[key] === undefined) continue;
    const raw = str(c[key], 20).replace(/[,\s]/g, "");
    if (raw === "") { set[`stats.${key}`] = null; continue; }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 1e9) return { error: "Follower counts must be whole numbers", field: key };
    set[`stats.${key}`] = n;
  }
  if (c.bio !== undefined) set["profile.bio"] = str(c.bio, 500);
  if (c.portfolioUrl !== undefined) {
    const url = str(c.portfolioUrl, 300);
    if (url && !/^https?:\/\/\S+$/i.test(url)) return { error: "Portfolio URL must start with http:// or https://", field: "portfolioUrl" };
    set["profile.portfolioUrl"] = url || null;
  }

  if (Object.keys(set).length === 0) return { error: "No changes to save" };
  return { set };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return preflight("GET, POST, OPTIONS");

  const auth = verifyRequest(event);
  if (auth.error) return json(auth.status, { error: auth.error });

  let userId;
  try {
    userId = new ObjectId(auth.user.userId);
  } catch {
    return json(401, { error: "Invalid token subject" });
  }

  try {
    const users = await getUsersCollection();
    const user = await users.findOne({ _id: userId });
    if (!user || user.isActive === false) return json(404, { error: "Account not found" });

    const notifications = await getNotificationsCollection();

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { action } = body;

      if (action === "mark-notifications-read") {
        await notifications.updateMany({ userId, read: false }, { $set: { read: true, readAt: new Date() } });
        return json(200, { ok: true });
      }

      if (action === "request-code") {
        if (!isValidPurpose(body.purpose)) return json(400, { error: "Invalid purpose" });
        const result = await issueCode(userId, user.email, body.purpose);
        if (!result.ok) {
          return json(429, { error: `Please wait ${result.retryAfterSeconds}s before requesting another code`, retryAfterSeconds: result.retryAfterSeconds });
        }
        return json(200, { ok: true, email: user.email, emailSent: result.emailSent, devCode: result.devCode });
      }

      if (action === "update-profile") {
        const built = await buildProfileUpdate(users, user, body.changes);
        if (built.error) return json(400, { error: built.error, field: built.field });
        const verified = await consumeCode(userId, "update-profile", body.code);
        if (!verified.ok) return json(400, { error: verified.error, field: "code" });
        built.set.updatedAt = new Date();
        await users.updateOne({ _id: userId }, { $set: built.set });
        if (built.set.username) {
          const referrals = await getReferralsCollection();
          await referrals.updateMany({ referredUserId: userId }, { $set: { referredUsername: built.set.username } });
        }
        const fresh = await users.findOne({ _id: userId });
        return json(200, { ok: true, user: publicProfile(fresh) });
      }

      // Marketing opt-in/out needs no email code: opting out must be as
      // easy as opting in.
      if (action === "set-email-preferences") {
        const optIn = body.marketingOptIn === true;
        const now = new Date();
        await users.updateOne(
          { _id: userId },
          {
            $set: {
              marketingOptIn: optIn,
              "consents.marketing": { optIn, updatedAt: now, source: "my-page" },
              updatedAt: now,
            },
          }
        );
        return json(200, { ok: true, marketingOptIn: optIn });
      }

      // Creators can cancel a pending application themselves.
      if (action === "withdraw-application") {
        let appId;
        try {
          appId = new ObjectId(String(body.applicationId || ""));
        } catch {
          return json(400, { error: "Invalid application" });
        }
        const applications = await getApplicationsCollection();
        const app = await applications.findOne({ _id: appId, creatorId: userId });
        if (!app) return json(404, { error: "Application not found" });
        if ((app.status || "pending") !== "pending") {
          return json(400, { error: "Only pending applications can be withdrawn. For approved applications, please contact Vively." });
        }
        await applications.updateOne({ _id: appId }, { $set: { status: "withdrawn", withdrawnAt: new Date() } });
        const campaigns = await getCampaignsCollection();
        await campaigns.updateOne(
          { _id: app.campaignId, applicantCount: { $gt: 0 } },
          { $inc: { applicantCount: -1 } }
        );
        return json(200, { ok: true, status: "withdrawn" });
      }

      if (action === "delete-account") {
        if (body.confirm !== "DELETE") return json(400, { error: 'Type DELETE to confirm', field: "confirm" });
        const verified = await consumeCode(userId, "delete-account", body.code);
        if (!verified.ok) return json(400, { error: verified.error, field: "code" });

        // Shared cascade (also used by admin deletion) — see
        // _shared/account-deletion.js for exactly what is deleted vs anonymised.
        await deleteCreatorAccount(userId, { initiatedBy: "self" });
        return json(200, { ok: true, deleted: true });
      }

      return json(400, { error: "Invalid action" });
    }

    if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

    const section = (event.queryStringParameters || {}).section || "full";
    const unreadCount = await notifications.countDocuments({ userId, read: false });

    if (section === "summary") return json(200, { unreadCount });

    // Data access / portability: everything stored about this creator, as
    // JSON. The password hash is the only field left out.
    if (section === "export") {
      const [referrals, applications, invitations] = await Promise.all([
        getReferralsCollection(),
        getApplicationsCollection(),
        getInvitationsCollection(),
      ]);
      // eslint-disable-next-line no-unused-vars
      const { passwordHash, ...account } = user;
      const data = {
        exportedAt: new Date(),
        note: "Export of the personal data Vively stores for this creator account. Password hashes are never included.",
        account,
        applications: await applications.find({ creatorId: userId }).sort({ createdAt: -1 }).limit(500).toArray(),
        invitations: await invitations.find({ creatorId: userId }).sort({ createdAt: -1 }).limit(500).toArray(),
        referralsMade: await referrals.find({ referrerId: userId }).sort({ createdAt: -1 }).limit(500).toArray(),
        notifications: await notifications.find({ userId }).sort({ createdAt: -1 }).limit(500).toArray(),
      };
      return json(200, data, { "Content-Disposition": 'attachment; filename="vively-data-export.json"' });
    }

    const referralCode = await ensureReferralCode(users, user);
    const referrals = await getReferralsCollection();
    const referred = await referrals
      .find({ referrerId: userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .project({ _id: 0, referredUsername: 1, createdAt: 1 })
      .toArray();

    const notes = await notifications
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .project({ _id: 1, type: 1, message: 1, data: 1, read: 1, createdAt: 1 })
      .toArray();

    let referredByUsername = null;
    if (user.referredBy) {
      const referrer = await users.findOne({ _id: user.referredBy }, { projection: { username: 1 } });
      referredByUsername = referrer?.username || null;
    }

    const applications = await getApplicationsCollection();
    const myApplications = await applications
      .find({ creatorId: userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .project({ _id: 1, campaignId: 1, campaignTitle: 1, brandName: 1, status: 1, createdAt: 1, reviewedAt: 1, withdrawnAt: 1 })
      .toArray();

    return json(200, {
      user: { ...publicProfile(user), referredByUsername },
      referral: {
        code: referralCode,
        link: referralLink(referralCode),
        count: referred.length,
        referred,
      },
      applications: myApplications,
      notifications: notes,
      unreadCount,
    });
  } catch (error) {
    console.error("me error:", error);
    return json(500, { error: "Request failed" });
  }
};
