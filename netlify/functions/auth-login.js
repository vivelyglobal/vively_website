// Email/password login (creators, brands' legacy path, and admin), plus
// forgot-password / reset-password for the same `users` collection.
const { getUsersCollection } = require("./db");
const { generateToken, comparePassword, hashPassword } = require("./auth");
const {
  requestPasswordReset,
  consumeResetToken,
  validateNewPassword,
} = require("./_shared/password-reset");

function normalizeEmail(v) {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { action } = body;

    // ========== FORGOT PASSWORD ==========
    if (action === "forgot-password") {
      const email = normalizeEmail(body.email);
      if (!email) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Email required" }),
        };
      }

      const users = await getUsersCollection();
      const user = await users.findOne({ email });
      // Only actually send when the account exists, but ALWAYS return the
      // same generic response either way — otherwise this endpoint could be
      // used to check which emails are registered.
      if (user) {
        await requestPasswordReset(email, "user");
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "If that email is registered, a reset link has been sent.",
        }),
      };
    }

    // ========== RESET PASSWORD ==========
    if (action === "reset-password") {
      const { token, newPassword } = body;
      if (!token || !newPassword) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Token and new password required" }),
        };
      }

      const passwordError = validateNewPassword(newPassword);
      if (passwordError) {
        return { statusCode: 400, body: JSON.stringify({ error: passwordError }) };
      }

      const record = await consumeResetToken(token, "user");
      if (!record) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "This reset link is invalid or has expired." }),
        };
      }

      const users = await getUsersCollection();
      const passwordHash = await hashPassword(newPassword);
      const result = await users.updateOne(
        { email: record.email },
        { $set: { passwordHash, updatedAt: new Date() } }
      );
      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Account no longer exists" }),
        };
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Password updated. You can now log in." }),
      };
    }

    // ========== LOGIN ==========
    if (action === "login") {
      const email = body.email;
      const password = body.password;
      if (!email || !password) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Email and password required" }),
        };
      }

      const users = await getUsersCollection();
      const user = await users.findOne({ email });
      if (!user) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "Invalid email or password" }),
        };
      }

      const validPassword = await comparePassword(password, user.passwordHash);
      if (!validPassword) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: "Invalid email or password" }),
        };
      }

      const token = generateToken(user._id, email, user.role);
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Login successful",
          token,
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        }),
      };
    }

    // Account creation only happens through auth-signup.js's verified
    // (email code + age check + unique username) flow. This endpoint used
    // to also accept action:"register" and create an account straight from
    // email+password with no verification at all, bypassing that entire
    // flow. Nothing in the frontend called it, so it was a live but unused
    // hole; removed rather than left dangling.

    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid action" }),
    };
  } catch (error) {
    console.error("Error in auth:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Authentication failed" }),
    };
  }
};
