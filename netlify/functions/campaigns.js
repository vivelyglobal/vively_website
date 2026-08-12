// Get all campaigns (public endpoint) or single campaign by ID
const { getCampaignsCollection } = require("./db");
const { ObjectId } = require("mongodb");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const campaigns = await getCampaignsCollection();
    const params = event.queryStringParameters || {};
    const { id, category, status, search } = params;

    // If ID is provided, return single campaign
    if (id) {
      try {
        const campaign = await campaigns.findOne({ _id: new ObjectId(id) });
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
      } catch (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid campaign ID" }),
        };
      }
    }

    let query = { isActive: true };

    if (category && category !== "all") {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const results = await campaigns
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

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
};
