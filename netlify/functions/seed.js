// Seed demo campaigns data
// SECURITY: This endpoint can overwrite records. It is disabled unless:
//   1. NODE_ENV !== "production" (dev/local), OR
//   2. Request includes X-Seed-Token header matching SEED_TOKEN env var.
const crypto = require("crypto");
const { getCampaignsCollection, getUsersCollection } = require("./db");
const { hashPassword } = require("./auth");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const isProd = process.env.NODE_ENV === "production";
  const providedToken =
    (event.headers && (event.headers["x-seed-token"] || event.headers["X-Seed-Token"])) || "";
  const expectedToken = process.env.SEED_TOKEN || "";

  if (isProd) {
    if (!expectedToken || providedToken !== expectedToken) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Seed endpoint disabled in production" }),
      };
    }
  }

  try {
    const campaigns = await getCampaignsCollection();
    const users = await getUsersCollection();

    // Create admin user if doesn't exist. Password comes from ADMIN_PASSWORD
    // (set it in Render/Netlify env vars); if unset, generate a random one
    // and print it to the server logs only — never returned in the response.
    const adminEmail = process.env.ADMIN_EMAIL || "admin@vively.com";
    let generatedPassword = null;
    const adminExists = await users.findOne({ email: adminEmail });
    if (!adminExists) {
      const adminPassword =
        process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");
      if (!process.env.ADMIN_PASSWORD) generatedPassword = adminPassword;
      const hashedPassword = await hashPassword(adminPassword);
      await users.insertOne({
        email: adminEmail,
        name: "Admin",
        passwordHash: hashedPassword,
        role: "admin",
        createdAt: new Date(),
      });
      if (generatedPassword) {
        console.log(
          `[seed] Created admin ${adminEmail} with generated password: ${generatedPassword} — save this, it is not shown again.`
        );
      }
    }

    // Seed demo campaigns
    const demoCount = await campaigns.countDocuments();
    if (demoCount === 0) {
      const demoCampaigns = [
        {
          title: "Strok87 - Semi-permanent Makeup",
          brand: "Strok87",
          category: "Beauty & Care",
          description:
            "Join us for a semi-permanent makeup experience at our Hongdae salon. We're looking for creators who are interested in eyebrow design, lip tinting, and eyeliner application.",
          location: "Hongdae, Seoul",
          imageUrl: "/assets/img/content-00.jpeg",
          experienceType: "In-person makeup service",
          contentType: "Reel",
          minFollowers: "1,000+",
          budget: "₩200,000 - ₩400,000",
          spots: 10,
          deadline: "2026-08-31",
          platform: "Instagram",
          guidelines: [
            "No content creation, no posting required",
            "Do not film or photograph other participants without consent",
            "Come as you normally would, makeup is fine",
            "Attend one session at our Hongdae location",
          ],
          targetAudience: [
            { label: "Nationality", value: "United States (required)" },
            { label: "Gender", value: "Female" },
            { label: "Age", value: "18-44" },
            { label: "Current Residence", value: "South Korea" },
            { label: "Language", value: "English speaker" },
            { label: "Product Usage", value: "Uses makeup regularly" },
          ],
          isActive: true,
          applicantCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Aran Clinic - K-Beauty Treatment",
          brand: "Aran Clinic",
          category: "Beauty & Care",
          description:
            "Experience our premium K-beauty treatment package at our Seoul clinic. We're searching for beauty creators to try our full treatment menu.",
          location: "Seoul",
          imageUrl: "/assets/img/content-04.jpeg",
          experienceType: "Full premium K-beauty treatment package",
          contentType: "Video",
          minFollowers: "5,000+",
          budget: "₩300,000 - ₩600,000",
          spots: 5,
          deadline: "2026-08-25",
          platform: "TikTok/Instagram",
          guidelines: [
            "Participants must document the full experience",
            "Content must be posted within 2 weeks",
            "Tag the clinic in all posts",
          ],
          targetAudience: [
            { label: "Nationality", value: "All nationalities welcome" },
            { label: "Gender", value: "Any" },
            { label: "Age", value: "20-50" },
            { label: "Content Focus", value: "Beauty & skincare" },
          ],
          isActive: true,
          applicantCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          title: "Monreve Cabins - Free Stay Experience",
          brand: "Monreve Cabins",
          category: "Stay & Travel",
          description:
            "Get a free one-night stay at our luxury cabins in Gangnam. We're looking for travel and lifestyle creators to showcase our unique accommodation.",
          location: "Gangnam, Seoul",
          imageUrl: "/assets/img/content-06.jpeg",
          experienceType: "Free stay for one night for 2 people",
          contentType: "Photos/Reels",
          minFollowers: "2,000+",
          budget: "Free (₩500,000 value)",
          spots: 3,
          deadline: "2026-09-10",
          platform: "Instagram/TikTok",
          guidelines: [
            "Share your experience on Instagram Reels and Stories",
            "Tag @monrevecabins and use #MonreveCabins",
            "Professional photos appreciated but smartphone content OK",
          ],
          targetAudience: [
            { label: "Content Type", value: "Travel/Lifestyle" },
            { label: "Followers", value: "2,000+" },
          ],
          isActive: true,
          applicantCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await campaigns.insertMany(demoCampaigns);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Demo data seeded successfully",
        admin: {
          email: adminEmail,
          passwordNote: adminExists
            ? "Admin already existed, password unchanged."
            : "Password was set via ADMIN_PASSWORD env var, or generated and printed to server logs — check logs, it is not returned here.",
        },
      }),
    };
  } catch (error) {
    console.error("Error seeding data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to seed data" }),
    };
  }
};
