// Submit application to campaign
const { getApplicationsCollection, getCampaignsCollection } = require("./db");
const { ObjectId } = require("mongodb");
const { verifyRequest } = require("./auth");
const { requirePermission, canUser } = require("./_shared/permissions");
const { PERMISSIONS } = require("./_shared/permissions");
const { ROLES, normalizeRole } = require("./_shared/constants");

exports.handler = async (event) => {
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { campaignId, name, email, instagram, message, tallyFormId } =
        body;

      if (!campaignId || !email) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "campaignId and email are required",
          }),
        };
      }

      const applications = await getApplicationsCollection();
      const campaigns = await getCampaignsCollection();

      // Verify campaign exists
      const campaign = await campaigns.findOne({
        _id: new ObjectId(campaignId),
      });
      if (!campaign) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Campaign not found" }),
        };
      }

      // Create application
      const application = {
        campaignId: new ObjectId(campaignId),
        name,
        email,
        instagram,
        message,
        tallyFormId,
        status: "pending",
        createdAt: new Date(),
      };

      const result = await applications.insertOne(application);

      // Increment applicant count on campaign
      await campaigns.updateOne(
        { _id: new ObjectId(campaignId) },
        { $inc: { applicantCount: 1 } }
      );

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

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
