// Brand-only: AI-assisted creator search + campaign invitations.
const { ObjectId } = require("mongodb");
const {
  getUsersCollection,
  getBrandsCollection,
  getCampaignsCollection,
  getNotificationsCollection,
  getInvitationsCollection,
} = require("./db");
const { verifyRequest } = require("./auth");
const { ROLES, normalizeRole } = require("./_shared/constants");
const {
  parseQueryWithAI,
  criteriaFromCampaign,
  scoreCreator,
  explainMatches,
  aiAvailable,
  fmtFollowers,
} = require("./_shared/creator-matching");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "noreply@vivelyglobal.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Vively";
const SITE_URL = (process.env.SITE_URL || "https://www.vivelyglobal.com").replace(/\/$/, "");
const IS_DEV = process.env.NODE_ENV !== "production";
const MAX_RESULTS = 30;

function json(statusCode, body) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function publicCreator(creator, scored, reasons) {
  return {
    id: String(creator._id),
    username: creator.username,
    fullName: creator.profile?.fullName || "",
    picture: creator.profile?.picture || null,
    categories: creator.contentCategories || [],
    nationality: creator.profile?.nationality || null,
    residence: creator.profile?.residence || null,
    gender: creator.profile?.gender || null,
    age: scored.age,
    bio: String(creator.profile?.bio || "").slice(0, 160),
    socials: {
      instagram: creator.socials?.instagram || null,
      tiktok: creator.socials?.tiktok || null,
      youtube: creator.socials?.youtube || null,
    },
    followers: {
      instagram: creator.stats?.instagramFollowers || null,
      tiktok: creator.stats?.tiktokFollowers || null,
      youtube: creator.stats?.youtubeSubscribers || null,
      label: fmtFollowers(scored.followers),
    },
    score: scored.score,
    reasons,
  };
}

function mergeFilters(criteria, filters) {
  const f = filters || {};
  const out = { ...criteria };
  if (Array.isArray(f.categories) && f.categories.length) out.categories = f.categories;
  if (f.nationality) out.nationality = f.nationality;
  if (f.residence) out.residence = f.residence;
  if (f.gender) out.gender = f.gender;
  if (Number.isFinite(Number(f.ageMin)) && f.ageMin !== "") out.ageMin = Number(f.ageMin);
  if (Number.isFinite(Number(f.ageMax)) && f.ageMax !== "") out.ageMax = Number(f.ageMax);
  if (Number.isFinite(Number(f.minFollowers)) && f.minFollowers !== "") out.minFollowers = Number(f.minFollowers);
  if (Array.isArray(f.platforms) && f.platforms.length) out.platforms = f.platforms;
  return out;
}

function inviteEmailHTML({ creatorName, brandName, campaign, message }) {
  const url = `${SITE_URL}/campaign-detail.html?id=${encodeURIComponent(String(campaign._id))}`;
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#111;letter-spacing:-0.5px;">Vively</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 16px;">
          <h2 style="margin:16px 0 8px;font-size:20px;color:#111;">You're invited to a campaign</h2>
          <p style="margin:0;color:#444;font-size:14px;line-height:1.6;">Hi ${esc(creatorName || "there")},<br/><strong>${esc(brandName)}</strong> found your profile on Vively and would like to invite you to:</p>
          <p style="margin:14px 0 0;padding:14px 16px;background:#faf8f4;border:1px solid #eee;border-radius:10px;font-size:15px;color:#111;"><strong>${esc(campaign.title)}</strong><br/><span style="color:#666;font-size:13px;">${esc(campaign.category || "")}${campaign.location ? " · " + esc(campaign.location) : ""}</span></p>
          ${message ? `<p style="margin:14px 0 0;color:#444;font-size:14px;line-height:1.6;border-left:3px solid #e0362c;padding-left:12px;">${esc(message)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:8px 32px 32px;text-align:center;">
          <a href="${url}" style="display:inline-block;padding:12px 22px;background:#e0362c;color:#fff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:700;">View campaign &amp; apply</a>
        </td></tr>
        <tr><td style="padding:16px 32px 32px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:12px;line-height:1.5;">You received this because a brand invited you through Vively. &copy; ${new Date().getFullYear()} Vively Global</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendInviteEmail(creator, brandName, campaign, message) {
  if (IS_DEV) console.log(`[DEV] invite -> ${creator.email}: ${brandName} / ${campaign.title}`);
  if (!BREVO_API_KEY) return false;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: creator.email }],
        subject: `${brandName} invited you to "${campaign.title}" on Vively`,
        htmlContent: inviteEmailHTML({ creatorName: creator.profile?.fullName || creator.username, brandName, campaign, message }),
        textContent: `${brandName} invited you to the campaign "${campaign.title}" on Vively.${message ? `\n\n${message}` : ""}\n\nView & apply: ${SITE_URL}/campaign-detail.html?id=${String(campaign._id)}`,
      }),
    });
    return res.ok;
  } catch (error) {
    console.error("[email] invite send error:", error);
    return false;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Allow-Methods": "POST, OPTIONS" }, body: "" };
  }
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const auth = verifyRequest(event);
  if (auth.error) return json(auth.status, { error: auth.error });
  if (normalizeRole(auth.user.role) !== ROLES.BRAND) return json(403, { error: "Brand account required" });

  let brandId;
  try { brandId = new ObjectId(auth.user.userId); } catch { return json(401, { error: "Invalid session" }); }

  try {
    const brands = await getBrandsCollection();
    const brand = await brands.findOne({ _id: brandId });
    if (!brand) return json(404, { error: "Brand account not found" });
    if (brand.status !== "approved") return json(403, { error: "Your brand account must be approved by Vively before using creator search.", status: brand.status });

    const body = JSON.parse(event.body || "{}");
    const users = await getUsersCollection();
    const campaigns = await getCampaignsCollection();

    // ========== SEARCH ==========
    if (body.action === "search") {
      const query = String(body.query || "").trim().slice(0, 500);
      let campaign = null;
      if (body.campaignId) {
        try { campaign = await campaigns.findOne({ _id: new ObjectId(body.campaignId), brandId }); } catch { campaign = null; }
        if (!campaign) return json(404, { error: "Campaign not found" });
      }
      if (!query && !campaign) return json(400, { error: "Enter a search or pick a campaign" });

      let criteria = campaign ? criteriaFromCampaign(campaign) : await parseQueryWithAI(query);
      if (campaign && query) {
        const extra = await parseQueryWithAI(query);
        criteria = { ...criteria, ...Object.fromEntries(Object.entries(extra).filter(([, v]) => v && (!Array.isArray(v) || v.length))) };
      }
      criteria = mergeFilters(criteria, body.filters);

      const creators = await users
        .find({ role: { $in: [ROLES.CREATOR, "user"] }, isActive: { $ne: false } })
        .project({ passwordHash: 0, email: 0, contact: 0 })
        .limit(2000)
        .toArray();

      const ranked = creators
        .map((creator) => ({ creator, scored: scoreCreator(creator, criteria) }))
        .filter((r) => r.scored.score > 0)
        .sort((a, b) => b.scored.score - a.scored.score)
        .slice(0, Math.min(Number(body.limit) || 20, MAX_RESULTS));

      const searchText = query || `${campaign.title} — ${campaign.description || ""}`;
      const reasons = await explainMatches(searchText, criteria, ranked);

      // which of these creators were already invited to the selected campaign
      let invited = new Set();
      if (campaign) {
        const invitations = await getInvitationsCollection();
        const rows = await invitations.find({ campaignId: campaign._id, creatorId: { $in: ranked.map((r) => r.creator._id) } }).project({ creatorId: 1 }).toArray();
        invited = new Set(rows.map((r) => String(r.creatorId)));
      }

      return json(200, {
        criteria,
        ai: aiAvailable(),
        total: creators.length,
        campaign: campaign ? { id: String(campaign._id), title: campaign.title } : null,
        results: ranked.map((r) => ({ ...publicCreator(r.creator, r.scored, reasons.get(String(r.creator._id)) || []), invited: invited.has(String(r.creator._id)) })),
      });
    }

    // ========== INVITE ==========
    if (body.action === "invite") {
      let campaign = null;
      try { campaign = await campaigns.findOne({ _id: new ObjectId(body.campaignId), brandId }); } catch { campaign = null; }
      if (!campaign) return json(404, { error: "Campaign not found" });
      if (["rejected", "archived", "completed"].includes(campaign.status)) return json(400, { error: "This campaign is no longer accepting creators" });

      const ids = (Array.isArray(body.creatorIds) ? body.creatorIds : []).slice(0, 50).map((id) => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean);
      if (!ids.length) return json(400, { error: "Select at least one creator" });
      const message = String(body.message || "").trim().slice(0, 600);

      const creators = await users.find({ _id: { $in: ids }, isActive: { $ne: false } }).toArray();
      const invitations = await getInvitationsCollection();
      const notifications = await getNotificationsCollection();
      const brandName = brand.companyName || "A brand";
      const now = new Date();
      let sent = 0, skipped = 0, emailed = 0;

      for (const creator of creators) {
        try {
          await invitations.insertOne({ campaignId: campaign._id, brandId, creatorId: creator._id, message: message || null, createdAt: now });
        } catch (error) {
          if (error.code === 11000) { skipped += 1; continue; }
          throw error;
        }
        sent += 1;
        await notifications.insertOne({
          userId: creator._id,
          type: "invite",
          message: `${brandName} invited you to the campaign "${campaign.title}".`,
          data: { campaignId: String(campaign._id), campaignTitle: campaign.title, brandName, link: `campaign-detail.html?id=${String(campaign._id)}` },
          read: false,
          createdAt: now,
        });
        if (await sendInviteEmail(creator, brandName, campaign, message)) emailed += 1;
      }

      return json(200, { ok: true, sent, skipped, emailed, campaign: { id: String(campaign._id), title: campaign.title } });
    }

    return json(400, { error: "Invalid action" });
  } catch (error) {
    console.error("creator-match error:", error);
    return json(500, { error: "Request failed" });
  }
};
