// Auth helpers
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");

// Fail loudly in production if the JWT secret is missing. Only fall back to
// a dev secret when NODE_ENV !== "production" (local dev / preview builds).
const JWT_SECRET = (() => {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is required in production and must be at least 16 characters."
    );
  }
  console.warn("[auth] JWT_SECRET missing/short — using dev fallback (NOT for production)");
  return "dev-secret-key-do-not-use-in-production";
})();

function generateToken(userId, email, role = "user") {
  return jwt.sign(
    { userId, email, role, iat: Date.now() },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

async function hashPassword(password) {
  return await bcryptjs.hash(password, 10);
}

async function comparePassword(password, hash) {
  return await bcryptjs.compare(password, hash);
}

function getTokenFromHeaders(headers) {
  const auth = headers.authorization || headers.Authorization || "";
  const parts = auth.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    return parts[1];
  }
  return null;
}

function verifyRequest(event) {
  const token = getTokenFromHeaders(event.headers);
  if (!token) {
    return { error: "No authorization token", status: 401 };
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return { error: "Invalid or expired token", status: 401 };
  }
  return { user: decoded };
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  getTokenFromHeaders,
  verifyRequest,
  JWT_SECRET,
};
