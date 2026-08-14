// Google OAuth authentication endpoint
// Verifies Google ID token, creates or finds user, returns Vively JWT

const { OAuth2Client } = require("google-auth-library");
const { getUsersCollection, getVerificationCodesCollection } = require("./db");
const { generateToken } = require("./auth");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    if (!GOOGLE_CLIENT_ID) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Google Client ID not configured" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { credential } = body;

    if (!credential) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Google credential (ID token) required" }),
      };
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid Google token" }),
      };
    }

    const {
      email,
      name,
      picture,
      email_verified,
      sub: googleId,
    } = payload;

    if (!email_verified) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Google email not verified" }),
      };
    }

    const users = await getUsersCollection();

    // Normalize email for lookups
    const normalizedEmail = email.toLowerCase();

    // Find existing user
    const user = await users.findOne({ email: normalizedEmail });

    // ===== Case 1: brand-new email → force full signup flow =====
    // We DON'T create the user here. Instead, stash the verified Google
    // identity (googleId + picture) server-side so create-account can
    // securely link it later. This prevents anyone from spoofing a
    // googleId when they finalize the signup.
    if (!user) {
      const codes = await getVerificationCodesCollection();
      await codes.updateOne(
        { email: normalizedEmail },
        {
          $set: {
            email: normalizedEmail,
            googleId,
            googlePicture: picture || null,
            googleName: name || null,
            googleLinkedAt: new Date(),
          },
        },
        { upsert: true }
      );

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          needsSignup: true,
          prefill: {
            email: normalizedEmail,
            name: name || "",
            picture: picture || null,
          },
        }),
      };
    }

    // ===== Case 2: email exists but was created with password only =====
    // Don't silently merge — tell the user to log in with their password
    // (per product decision).
    if (!user.googleId) {
      return {
        statusCode: 409,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error:
            "Email already registered. Please log in with your password.",
          code: "email-exists-password",
        }),
      };
    }

    // ===== Case 3: existing Google-linked user → login =====
    // Keep the profile picture / name fresh from Google.
    if (picture && picture !== user.picture) {
      await users.updateOne(
        { _id: user._id },
        { $set: { picture, updatedAt: new Date() } }
      );
      user.picture = picture;
    }

    // Generate Vively JWT
    const token = generateToken(user._id, user.email, user.role || "user");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Login successful",
        token,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role || "user",
        },
      }),
    };
  } catch (error) {
    console.error("Google auth error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Google authentication failed",
        details: error.message,
      }),
    };
  }
};
