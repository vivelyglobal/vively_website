// Upload image to local filesystem (assets/uploads/)
// Accepts base64-encoded image, saves to disk, returns public URL
// For production: swap this to Netlify Blobs or CDN

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { verifyRequest } = require("./auth");
const { requirePermission, PERMISSIONS } = require("./_shared/permissions");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Project root: netlify/functions -> ../../
const UPLOAD_DIR = path.join(__dirname, "..", "..", "assets", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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

  // Require auth + upload permission (admin, brand, creator — anyone signed in
  // may upload for their own content). We rely on the caller's endpoint using
  // the returned URL responsibly.
  const auth = verifyRequest(event);
  const denial = requirePermission(auth, PERMISSIONS.UPLOAD_IMAGE);
  if (denial) return denial;

  try {
    const body = JSON.parse(event.body || "{}");
    const { file, filename, contentType } = body;

    if (!file || !contentType) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing 'file' (base64) or 'contentType'",
        }),
      };
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF",
        }),
      };
    }

    // Strip data URL prefix if present
    const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > MAX_SIZE_BYTES) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `File too large. Max ${MAX_SIZE_BYTES / 1024 / 1024} MB`,
        }),
      };
    }

    // Generate unique filename
    const ext = contentType.split("/")[1] || "bin";
    const uniqueName = `${Date.now()}-${crypto
      .randomBytes(6)
      .toString("hex")}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, uniqueName);

    // Save to filesystem
    fs.writeFileSync(filePath, buffer);

    // Public URL (statically served)
    const imageUrl = `/assets/uploads/${uniqueName}`;

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        message: "Upload successful",
        filename: uniqueName,
        imageUrl,
        size: buffer.length,
      }),
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Upload failed",
        details: error.message,
      }),
    };
  }
};
