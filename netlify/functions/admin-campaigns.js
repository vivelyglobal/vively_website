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

  // GET single campaign or list
  if (event.httpMethod === "GET") {
    try {
      const id = event.pathParameters?.id;
      if (id) {
        const campaign = await campaigns.findOne({
          _id: new ObjectId(id),
        });
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
        isActive: true,
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
      const id = event.pathParameters?.id;
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Campaign ID required" }),
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
        { _id: new ObjectId(id) },
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
      const id = event.pathParameters?.id;
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Campaign ID required" }),
        };
      }

      const result = await campaigns.deleteOne({ _id: new ObjectId(id) });

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
