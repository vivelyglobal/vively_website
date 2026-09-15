// Creator "My Page": profile, referral code + who used it, notifications,
// and email-verified account changes (profile edits, account deletion).
const { ObjectId } = require("mongodb");
const {
  getUsersCollection,
  getReferralsCollection,
  getNotificationsCollection,
  getApplicationsCollection,
  getAccountCodesCollection,
} = require("./db");
const { verifyRequest } = require("./auth");
const { ensureReferralCode, referralLink } = require("./_shared/referral");
const { isValidPurpose, issueCode, consumeCode } = require("./_shared/account-codes");

const JSON_HEADERS = { "Content-Type": "application/json" };

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
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
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: "",
    };
  }

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

      if (action === "delete-account") {
        if (body.confirm !== "DELETE") return json(400, { error: 'Type DELETE to confirm', field: "confirm" });
        const verified = await consumeCode(userId, "delete-account", body.code);
        if (!verified.ok) return json(400, { error: verified.error, field: "code" });

        const referrals = await getReferralsCollection();
        const applications = await getApplicationsCollection();
        const codes = await getAccountCodesCollection();
        await Promise.all([
          referrals.updateMany({ referredUserId: userId }, { $set: { referredUsername: "deleted-user", referredDeleted: true } }),
          referrals.deleteMany({ referrerId: userId }),
          notifications.deleteMany({ userId }),
          applications.deleteMany({ creatorId: userId }),
          codes.deleteMany({ userId }),
        ]);
        await users.deleteOne({ _id: userId });
        return json(200, { ok: true, deleted: true });
      }

      return json(400, { error: "Invalid action" });
    }

    if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

    const section = (event.queryStringParameters || {}).section || "full";
    const unreadCount = await notifications.countDocuments({ userId, read: false });

    if (section === "summary") return json(200, { unreadCount });

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

    return json(200, {
      user: { ...publicProfile(user), referredByUsername },
      referral: {
        code: referralCode,
        link: referralLink(referralCode),
        count: referred.length,
        referred,
      },
      notifications: notes,
      unreadCount,
    });
  } catch (error) {
    console.error("me error:", error);
    return json(500, { error: "Request failed" });
  }
};
