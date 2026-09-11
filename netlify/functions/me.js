// Creator "My Page" data: profile, referral code + who used it, notifications.
const { ObjectId } = require("mongodb");
const {
  getUsersCollection,
  getReferralsCollection,
  getNotificationsCollection,
} = require("./db");
const { verifyRequest } = require("./auth");
const { ensureReferralCode, referralLink } = require("./_shared/referral");

const JSON_HEADERS = { "Content-Type": "application/json" };

function json(statusCode, body) {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
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
      if (body.action === "mark-notifications-read") {
        await notifications.updateMany(
          { userId, read: false },
          { $set: { read: true, readAt: new Date() } }
        );
        return json(200, { ok: true });
      }
      return json(400, { error: "Invalid action" });
    }

    if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });

    const section = (event.queryStringParameters || {}).section || "full";
    const unreadCount = await notifications.countDocuments({ userId, read: false });

    if (section === "summary") {
      return json(200, { unreadCount });
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
      const referrer = await users.findOne(
        { _id: user.referredBy },
        { projection: { username: 1 } }
      );
      referredByUsername = referrer?.username || null;
    }

    return json(200, {
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        fullName: user.profile?.fullName || user.name || "",
        picture: user.profile?.picture || user.picture || null,
        createdAt: user.createdAt,
        referredByUsername,
      },
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
    return json(500, { error: "Failed to load account" });
  }
};
