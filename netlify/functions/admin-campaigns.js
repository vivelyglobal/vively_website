// Admin: Create, Update, Delete campaigns
const { getCampaignsCollection } = require("./db");
const { verifyRequest } = require("./auth");
const { ObjectId } = require("mongodb");

exports.handler = async (event) => {
  const auth = verifyRequest(event);
  if (auth.error) {
    return {
      statusCode: auth.status,
      body: JSON.stringify({ error: auth.error }),
    };
  }

  if (auth.user.role !== "admin") {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Admin access required" }),
    };
  }

  const campaigns = await getCampaignsCollection();

  // Extract :id from path (Netlify routes /.netlify/functions/admin-campaigns/:id here)
  const pathParts = (event.path || "").split("/").filter(Boolean);
  const fnIndex = pathParts.indexOf("admin-campaigns");
  const id = fnIndex >= 0 ? pathParts[fnIndex + 1] : undefined;

  // GET single campaign or list
  if (event.httpMethod === "GET") {
    try {
      if (id) {
        let objectId;
        try {
          objectId = new ObjectId(id);
        } catch (_) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid campaign ID" }),
          };
        }

        const campaign = await campaigns.findOne({
          _id: objectId,
        });

        if (!campaign) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: "Campaign not found" }),
          };
        }

        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campaign),
        };
      }

      const results = await campaigns.find({}).toArray();
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results),
      };
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch campaigns" }),
      };
    }
  }

  // POST new campaign
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const campaign = {
        ...body,
        createdBy: auth.user.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: typeof body.isActive === "boolean" ? body.isActive : true,
        applicantCount: 0,
      };

      const result = await campaigns.insertOne(campaign);
      return {
        statusCode: 201,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: result.insertedId, ...campaign }),
      };
    } catch (error) {
      console.error("Error creating campaign:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to create campaign" }),
      };
    }
  }

  // PUT update campaign
  if (event.httpMethod === "PUT") {
    try {
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Campaign ID required" }),
        };
      }

      let objectId;
      try {
        objectId = new ObjectId(id);
      } catch (_) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid campaign ID" }),
        };
      }

      const body = JSON.parse(event.body || "{}");
      const updateData = {
        ...body,
        updatedAt: new Date(),
      };
      delete updateData._id;
      delete updateData.createdAt;
      delete updateData.createdBy;

      const result = await campaigns.updateOne(
        { _id: objectId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Campaign not found" }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Campaign updated", id }),
      };
    } catch (error) {
      console.error("Error updating campaign:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to update campaign" }),
      };
    }
  }

  // DELETE campaign
  if (event.httpMethod === "DELETE") {
    try {
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Campaign ID required" }),
        };
      }

      let objectId;
      try {
        objectId = new ObjectId(id);
      } catch (_) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid campaign ID" }),
        };
      }

      const result = await campaigns.deleteOne({ _id: objectId });

      if (result.deletedCount === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Campaign not found" }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Campaign deleted" }),
      };
    } catch (error) {
      console.error("Error deleting campaign:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to delete campaign" }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
