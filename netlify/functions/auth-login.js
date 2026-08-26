// Email/password login (creators, brands' legacy path, and admin).
const { getUsersCollection } = require("./db");
const { generateToken, comparePassword } = require("./auth");

exports.handler = async (event) => {
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { action, email, password } = body;

      if (!email || !password) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Email and password required" }),
        };
      }

      const users = await getUsersCollection();

      // Account creation only happens through auth-signup.js's verified
      // (email code + age check + unique username) flow. This endpoint is
      // login-only — it used to also accept action:"register" and create an
      // account straight from email+password with no verification at all,
      // bypassing that entire flow. Nothing in the frontend called it, so
      // it was a live but unused hole; removed rather than left dangling.

      // LOGIN
      if (action === "login") {
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
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
