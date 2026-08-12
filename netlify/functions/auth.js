// Auth helpers
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

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
