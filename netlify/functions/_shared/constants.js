// Vively Global — centralized constants.
// Import from anywhere in netlify/functions/*.js OR from browser code via
// a copy in assets/js/constants.js if needed (Netlify Functions can't be
// require()'d from browsers).

// ============ ROLES ============
// Keep in sync with any UI role selectors.
const ROLES = Object.freeze({
  CREATOR: "creator",
  BRAND: "brand",
  STAFF: "staff",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
});

const ALL_ROLES = Object.values(ROLES);

// Legacy role name used before the platform split; treat as CREATOR.
// auth-login/auth-signup previously created users with role:"user".
const LEGACY_USER_ROLE = "user";

function normalizeRole(role) {
  if (role === LEGACY_USER_ROLE) return ROLES.CREATOR;
  return role;
}

// ============ ACCOUNT STATUS ============
const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: "active",
  PENDING: "pending",
  SUSPENDED: "suspended",
  DEACTIVATED: "deactivated",
});

// ============ CAMPAIGN STATUS ============
// Full lifecycle for a brand-created campaign.
const CAMPAIGN_STATUS = Object.freeze({
  DRAFT: "draft",
  PENDING_REVIEW: "pending_review",
  REVISION_REQUESTED: "revision_requested",
  REJECTED: "rejected",
  APPROVED: "approved",
  PUBLISHED: "published",
  APPLICATION_CLOSED: "application_closed",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  ARCHIVED: "archived",
});

// Allowed status transitions. Any transition NOT listed is rejected.
const CAMPAIGN_TRANSITIONS = Object.freeze({
  [CAMPAIGN_STATUS.DRAFT]: [CAMPAIGN_STATUS.PENDING_REVIEW],
  [CAMPAIGN_STATUS.PENDING_REVIEW]: [
    CAMPAIGN_STATUS.APPROVED,
    CAMPAIGN_STATUS.REVISION_REQUESTED,
    CAMPAIGN_STATUS.REJECTED,
  ],
  [CAMPAIGN_STATUS.REVISION_REQUESTED]: [CAMPAIGN_STATUS.PENDING_REVIEW],
  [CAMPAIGN_STATUS.REJECTED]: [], // terminal (unless super admin overrides)
  [CAMPAIGN_STATUS.APPROVED]: [CAMPAIGN_STATUS.PUBLISHED],
  [CAMPAIGN_STATUS.PUBLISHED]: [
    CAMPAIGN_STATUS.APPLICATION_CLOSED,
    CAMPAIGN_STATUS.IN_PROGRESS,
  ],
  [CAMPAIGN_STATUS.APPLICATION_CLOSED]: [CAMPAIGN_STATUS.IN_PROGRESS],
  [CAMPAIGN_STATUS.IN_PROGRESS]: [CAMPAIGN_STATUS.COMPLETED],
  [CAMPAIGN_STATUS.COMPLETED]: [CAMPAIGN_STATUS.ARCHIVED],
  [CAMPAIGN_STATUS.ARCHIVED]: [],
});

// Publicly visible statuses (public campaigns page filter).
const PUBLIC_CAMPAIGN_STATUSES = Object.freeze([
  CAMPAIGN_STATUS.PUBLISHED,
  CAMPAIGN_STATUS.APPLICATION_CLOSED,
  CAMPAIGN_STATUS.IN_PROGRESS,
]);

function canTransitionCampaign(from, to) {
  if (!from || !to) return false;
  const allowed = CAMPAIGN_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

// ============ APPLICATION STATUS ============
const APPLICATION_STATUS = Object.freeze({
  APPLIED: "applied",
  UNDER_REVIEW: "under_review",
  SHORTLISTED: "shortlisted",
  SELECTED: "selected",
  REJECTED: "rejected",
  CONFIRMED: "confirmed",
  WITHDRAWN: "withdrawn",
});

const APPLICATION_TRANSITIONS = Object.freeze({
  [APPLICATION_STATUS.APPLIED]: [
    APPLICATION_STATUS.UNDER_REVIEW,
    APPLICATION_STATUS.WITHDRAWN,
  ],
  [APPLICATION_STATUS.UNDER_REVIEW]: [
    APPLICATION_STATUS.SHORTLISTED,
    APPLICATION_STATUS.REJECTED,
    APPLICATION_STATUS.SELECTED,
  ],
  [APPLICATION_STATUS.SHORTLISTED]: [
    APPLICATION_STATUS.SELECTED,
    APPLICATION_STATUS.REJECTED,
  ],
  [APPLICATION_STATUS.SELECTED]: [
    APPLICATION_STATUS.CONFIRMED,
    APPLICATION_STATUS.REJECTED,
  ],
  [APPLICATION_STATUS.CONFIRMED]: [],
  [APPLICATION_STATUS.REJECTED]: [],
  [APPLICATION_STATUS.WITHDRAWN]: [],
});

function canTransitionApplication(from, to) {
  if (!from || !to) return false;
  const allowed = APPLICATION_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

// ============ CAMPAIGN PARTICIPANT STATUS ============
const PARTICIPANT_STATUS = Object.freeze({
  SELECTED: "selected",
  CONFIRMED: "confirmed",
  PRODUCT_PREPARATION: "product_preparation",
  PRODUCT_SHIPPED: "product_shipped",
  PRODUCT_RECEIVED: "product_received",
  CONTENT_IN_PROGRESS: "content_in_progress",
  DRAFT_SUBMITTED: "draft_submitted",
  UNDER_CONTENT_REVIEW: "under_content_review",
  REVISION_REQUESTED: "revision_requested",
  CONTENT_APPROVED: "content_approved",
  POSTED: "posted",
  ANALYTICS_SUBMITTED: "analytics_submitted",
  PAYMENT_PENDING: "payment_pending",
  PAID: "paid",
  COMPLETED: "completed",
});

// ============ PAYMENT STATUS ============
const PAYMENT_STATUS = Object.freeze({
  NOT_APPLICABLE: "not_applicable",
  PENDING: "pending",
  PROCESSING: "processing",
  PAID: "paid",
  FAILED: "failed",
});

// ============ CATEGORIES ============
const CREATOR_CATEGORIES = Object.freeze([
  "Beauty",
  "Skincare",
  "Makeup",
  "Fashion",
  "Food",
  "Beverage",
  "Travel",
  "Lifestyle",
  "Fitness",
  "Health",
  "Parenting",
  "Technology",
  "Gaming",
  "Education",
  "Entertainment",
  "K-Pop",
  "K-Beauty",
  "Korean Culture",
  "Photography",
  "Business",
  "Finance",
  "Other",
]);

const BRAND_INDUSTRIES = Object.freeze([
  "Beauty",
  "Skincare",
  "Cosmetics",
  "Fashion",
  "Food & Beverage",
  "Healthcare",
  "Travel",
  "Hospitality",
  "Technology",
  "Entertainment",
  "Education",
  "Consumer Goods",
  "Lifestyle",
  "Other",
]);

// ============ SOCIAL PLATFORMS ============
const SOCIAL_PLATFORMS = Object.freeze([
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
  "Threads",
  "Lemon8",
  "Xiaohongshu",
  "Blog",
  "Other",
]);

module.exports = {
  ROLES,
  ALL_ROLES,
  LEGACY_USER_ROLE,
  normalizeRole,
  ACCOUNT_STATUS,
  CAMPAIGN_STATUS,
  CAMPAIGN_TRANSITIONS,
  PUBLIC_CAMPAIGN_STATUSES,
  canTransitionCampaign,
  APPLICATION_STATUS,
  APPLICATION_TRANSITIONS,
  canTransitionApplication,
  PARTICIPANT_STATUS,
  PAYMENT_STATUS,
  CREATOR_CATEGORIES,
  BRAND_INDUSTRIES,
  SOCIAL_PLATFORMS,
};
