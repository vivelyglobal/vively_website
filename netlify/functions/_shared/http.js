// Small HTTP helpers shared by every function: JSON responses, CORS
// preflight, client IP extraction and error detail redaction.
//
// The API is only ever called same-origin (Cloudflare Pages proxies /api/* to
// Render; `netlify dev` serves functions on the same host), so a wildcard
// Access-Control-Allow-Origin is never needed. When SITE_URL is set we echo
// it so a preflight from the real site still succeeds; otherwise no CORS
// header is emitted at all (same-origin requests ignore it either way).
const IS_PROD = process.env.NODE_ENV === "production";
const SITE_ORIGIN = (() => {
  try {
    return process.env.SITE_URL ? new URL(process.env.SITE_URL).origin : "";
  } catch {
    return "";
  }
})();

function corsHeaders(extra = {}) {
  const headers = { ...extra };
  if (SITE_ORIGIN) {
    headers["Access-Control-Allow-Origin"] = SITE_ORIGIN;
    headers.Vary = "Origin";
  }
  return headers;
}

function preflight(methods = "POST, OPTIONS", allowHeaders = "Content-Type, Authorization") {
  return {
    statusCode: 204,
    headers: corsHeaders({
      "Access-Control-Allow-Headers": allowHeaders,
      "Access-Control-Allow-Methods": methods,
    }),
    body: "",
  };
}

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: corsHeaders({ "Content-Type": "application/json", ...extraHeaders }),
    body: JSON.stringify(body),
  };
}

// Best-effort client IP for rate limiting. Cloudflare sets cf-connecting-ip
// on the original request and the Pages proxy forwards it; Netlify sets
// x-nf-client-connection-ip; Render/Express fall back to x-forwarded-for.
function clientIp(event) {
  const h = (event && event.headers) || {};
  const get = (name) => h[name] || h[name.toLowerCase()] || h[name.toUpperCase()] || "";
  const raw =
    get("cf-connecting-ip") ||
    get("x-nf-client-connection-ip") ||
    get("x-real-ip") ||
    String(get("x-forwarded-for")).split(",")[0];
  return String(raw || "unknown").trim().slice(0, 64);
}

// Internal error messages (Mongo/Cloudinary/Google stack text) are only
// useful to a developer and can reveal infrastructure details, so they are
// returned to the client in development only.
function errorDetails(error) {
  if (IS_PROD) return undefined;
  return error && error.message ? error.message : undefined;
}

module.exports = { IS_PROD, SITE_ORIGIN, corsHeaders, preflight, json, clientIp, errorDetails };
