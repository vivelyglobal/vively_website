// Submit application to campaign
const {
  getApplicationsCollection,
  getCampaignsCollection,
  getUsersCollection,
  getBrandsCollection,
} = require("./db");
const { ObjectId } = require("mongodb");
const { verifyRequest } = require("./auth");
const { requirePermission, canUser } = require("./_shared/permissions");
const { PERMISSIONS } = require("./_shared/permissions");
const { ROLES, normalizeRole } = require("./_shared/constants");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL =
  process.env.BREVO_SENDER_EMAIL || "noreply@vivelyglobal.com";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "Vively";
const IS_DEV = process.env.NODE_ENV !== "production";

function statusLabel(status) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function buildStatusEmailHTML({ applicantName, campaignTitle, status }) {
  const label = statusLabel(status);
  const isApproved = status === "approved";
  const accent = isApproved ? "#2b8a3e" : "#b13a3a";
  const message = isApproved
    ? "Great news. Your application has been approved."
    : "Thank you for applying. This round was not approved for your profile.";

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <tr><td style="padding:30px 32px 6px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#111;letter-spacing:-0.5px;">Vively</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;text-align:center;">
          <h2 style="margin:8px 0 12px;font-size:20px;color:#111;">Application Status Update</h2>
          <p style="margin:0;color:#666;font-size:14px;line-height:1.6;">
            Hi ${applicantName || "Creator"},<br />
            Your application for <strong>${campaignTitle || "a campaign"}</strong> has been updated.
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 24px;text-align:center;">
          <div style="display:inline-block;padding:12px 20px;border-radius:999px;background:${accent};color:#fff;font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;">
            ${label}
          </div>
        </td></tr>
        <tr><td style="padding:0 32px 30px;text-align:center;">
          <p style="margin:0;color:#444;font-size:14px;line-height:1.6;">${message}</p>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:12px;line-height:1.5;">&copy; ${new Date().getFullYear()} Vively Global</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendApplicationStatusEmail({ to, applicantName, campaignTitle, status }) {
  if (!to) return { sent: false, reason: "no-email" };

  if (IS_DEV) {
    console.log(
      `[DEV] Application status email target=${to} status=${status} campaign=${campaignTitle || "n/a"}`
    );
  }

  if (!BREVO_API_KEY) {
    console.warn("[email] BREVO_API_KEY not set. Status email skipped.");
    return { sent: false, reason: "no-api-key" };
  }

  try {
    const label = statusLabel(status);
    const textContent = `Hi ${applicantName || "Creator"},\n\nYour application for ${campaignTitle || "a campaign"} has been updated: ${label}.\n\n- Vively`;
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        subject: `Vively application update: ${label}`,
        htmlContent: buildStatusEmailHTML({ applicantName, campaignTitle, status }),
        textContent,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Brevo status send failed (${res.status}):`, body.slice(0, 500));
      return { sent: false, reason: "brevo-error", status: res.status, body };
    }

    const data = await res.json().catch(() => ({}));
    return { sent: true, messageId: data.messageId };
  } catch (error) {
    console.error("[email] Status send exception:", error);
    return { sent: false, reason: "exception", error: error.message };
  }
}

function buildNewApplicantEmailHTML({ campaignTitle, applicantName, applicantInstagram }) {
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <tr><td style="padding:30px 32px 6px;text-align:center;">
          <h1 style="margin:0;font-size:28px;font-weight:800;color:#111;letter-spacing:-0.5px;">Vively</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;text-align:center;">
          <h2 style="margin:8px 0 12px;font-size:20px;color:#111;">New Applicant</h2>
          <p style="margin:0;color:#666;font-size:14px;line-height:1.6;">
            <strong>${applicantName || "A creator"}</strong>${applicantInstagram ? ` (@${applicantInstagram})` : ""} just applied to your campaign <strong>${campaignTitle || ""}</strong>.
          </p>
        </td></tr>
        <tr><td style="padding:0 32px 30px;text-align:center;">
          <a href="https://www.vivelyglobal.com/brand-dashboard.html" style="display:inline-block;padding:12px 24px;border-radius:999px;background:#111;color:#fff;font-size:14px;font-weight:700;text-decoration:none;">Review Applicant</a>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;text-align:center;border-top:1px solid #eee;">
          <p style="margin:0;color:#999;font-size:12px;line-height:1.5;">&copy; ${new Date().getFullYear()} Vively Global</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendNewApplicantBrandEmail({ to, campaignTitle, applicantName, applicantInstagram }) {
  if (!to) return { sent: false, reason: "no-email" };

  if (IS_DEV) {
    console.log(
      `[DEV] New applicant email target=${to} campaign=${campaignTitle || "n/a"} applicant=${applicantName || "n/a"}`
    );
  }

  if (!BREVO_API_KEY) {
    console.warn("[email] BREVO_API_KEY not set. New applicant email skipped.");
    return { sent: false, reason: "no-api-key" };
  }

  try {
    const textContent = `${applicantName || "A creator"} just applied to your campaign "${campaignTitle || ""}". Log in to your brand dashboard to review.`;
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
        to: [{ email: to }],
        subject: `New applicant for ${campaignTitle || "your campaign"}`,
        htmlContent: buildNewApplicantEmailHTML({ campaignTitle, applicantName, applicantInstagram }),
        textContent,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[email] Brevo new-applicant send failed (${res.status}):`, body.slice(0, 500));
      return { sent: false, reason: "brevo-error", status: res.status, body };
    }

    const data = await res.json().catch(() => ({}));
    return { sent: true, messageId: data.messageId };
  } catch (error) {
    console.error("[email] New-applicant send exception:", error);
    return { sent: false, reason: "exception", error: error.message };
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "POST") {
    try {
      // Auth is required to apply — user info is taken from their account.
      const auth = verifyRequest(event);
      if (auth.error) {
        return {
          statusCode: auth.status || 401,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Please log in to apply" }),
        };
      }

      const body = JSON.parse(event.body || "{}");
      const { campaignId, message } = body;

      if (!campaignId) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "campaignId is required" }),
        };
      }

      let campaignOid;
      try {
        campaignOid = new ObjectId(campaignId);
      } catch (e) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid campaign ID" }),
        };
      }

      const applications = await getApplicationsCollection();
      const campaigns = await getCampaignsCollection();
      const users = await getUsersCollection();

      // Verify campaign exists
      const campaign = await campaigns.findOne({ _id: campaignOid });
      if (!campaign) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Campaign not found" }),
        };
      }

      // Load the applicant's profile so we can snapshot it on the application.
      let creatorOid;
      try {
        creatorOid = new ObjectId(auth.user.userId);
      } catch (e) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "Invalid session" }),
        };
      }
      const user = await users.findOne({ _id: creatorOid });
      if (!user) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "User account not found" }),
        };
      }

      // Prevent duplicate applications on the same campaign.
      const existing = await applications.findOne({
        campaignId: campaignOid,
        creatorId: creatorOid,
      });
      if (existing) {
        return {
          statusCode: 409,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "You have already applied to this campaign",
            applicationId: existing._id,
          }),
        };
      }

      // Snapshot the brand owner so brand-portal + admin can route this.
      // Brand-created campaigns store the owner in either `brandId` or
      // `createdBy` depending on which admin route made them.
      const rawBrandId = campaign.brandId || campaign.createdBy || null;
      let brandOid = null;
      if (rawBrandId) {
        try {
          brandOid =
            rawBrandId instanceof ObjectId
              ? rawBrandId
              : new ObjectId(String(rawBrandId));
        } catch (e) {
          brandOid = null;
        }
      }

      const application = {
        campaignId: campaignOid,
        campaignTitle: campaign.title || "",
        brandId: brandOid,
        brandName: campaign.brand || "",
        // Applicant identity — trusted server-side snapshot.
        creatorId: creatorOid,
        creatorEmail: user.email || auth.user.email,
        creatorName: user.profile?.fullName || user.username || "",
        creatorUsername: user.username || "",
        creatorInstagram: user.socials?.instagram || "",
        creatorTiktok: user.socials?.tiktok || "",
        creatorPhone: user.contact?.phone
          ? `${user.contact?.countryCode || ""}${user.contact.phone}`.trim()
          : "",
        // Legacy fields kept for existing admin/brand UIs that read them.
        name: user.profile?.fullName || user.username || "",
        email: user.email || auth.user.email,
        instagram: user.socials?.instagram || "",
        message: message || "",
        status: "pending",
        createdAt: new Date(),
      };

      const result = await applications.insertOne(application);

      // Increment applicant count on campaign
      await campaigns.updateOne(
        { _id: campaignOid },
        { $inc: { applicantCount: 1 } }
      );

      // Notify the owning brand — best-effort, never blocks the response.
      if (brandOid) {
        try {
          const brands = await getBrandsCollection();
          const brand = await brands.findOne({ _id: brandOid });
          if (brand) {
            await sendNewApplicantBrandEmail({
              to: brand.repEmail || brand.email,
              campaignTitle: application.campaignTitle,
              applicantName: application.creatorName,
              applicantInstagram: application.creatorInstagram,
            });
          }
        } catch (notifyError) {
          console.error("Error sending new-applicant brand email:", notifyError);
        }
      }

      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: result.insertedId,
          message: "Application submitted successfully",
        }),
      };
    } catch (error) {
      console.error("Error creating application:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to submit application" }),
      };
    }
  }

  if (event.httpMethod === "GET") {
    // GET applications is PII-sensitive. Auth REQUIRED.
    // - admin/staff/super_admin: see everything (optionally filtered by campaignId)
    // - brand: see applications for own campaigns only
    // - creator: see own applications only
    try {
      const auth = verifyRequest(event);
      if (auth.error) {
        return {
          statusCode: auth.status || 401,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: auth.error }),
        };
      }

      const role = normalizeRole(auth.user.role);
      const { campaignId } = event.queryStringParameters || {};
      const applications = await getApplicationsCollection();
      const campaigns = await getCampaignsCollection();

      let query = {};

      if (
        role === ROLES.ADMIN ||
        role === ROLES.SUPER_ADMIN ||
        role === ROLES.STAFF
      ) {
        if (campaignId) query.campaignId = new ObjectId(campaignId);
      } else if (role === ROLES.BRAND) {
        // Restrict to campaigns owned by this brand.
        const brandOid = new ObjectId(auth.user.userId);
        const ownedCampaignIds = await campaigns
          .find({ brandId: brandOid }, { projection: { _id: 1 } })
          .map((c) => c._id)
          .toArray();
        if (ownedCampaignIds.length === 0) {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([]),
          };
        }
        query.campaignId = { $in: ownedCampaignIds };
        if (campaignId) {
          // Also honor explicit filter but keep the brand scope.
          const requested = new ObjectId(campaignId);
          if (!ownedCampaignIds.some((id) => id.equals(requested))) {
            return {
              statusCode: 403,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ error: "Forbidden" }),
            };
          }
          query.campaignId = requested;
        }
      } else if (role === ROLES.CREATOR) {
        // Creators see only their own applications.
        query.creatorId = new ObjectId(auth.user.userId);
      } else {
        return {
          statusCode: 403,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Forbidden" }),
        };
      }

      const results = await applications.find(query).toArray();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results),
      };
    } catch (error) {
      console.error("Error fetching applications:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch applications" }),
      };
    }
  }

  if (event.httpMethod === "PATCH") {
    try {
      const auth = verifyRequest(event);
      if (auth.error) {
        return {
          statusCode: auth.status || 401,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: auth.error }),
        };
      }

      const role = normalizeRole(auth.user.role);
      if (
        role !== ROLES.ADMIN &&
        role !== ROLES.SUPER_ADMIN &&
        role !== ROLES.STAFF
      ) {
        return {
          statusCode: 403,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Forbidden" }),
        };
      }

      const body = JSON.parse(event.body || "{}");
      const { applicationId, status } = body;
      const allowedStatuses = ["pending", "approved", "rejected"];

      if (!applicationId || !status) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "applicationId and status are required" }),
        };
      }

      if (!allowedStatuses.includes(status)) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Invalid status" }),
        };
      }

      let applicationOid;
      try {
        applicationOid = new ObjectId(applicationId);
      } catch (e) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Invalid application ID" }),
        };
      }

      const applications = await getApplicationsCollection();
      const existing = await applications.findOne({ _id: applicationOid });
      if (!existing) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Application not found" }),
        };
      }

      await applications.updateOne(
        { _id: applicationOid },
        {
          $set: {
            status,
            reviewedAt: new Date(),
            reviewedBy: auth.user.userId || null,
          },
        }
      );

      const emailResult = await sendApplicationStatusEmail({
        to: existing.creatorEmail || existing.email,
        applicantName: existing.creatorName || existing.name,
        campaignTitle: existing.campaignTitle,
        status,
      });

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Application status updated",
          applicationId,
          status,
          emailSent: emailResult.sent === true,
        }),
      };
    } catch (error) {
      console.error("Error updating application status:", error);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Failed to update application status" }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
