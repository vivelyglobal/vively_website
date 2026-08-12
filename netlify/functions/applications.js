// Submit application to campaign
const { getApplicationsCollection, getCampaignsCollection } = require("./db");
const { ObjectId } = require("mongodb");

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
    try {
      const { campaignId } = event.queryStringParameters || {};
      const applications = await getApplicationsCollection();

      let query = {};
      if (campaignId) {
        query.campaignId = new ObjectId(campaignId);
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
