// Cloudinary client — shared by upload-image.js (public campaign/profile
// images) and auth-brand.js (private KYC documents).
//
// Configure via env vars on Render/Netlify:
//   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
// (or the three separate CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY /
// CLOUDINARY_API_SECRET vars — either form works, the SDK reads
// CLOUDINARY_URL from the environment automatically).
const cloudinary = require("cloudinary").v2;

const configured = Boolean(
  process.env.CLOUDINARY_URL ||
    (process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET)
);

if (configured && !process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function isConfigured() {
  return configured;
}

// Public images (campaign photos, profile pics, uploaded creative).
// Cloudinary auto-serves the best format/size per requesting browser.
async function uploadPublicImage(dataUrl, { folder } = {}) {
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: folder || "vively/uploads",
    resource_type: "image",
  });
  return { url: result.secure_url, publicId: result.public_id };
}

// Private documents (business registration certs, etc). Uploaded with
// type:"authenticated" so the asset is NOT reachable at a guessable public
// URL — only through a signed URL generated on demand (see getSignedDocumentUrl).
async function uploadPrivateDocument(dataUrl, { folder } = {}) {
  const result = await cloudinary.uploader.upload(dataUrl, {
    folder: folder || "vively/business-docs",
    resource_type: "auto", // handles both images and PDFs
    type: "authenticated",
  });
  return { publicId: result.public_id, resourceType: result.resource_type };
}

// Generates a signed delivery URL for a type:"authenticated" asset. The
// signature ties the URL to this specific asset + our API secret, so it
// can't be guessed or reused for a different file. (Time-limited expiry
// requires Cloudinary's token-auth add-on — not included on the free plan —
// so treat this as "not publicly discoverable", not "expires after N minutes".
// Always generate it fresh server-side per authorized request; never store
// or embed it in a public page.)
function getSignedDocumentUrl(publicId, resourceType = "image") {
  return cloudinary.url(publicId, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
  });
}

module.exports = {
  isConfigured,
  uploadPublicImage,
  uploadPrivateDocument,
  getSignedDocumentUrl,
};
