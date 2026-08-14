// Vively Global — centralized permission checks.
// Usage from any function:
//   const { requireRole, canUser, PERMISSIONS } = require("./_shared/permissions");
//   const auth = verifyRequest(event);
//   const denial = requireRole(auth, [ROLES.ADMIN, ROLES.SUPER_ADMIN]);
//   if (denial) return denial; // { statusCode, body }

const { ROLES, normalizeRole } = require("./constants");

// ============ PERMISSIONS ============
// Grouped by domain. Keep as strings so they're easy to log / audit.
const PERMISSIONS = Object.freeze({
  // Campaigns
  CAMPAIGN_CREATE: "campaign.create",
  CAMPAIGN_READ_ANY: "campaign.read_any",
  CAMPAIGN_EDIT_OWN: "campaign.edit_own",
  CAMPAIGN_EDIT_ANY: "campaign.edit_any",
  CAMPAIGN_DELETE: "campaign.delete",
  CAMPAIGN_APPROVE: "campaign.approve",
  CAMPAIGN_PUBLISH: "campaign.publish",

  // Applications
  APPLICATION_CREATE: "application.create",
  APPLICATION_READ_OWN: "application.read_own",
  APPLICATION_READ_FOR_OWN_CAMPAIGN: "application.read_for_own_campaign",
  APPLICATION_READ_ANY: "application.read_any",
  APPLICATION_TRANSITION: "application.transition",

  // Users / brands / creators
  USER_LIST: "user.list",
  USER_UPDATE_ANY: "user.update_any",
  USER_SUSPEND: "user.suspend",
  BRAND_APPROVE: "brand.approve",

  // Uploads
  UPLOAD_IMAGE: "upload.image",

  // Audit / system
  AUDIT_READ: "audit.read",
  SEED_RUN: "seed.run",
});

// Role -> set of permissions.
// Brand & Creator get scoped permissions (own-only); admins get full access.
const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.CREATOR]: new Set([
    PERMISSIONS.APPLICATION_CREATE,
    PERMISSIONS.APPLICATION_READ_OWN,
    PERMISSIONS.UPLOAD_IMAGE,
  ]),
  [ROLES.BRAND]: new Set([
    PERMISSIONS.CAMPAIGN_CREATE,
    PERMISSIONS.CAMPAIGN_EDIT_OWN,
    PERMISSIONS.APPLICATION_READ_FOR_OWN_CAMPAIGN,
    PERMISSIONS.UPLOAD_IMAGE,
  ]),
  [ROLES.STAFF]: new Set([
    PERMISSIONS.CAMPAIGN_READ_ANY,
    PERMISSIONS.APPLICATION_READ_ANY,
    PERMISSIONS.APPLICATION_TRANSITION,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.AUDIT_READ,
  ]),
  [ROLES.ADMIN]: new Set([
    PERMISSIONS.CAMPAIGN_CREATE,
    PERMISSIONS.CAMPAIGN_READ_ANY,
    PERMISSIONS.CAMPAIGN_EDIT_ANY,
    PERMISSIONS.CAMPAIGN_DELETE,
    PERMISSIONS.CAMPAIGN_APPROVE,
    PERMISSIONS.CAMPAIGN_PUBLISH,
    PERMISSIONS.APPLICATION_READ_ANY,
    PERMISSIONS.APPLICATION_TRANSITION,
    PERMISSIONS.USER_LIST,
    PERMISSIONS.USER_UPDATE_ANY,
    PERMISSIONS.USER_SUSPEND,
    PERMISSIONS.BRAND_APPROVE,
    PERMISSIONS.UPLOAD_IMAGE,
    PERMISSIONS.AUDIT_READ,
  ]),
  [ROLES.SUPER_ADMIN]: new Set(Object.values(PERMISSIONS)), // everything
});

// Returns true if the given user (JWT payload) has a permission.
function canUser(user, permission) {
  if (!user || !user.role) return false;
  const role = normalizeRole(user.role);
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return perms.has(permission);
}

// Convenience: returns a 401/403 response if auth failed or user lacks role.
// Returns null on success (allowed to proceed).
function requireRole(auth, allowedRoles) {
  if (!auth || auth.error) {
    return {
      statusCode: (auth && auth.status) || 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: (auth && auth.error) || "Unauthorized" }),
    };
  }
  const role = normalizeRole(auth.user.role);
  const allowed = allowedRoles.map(normalizeRole);
  if (!allowed.includes(role)) {
    return {
      statusCode: 403,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Forbidden: insufficient permissions" }),
    };
  }
  return null;
}

function requirePermission(auth, permission) {
  if (!auth || auth.error) {
    return {
      statusCode: (auth && auth.status) || 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: (auth && auth.error) || "Unauthorized" }),
    };
  }
  if (!canUser(auth.user, permission)) {
    return {
      statusCode: 403,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: `Forbidden: missing permission '${permission}'`,
      }),
    };
  }
  return null;
}

module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  canUser,
  requireRole,
  requirePermission,
};
