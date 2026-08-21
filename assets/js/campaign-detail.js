// campaign-detail.js - Campaign detail page
document.addEventListener("DOMContentLoaded", async () => {
  const TOKEN_KEY = "vively_user_token";
  const USER_KEY = "vively_user_data";

  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = String(urlParams.get("id") || "").trim();
  const detailContent = document.getElementById("detail-content");
  const applyContainer = document.getElementById("apply-container");
  const formSuccess = document.getElementById("form-success");

  if (!campaignId) {
    detailContent.innerHTML =
      '<p class="error">Campaign not found. <a href="campaigns.html">Back to campaigns</a></p>';
    return;
  }

  let currentCampaign = null;

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDateLabel(value, fallback = "TBD") {
    if (!value) return fallback;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return escapeHtml(value);
    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function normalizeGuidelines(guidelines) {
    if (Array.isArray(guidelines)) {
      return guidelines
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    }

    if (typeof guidelines === "string") {
      return guidelines
        .split(/\r?\n|;/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  function normalizeTargetAudience(targetAudience) {
    if (Array.isArray(targetAudience)) {
      return targetAudience
        .map((item) => {
          if (!item) return null;
          if (typeof item === "string") {
            return { label: "Audience", value: item };
          }
          return {
            label: String(item.label || "Audience").trim(),
            value: String(item.value || "").trim(),
          };
        })
        .filter((item) => item && item.value);
    }

    if (typeof targetAudience === "string") {
      return targetAudience
        .split(/\r?\n|;/)
        .map((value) => value.trim())
        .filter(Boolean)
        .map((value) => ({ label: "Audience", value }));
    }

    return [];
  }

  async function loadCampaignDetail() {
    try {
      const response = await fetch(
        `/.netlify/functions/campaigns?id=${encodeURIComponent(campaignId)}`
      );
      if (!response.ok) throw new Error("Campaign not found");

      const payload = await response.json();
      if (!payload || typeof payload !== "object") {
        throw new Error("Invalid campaign payload");
      }

      currentCampaign = payload;
      renderCampaignDetail(currentCampaign);
      renderApplyBox();
    } catch (error) {
      console.error("Error loading campaign:", error);
      detailContent.innerHTML =
        '<p class="error">Failed to load campaign. <a href="campaigns.html">Back to campaigns</a></p>';
    }
  }

  function renderCampaignDetail(campaign) {
    const session = getStoredUser();
    const isLoggedIn = Boolean(session && session.token);
    const guidelines = normalizeGuidelines(campaign.guidelines);
    const targetAudience = normalizeTargetAudience(campaign.targetAudience);

    const title = escapeHtml(campaign.title || "Untitled campaign");
    const brand = escapeHtml(campaign.brand || "Unknown brand");
    const category = escapeHtml(campaign.category || "Campaign");
    const imageUrl = escapeHtml(campaign.imageUrl || "assets/img/placeholder.jpg");
    const location = escapeHtml(campaign.location || "Seoul");
    const experienceType = escapeHtml(campaign.experienceType || "TBD");
    const contentType = escapeHtml(campaign.contentType || "Video/Photos");
    const minFollowers = escapeHtml(campaign.minFollowers || "No requirement");
    const budget = escapeHtml(campaign.budget || "TBD");
    const spots = escapeHtml(campaign.spots || "TBD");
    const deadline = formatDateLabel(campaign.deadline, "No deadline");
    const platform = escapeHtml(campaign.platform || "Instagram/TikTok");
    const description = escapeHtml(campaign.description || "No campaign description available yet.");

    const guidelinesMarkup = guidelines.length
      ? guidelines.map((g) => `<li>${escapeHtml(g)}</li>`).join("")
      : `<li>Guidelines will be shared after approval.</li>`;

    const targetAudienceMarkup = targetAudience.length
      ? targetAudience
          .map(
            (a) =>
              `<li><strong>${escapeHtml(a.label)}:</strong> ${escapeHtml(a.value)}</li>`
          )
          .join("")
      : `<li><strong>Audience:</strong> Open to suitable creators</li>`;

    detailContent.innerHTML = `
      <div class="campaign-hero-detail">
        <img src="${imageUrl}" alt="${title}" />
        <div class="campaign-header-overlay">
          <span class="campaign-tag">${category}</span>
          <h1>${title}</h1>
          <p>${brand}</p>
        </div>
      </div>

      <div class="campaign-detail-gated">
        <div class="campaign-detail-body${isLoggedIn ? '' : ' is-locked'}">
          <div class="campaign-details-table">
            <div class="detail-row">
              <span class="detail-label">Location</span>
              <span class="detail-value">${location}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Experience Type</span>
              <span class="detail-value">${experienceType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Content Type</span>
              <span class="detail-value">${contentType}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Min. Followers</span>
              <span class="detail-value">${minFollowers}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Budget Range</span>
              <span class="detail-value">${budget}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Available Spots</span>
              <span class="detail-value">${spots}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Application Deadline</span>
              <span class="detail-value">${deadline}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Platform</span>
              <span class="detail-value">${platform}</span>
            </div>
          </div>

          <div class="campaign-description">
            <h2>About this Campaign</h2>
            <p>${description}</p>
          </div>

          <div class="campaign-guidelines">
            <h2>Guidelines</h2>
            <ul>
              ${guidelinesMarkup}
            </ul>
          </div>

          <div class="campaign-target-audience">
            <h2>Target Audience</h2>
            <ul>
              ${targetAudienceMarkup}
            </ul>
          </div>
        </div>
        ${
          isLoggedIn
            ? ""
            : `
          <div class="campaign-detail-lock" role="region" aria-label="Login required to view full details">
            <div class="campaign-detail-lock-icon" aria-hidden="true">🔒</div>
            <h3>Full campaign detail is locked</h3>
            <p>Log in or sign up to view all campaign requirements, guideline details, and audience fit</p>
            <button type="button" id="detail-login-btn" class="btn btn-accent">Log In to Unlock Details</button>
          </div>
        `
        }
      </div>
    `;

    if (!isLoggedIn) {
      const detailLoginBtn = document.getElementById("detail-login-btn");
      if (detailLoginBtn) detailLoginBtn.addEventListener("click", openLoginModal);
    }
  }

  // =========================
  // APPLY BOX (login-gated)
  // =========================
  function getStoredUser() {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    if (!token || !raw) return null;
    try {
      return { token, user: JSON.parse(raw) };
    } catch {
      return null;
    }
  }

  function renderApplyBox() {
    if (!applyContainer) return;
    const session = getStoredUser();

    if (!session) {
      // Not logged in — show login prompt.
      applyContainer.innerHTML = `
        <div class="apply-login-required">
          <p class="apply-login-msg">You need to be logged in to apply for this campaign.</p>
          <button type="button" id="apply-login-btn" class="btn btn-accent">
            Log In / Sign Up to Apply
          </button>
        </div>
      `;
      const btn = document.getElementById("apply-login-btn");
      if (btn) btn.addEventListener("click", openLoginModal);
      return;
    }

    const user = session.user || {};
    const name = user.fullName || user.name || user.username || user.email || "Your account";
    const email = user.email || "";
    const instagram = user.instagram || "";

    applyContainer.innerHTML = `
      <div class="apply-card">
        <p class="apply-card-label">Applying as</p>
        <div class="apply-card-identity">
          <div class="apply-card-name">${escapeHtml(name)}</div>
          <div class="apply-card-meta">
            ${email ? `<span>${escapeHtml(email)}</span>` : ""}
            ${instagram ? `<span>@${escapeHtml(instagram.replace(/^@/, ""))}</span>` : ""}
          </div>
        </div>
        <p class="apply-card-note">
          Your profile details will be shared with the brand and Vively admin
          when you submit.
        </p>
        <button type="button" id="apply-submit-btn" class="btn btn-accent">
          Apply Now
        </button>
        <div id="apply-error" class="apply-error" style="display:none;"></div>
      </div>
    `;

    const submitBtn = document.getElementById("apply-submit-btn");
    if (submitBtn) submitBtn.addEventListener("click", () => submitApplication(session));
  }

  function openLoginModal() {
    // Prefer the header's existing "Log in" link so we reuse its handler
    // (opens modal, shows login view, sets up Google sign-in etc.).
    const link = document.getElementById("login-link");
    if (link) {
      link.click();
    } else {
      const modal = document.getElementById("login-modal");
      if (modal) modal.style.display = "flex";
    }
  }

  async function submitApplication(session) {
    const submitBtn = document.getElementById("apply-submit-btn");
    const errBox = document.getElementById("apply-error");
    if (errBox) {
      errBox.style.display = "none";
      errBox.textContent = "";
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting…";
    }

    try {
      const response = await fetch("/.netlify/functions/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ campaignId }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        // Token expired or invalid — clear stale session and prompt login.
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        renderApplyBox();
        openLoginModal();
        return;
      }

      if (!response.ok) {
        const msg = data.error || "Failed to submit application";
        if (errBox) {
          errBox.textContent = msg;
          errBox.style.display = "block";
        } else {
          alert(msg);
        }
        return;
      }

      applyContainer.style.display = "none";
      if (formSuccess) {
        formSuccess.style.display = "block";
        formSuccess.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      if (errBox) {
        errBox.textContent = "Network error. Please try again.";
        errBox.style.display = "block";
      } else {
        alert("Error submitting application. Please try again.");
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Apply Now";
      }
    }
  }

  // Re-render the apply box when the user logs in or out from the header.
  window.addEventListener("storage", (e) => {
    if (e.key === TOKEN_KEY || e.key === USER_KEY) {
      if (currentCampaign) renderCampaignDetail(currentCampaign);
      renderApplyBox();
    }
  });

  // Same-tab login: user-auth writes to localStorage but no `storage` event
  // fires. Poll briefly for a token change so the apply box updates after
  // the modal login flow completes.
  let lastTokenSeen = localStorage.getItem(TOKEN_KEY);
  setInterval(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (t !== lastTokenSeen) {
      lastTokenSeen = t;
      if (currentCampaign) renderCampaignDetail(currentCampaign);
      renderApplyBox();
    }
  }, 800);

  loadCampaignDetail();
});
