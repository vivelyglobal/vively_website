// Brand: create, list, edit campaigns owned by the logged-in brand.
// Scoped strictly to the brand's own campaigns (brandId === auth.user.userId)
// — a brand can never see or touch another brand's campaigns from here.
// Newly created campaigns start as pending_review / isActive:false; an admin
// (via admin-campaigns.js / the admin panel) approves and publishes them.
const { getCampaignsCollection, getBrandsCollection } = require("./db");
const { verifyRequest } = require("./auth");
const { requirePermission, PERMISSIONS } = require("./_shared/permissions");
const { CAMPAIGN_STATUS } = require("./_shared/constants");
const { ObjectId } = require("mongodb");

function bad(status, error) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error }),
  };
}

function ok(status, payload) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  };
}

exports.handler = async (event) => {
  const auth = verifyRequest(event);

  const campaigns = await getCampaignsCollection();
  let brandOid;
  try {
    brandOid = new ObjectId((auth.user && auth.user.userId) || "");
  } catch (_) {
    brandOid = null;
  }

  const pathParts = (event.path || "").split("/").filter(Boolean);
  const fnIndex = pathParts.indexOf("brand-campaigns");
  const id = fnIndex >= 0 ? pathParts[fnIndex + 1] : undefined;

  // ========== GET (list own, or single by id) ==========
  if (event.httpMethod === "GET") {
    const denial = requirePermission(auth, PERMISSIONS.CAMPAIGN_READ_OWN);
    if (denial) return denial;
    if (!brandOid) return bad(401, "Invalid session");

    try {
      if (id) {
        let objectId;
        try {
          objectId = new ObjectId(id);
        } catch (_) {
          return bad(400, "Invalid campaign ID");
        }
        const campaign = await campaigns.findOne({ _id: objectId, brandId: brandOid });
        if (!campaign) return bad(404, "Campaign not found");
        return ok(200, campaign);
      }

      const results = await campaigns
        .find({ brandId: brandOid })
        .sort({ createdAt: -1 })
        .toArray();
      return ok(200, results);
    } catch (error) {
      console.error("Error fetching brand campaigns:", error);
      return bad(500, "Failed to fetch campaigns");
    }
  }

  // ========== POST (create) ==========
  if (event.httpMethod === "POST") {
    const denial = requirePermission(auth, PERMISSIONS.CAMPAIGN_CREATE);
    if (denial) return denial;
    if (!brandOid) return bad(401, "Invalid session");

    try {
      const body = JSON.parse(event.body || "{}");
      const required = ["title", "category", "description"];
      for (const field of required) {
        if (!body[field] || !String(body[field]).trim()) {
          return bad(400, `Missing required field: ${field}`);
        }
      }

      const brands = await getBrandsCollection();
      const brandDoc = await brands.findOne({ _id: brandOid });

      const campaign = {
        title: String(body.title).trim(),
        brand: (brandDoc && brandDoc.companyName) || "",
        brandId: brandOid,
        category: body.category,
        description: String(body.description).trim(),
        location: body.location || "",
        imageUrl: body.imageUrl || "",
        experienceType: body.experienceType || "",
        contentType: body.contentType || "",
        minFollowers: body.minFollowers || "",
        budget: body.budget || "",
        spots: Number.isFinite(Number(body.spots)) ? Number(body.spots) : null,
        deadline: body.deadline || "",
        platform: body.platform || "",
        guidelines: Array.isArray(body.guidelines) ? body.guidelines : [],
        targetAudience: Array.isArray(body.targetAudience) ? body.targetAudience : [],
        status: CAMPAIGN_STATUS.PENDING_REVIEW,
        isActive: false, // hidden from the public campaigns list until admin approves
        applicantCount: 0,
        createdBy: auth.user.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await campaigns.insertOne(campaign);
      return ok(201, {
        message: "Campaign submitted for review",
        _id: result.insertedId,
        ...campaign,
      });
    } catch (error) {
      console.error("Error creating brand campaign:", error);
      return bad(500, "Failed to create campaign");
    }
  }

  // ========== PUT (edit own) ==========
  if (event.httpMethod === "PUT") {
    const denial = requirePermission(auth, PERMISSIONS.CAMPAIGN_EDIT_OWN);
    if (denial) return denial;
    if (!brandOid) return bad(401, "Invalid session");
    if (!id) return bad(400, "Campaign ID required");

    try {
      let objectId;
      try {
        objectId = new ObjectId(id);
      } catch (_) {
        return bad(400, "Invalid campaign ID");
      }

      // Ownership check happens in the filter itself — updateOne matches
      // zero documents (and returns 404 below) if this brand doesn't own it.
      const body = JSON.parse(event.body || "{}");
      const update = { ...body, updatedAt: new Date() };
      // A brand can't grant itself approval/publish or reassign ownership.
      delete update._id;
      delete update.brandId;
      delete update.createdBy;
      delete update.createdAt;
      delete update.status;
      delete update.isActive;
      delete update.applicantCount;

      const result = await campaigns.updateOne(
        { _id: objectId, brandId: brandOid },
        { $set: update }
      );

      if (result.matchedCount === 0) return bad(404, "Campaign not found");
      return ok(200, { message: "Campaign updated", id });
    } catch (error) {
      console.error("Error updating brand campaign:", error);
      return bad(500, "Failed to update campaign");
    }
  }

  return bad(405, "Method not allowed");
};
