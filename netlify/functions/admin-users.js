// Admin: list, view, and manage registered users (creators)
const { getUsersCollection } = require("./db");
const { verifyRequest } = require("./auth");
const { ObjectId } = require("mongodb");

// Strip sensitive fields before returning
function sanitizeUser(user) {
  if (!user) return user;
  // eslint-disable-next-line no-unused-vars
  const { password, passwordHash, ...rest } = user;
  return rest;
}

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

  const users = await getUsersCollection();

  // Extract :id from path (Netlify routes /.netlify/functions/admin-users/:id here)
  const pathParts = (event.path || "").split("/").filter(Boolean);
  const fnIndex = pathParts.indexOf("admin-users");
  const id = fnIndex >= 0 ? pathParts[fnIndex + 1] : undefined;

  // ========== GET ==========
  if (event.httpMethod === "GET") {
    try {
      if (id) {
        let objectId;
        try {
          objectId = new ObjectId(id);
        } catch (_) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid user ID" }),
          };
        }
        const user = await users.findOne({ _id: objectId });
        if (!user) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: "User not found" }),
          };
        }
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sanitizeUser(user)),
        };
      }

      // List: exclude admin accounts, newest first
      const results = await users
        .find({ role: { $ne: "admin" } })
        .project({ password: 0, passwordHash: 0 })
        .sort({ createdAt: -1 })
        .toArray();

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(results),
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch users" }),
      };
    }
  }

  // ========== PATCH (toggle active / change role) ==========
  if (event.httpMethod === "PATCH") {
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "User ID required" }),
      };
    }
    try {
      const body = JSON.parse(event.body || "{}");
      const update = {};
      if (typeof body.isActive === "boolean") update.isActive = body.isActive;
      if (typeof body.role === "string" && ["creator", "user", "admin"].includes(body.role)) {
        update.role = body.role;
      }
      if (Object.keys(update).length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Nothing to update" }),
        };
      }
      update.updatedAt = new Date();

      const result = await users.updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      );

      if (result.matchedCount === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "User not found" }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "User updated", id, update }),
      };
    } catch (error) {
      console.error("Error updating user:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to update user" }),
      };
    }
  }

  // ========== DELETE ==========
  if (event.httpMethod === "DELETE") {
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "User ID required" }),
      };
    }
    try {
      const result = await users.deleteOne({ _id: new ObjectId(id) });
      if (result.deletedCount === 0) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "User not found" }),
        };
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "User deleted", id }),
      };
    } catch (error) {
      console.error("Error deleting user:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to delete user" }),
      };
    }
  }

  return {
    statusCode: 405,
    body: JSON.stringify({ error: "Method not allowed" }),
  };
};
