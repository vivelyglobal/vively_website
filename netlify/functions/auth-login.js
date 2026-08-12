// Simple login/register (email/password for now, OAuth added later)
const { getUsersCollection } = require("./db");
const { generateToken, hashPassword, comparePassword } = require("./auth");

exports.handler = async (event) => {
  if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      const { action, email, password, name } = body;

      if (!email || !password) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Email and password required" }),
        };
      }

      const users = await getUsersCollection();

      // REGISTER
      if (action === "register") {
        const existing = await users.findOne({ email });
        if (existing) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "Email already registered" }),
          };
        }

        const passwordHash = await hashPassword(password);
        const user = {
          email,
          name: name || email.split("@")[0],
          passwordHash,
          role: "user",
          createdAt: new Date(),
        };

        const result = await users.insertOne(user);
        const token = generateToken(result.insertedId, email);

        return {
          statusCode: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "User registered successfully",
            token,
            user: {
              _id: result.insertedId,
              email,
              name: user.name,
              role: "user",
            },
          }),
        };
      }

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
