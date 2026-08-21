// admin.js - Admin panel
document.addEventListener("DOMContentLoaded", () => {
  let currentUser = null;
  let authToken = null;
  const loginSection = document.getElementById("login-section");
  const adminSidebar = document.querySelector(".admin-sidebar");
  const adminHeader = document.getElementById("admin-header");
  const adminForm = document.getElementById("admin-login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const userInfo = document.getElementById("user-info");
  const campaignsGrid = document.getElementById("campaigns-grid");
  const campaignDetailPanel = document.getElementById("campaign-detail-panel");
  let campaignsCache = [];

  // Check if user is logged in
  function checkAuth() {
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");

    if (token && user) {
      try {
        authToken = token;
        currentUser = JSON.parse(user);
      } catch (error) {
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        authToken = null;
        currentUser = null;
      }
    }

    if (authToken && currentUser) {
      loginSection.style.display = "none";
      adminSidebar.style.display = "block";
      if (adminHeader) adminHeader.style.display = "flex";
      updateUserInfo();
      loadDashboard();
    } else {
      loginSection.style.display = "flex";
      adminSidebar.style.display = "none";
      if (adminHeader) adminHeader.style.display = "none";
    }
  }

  function updateUserInfo() {
    if (currentUser) {
      userInfo.textContent = currentUser.email;
    }
  }

  // Handle login
  adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
      const response = await fetch("/.netlify/functions/auth-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (!data.user || data.user.role !== "admin") {
          alert("Admin account required");
          return;
        }

        authToken = data.token;
        currentUser = data.user;

        localStorage.setItem("adminToken", authToken);
        localStorage.setItem("adminUser", JSON.stringify(currentUser));

        loginSection.style.display = "none";
        adminSidebar.style.display = "block";
        if (adminHeader) adminHeader.style.display = "flex";
        updateUserInfo();
        loadDashboard();
      } else {
        alert(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  });

  // Handle logout
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    currentUser = null;
    authToken = null;
    location.reload();
  });

  // Navigate sections
  document.querySelectorAll(".sidebar-nav .nav-item:not(.logout)").forEach((item) => {
    item.addEventListener("click", (e) => {
      const section = e.target.dataset.section;
      if (section) {
        showSection(section);
      }
    });
  });

  function showSection(sectionId) {
    const headerTitleMap = {
      dashboard: "Overview",
      campaigns: "Campaign Studio",
      applications: "Applications Hub",
      users: "User Directory",
      profile: "Admin Profile",
    };

    document.querySelectorAll(".admin-section").forEach((s) => {
      s.classList.remove("active");
    });
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.add("active");
      document.getElementById("section-title").textContent =
        headerTitleMap[sectionId] || "Admin";

      if (sectionId === "campaigns") {
        loadCampaigns();
      } else if (sectionId === "applications") {
        loadApplications();
      } else if (sectionId === "users") {
        loadUsers();
      } else if (sectionId === "profile") {
        loadProfile();
      }
    }
  }

  async function loadDashboard() {
    try {
      const [campaignsRes, applicationsRes, usersRes] = await Promise.all([
        fetch("/.netlify/functions/admin-campaigns", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch("/.netlify/functions/applications", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch("/.netlify/functions/admin-users", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);
      const campaigns = campaignsRes.ok ? await campaignsRes.json() : [];
      const applications = applicationsRes.ok ? await applicationsRes.json() : [];
      const users = usersRes.ok ? await usersRes.json() : [];

      document.getElementById("stat-campaigns").textContent = campaigns.length || 0;
      document.getElementById("stat-applications").textContent = applications.length || 0;
      const usersStat = document.getElementById("stat-users");
      if (usersStat) usersStat.textContent = users.length || 0;
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  }

  async function loadCampaigns() {
    try {
      const response = await fetch("/.netlify/functions/admin-campaigns", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load campaigns");
      }
      const campaigns = await response.json();
      campaignsCache = Array.isArray(campaigns) ? campaigns : [];
      renderCampaignCards(campaignsCache);
      if (campaignDetailPanel) campaignDetailPanel.style.display = "none";
    } catch (error) {
      console.error("Error loading campaigns:", error);
      if (campaignsGrid) {
        campaignsGrid.innerHTML =
          '<p class="admin-campaign-empty">Failed to load campaigns.</p>';
      }
    }
  }

  function formatMoney(value) {
    const rawValue = String(value || "").trim();
    if (!rawValue) return "TBD";

    const formatPart = (part) => {
      const numericValue = Number(String(part || "").replace(/[^\d]/g, ""));
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return String(part || "").trim();
      }
      return `₩${numericValue.toLocaleString("en-US")}`;
    };

    const rangeMatch = rawValue.match(/^(.*\d)\s*-\s*(.*\d)$/);
    if (rangeMatch) {
      return `${formatPart(rangeMatch[1])} - ${formatPart(rangeMatch[2])}`;
    }

    if (/^\d+$/.test(rawValue)) {
      return `₩${Number(rawValue).toLocaleString("en-US")}`;
    }

    return rawValue;
  }

  function renderCampaignCards(campaigns) {
    if (!campaignsGrid) return;

    if (!campaigns.length) {
      campaignsGrid.innerHTML =
        '<p class="admin-campaign-empty">No campaigns found yet.</p>';
      return;
    }

    campaignsGrid.innerHTML = campaigns
      .map(
        (campaign) => `
      <article class="admin-campaign-card">
        <div class="admin-campaign-image">
          <img src="${campaign.imageUrl || "assets/img/content-04.jpeg"}" alt="${escapeHtml(campaign.title || "Campaign")}" loading="lazy" />
          <span class="admin-campaign-category">${escapeHtml(campaign.category || "Campaign")}</span>
          <span class="admin-campaign-status ${campaign.isActive ? "is-active" : "is-inactive"}">
            ${campaign.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <div class="admin-campaign-content">
          <div class="admin-campaign-brand">${escapeHtml(campaign.brand || "-")}</div>
          <h3>${escapeHtml(campaign.title || "Untitled campaign")}</h3>
          <p>${escapeHtml(String(campaign.description || "").slice(0, 110))}${campaign.description && campaign.description.length > 110 ? "..." : ""}</p>
          <div class="admin-campaign-meta">
            <span><strong>Budget:</strong> ${escapeHtml(formatMoney(campaign.budget))}</span>
            <span><strong>Deadline:</strong> ${escapeHtml(campaign.deadline || "TBD")}</span>
            <span><strong>Applicants:</strong> ${Number(campaign.applicantCount || 0)}</span>
          </div>
          <div class="admin-campaign-actions">
            <button class="btn-view" onclick="viewCampaignDetails('${campaign._id}')">Details</button>
            <button class="btn-edit" onclick="editCampaign('${campaign._id}')">Edit</button>
            <button class="btn-delete" onclick="deleteCampaign('${campaign._id}')">Delete</button>
          </div>
        </div>
      </article>
    `
      )
      .join("");
  }

  async function renderCampaignDetailPanel(campaign) {
    if (!campaignDetailPanel || !campaign) return;

    let applications = [];
    try {
      const response = await fetch(
        `/.netlify/functions/applications?campaignId=${encodeURIComponent(campaign._id)}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      applications = response.ok ? await response.json() : [];
    } catch (error) {
      console.error("Error loading campaign applications:", error);
      applications = [];
    }

    const applicantsMarkup = applications.length
      ? applications
          .map(
            (app) => `
          <tr data-app-status="${escapeHtml(app.status || "pending")}">
            <td>${escapeHtml(app.creatorName || app.name || "-")}</td>
            <td>${escapeHtml(app.creatorEmail || app.email || "-")}</td>
            <td>${escapeHtml(app.creatorInstagram || app.instagram || "-")}</td>
            <td>
              <span class="admin-app-status status-${escapeHtml(app.status || "pending")}">
                ${escapeHtml(app.status || "pending")}
              </span>
            </td>
            <td>${formatDate(app.createdAt)}</td>
            <td>
              <div class="admin-app-actions">
                <button class="btn-edit" data-app-action="approved" data-app-id="${app._id}">Approve</button>
                <button class="btn-delete" data-app-action="rejected" data-app-id="${app._id}">Reject</button>
              </div>
            </td>
          </tr>
        `
          )
          .join("")
      : `<tr><td colspan="6" class="admin-campaign-empty-cell">No applicants yet.</td></tr>`;

    campaignDetailPanel.innerHTML = `
      <div class="admin-campaign-detail-head">
        <h3>${escapeHtml(campaign.title || "Campaign details")}</h3>
        <button type="button" class="btn btn-sm" id="close-campaign-detail">Close</button>
      </div>

      <div class="admin-campaign-detail-grid">
        <div class="admin-campaign-detail-item"><span>Brand</span><strong>${escapeHtml(campaign.brand || "-")}</strong></div>
        <div class="admin-campaign-detail-item"><span>Category</span><strong>${escapeHtml(campaign.category || "-")}</strong></div>
        <div class="admin-campaign-detail-item"><span>Budget</span><strong>${escapeHtml(formatMoney(campaign.budget))}</strong></div>
        <div class="admin-campaign-detail-item"><span>Spots</span><strong>${escapeHtml(String(campaign.spots || "TBD"))}</strong></div>
        <div class="admin-campaign-detail-item"><span>Deadline</span><strong>${escapeHtml(campaign.deadline || "TBD")}</strong></div>
        <div class="admin-campaign-detail-item"><span>Status</span><strong>${campaign.isActive ? "Active" : "Inactive"}</strong></div>
      </div>

      <div class="admin-campaign-detail-description">
        <h4>Description</h4>
        <p>${escapeHtml(campaign.description || "-")}</p>
      </div>

      <div class="admin-campaign-applicants">
        <div class="admin-campaign-applicants-head">
          <h4>Applicants</h4>
          <div class="admin-app-filter" role="group" aria-label="Filter applicants by status">
            <button type="button" class="admin-app-filter-btn is-active" data-app-filter="all">All</button>
            <button type="button" class="admin-app-filter-btn" data-app-filter="pending">Pending</button>
            <button type="button" class="admin-app-filter-btn" data-app-filter="approved">Approved</button>
            <button type="button" class="admin-app-filter-btn" data-app-filter="rejected">Rejected</button>
          </div>
        </div>
        <div class="admin-campaign-applicants-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Instagram</th>
                <th>Status</th>
                <th>Applied Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${applicantsMarkup}</tbody>
          </table>
        </div>
      </div>
    `;

    campaignDetailPanel.style.display = "block";
    campaignDetailPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    const closeBtn = document.getElementById("close-campaign-detail");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        campaignDetailPanel.style.display = "none";
      });
    }

    const filterButtons = Array.from(
      campaignDetailPanel.querySelectorAll("[data-app-filter]")
    );
    const applicantRows = Array.from(
      campaignDetailPanel.querySelectorAll("tbody tr[data-app-status]")
    );

    function applyApplicantFilter(filter) {
      applicantRows.forEach((row) => {
        const rowStatus = row.getAttribute("data-app-status") || "pending";
        row.style.display = filter === "all" || rowStatus === filter ? "" : "none";
      });

      filterButtons.forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.appFilter === filter);
      });
    }

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        applyApplicantFilter(btn.dataset.appFilter || "all");
      });
    });

    const actionButtons = Array.from(
      campaignDetailPanel.querySelectorAll("[data-app-action][data-app-id]")
    );
    actionButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const nextStatus = btn.dataset.appAction;
        const appId = btn.dataset.appId;
        await updateApplicationStatus(appId, nextStatus, campaign);
      });
    });

    applyApplicantFilter("all");
  }

  async function updateApplicationStatus(applicationId, status, campaign) {
    if (!applicationId || !status) return;

    const statusLabel =
      status === "approved" ? "Approve" : status === "rejected" ? "Reject" : "Set Pending";
    const shouldContinue = confirm(`Confirm ${statusLabel} this applicant?`);
    if (!shouldContinue) return;

    try {
      const response = await fetch("/.netlify/functions/applications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ applicationId, status }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        alert(data.error || "Failed to update applicant status");
        return;
      }

      const note = data.emailSent ? "Email sent to applicant." : "Status updated. Email not sent.";
      alert(`Applicant status updated to ${status}. ${note}`);
      await renderCampaignDetailPanel(campaign);
      await loadCampaigns();
    } catch (error) {
      console.error("Error updating applicant status:", error);
      alert("Failed to update applicant status.");
    }
  }

  async function loadApplications() {
    try {
      const response = await fetch("/.netlify/functions/applications", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load applications");
      }
      const applications = await response.json();

      const tbody = document.getElementById("applications-tbody");
      tbody.innerHTML = applications
        .map(
          (app) => `
        <tr>
          <td>${app.creatorName || app.name || "-"}</td>
          <td>${app.creatorEmail || app.email || "-"}</td>
          <td>${app.campaignTitle || app.brandName || app.campaignId || "-"}</td>
          <td>${app.status}</td>
          <td>${new Date(app.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="btn-view" onclick="viewApplication('${app._id}')">View</button>
          </td>
        </tr>
      `
        )
        .join("");
    } catch (error) {
      console.error("Error loading applications:", error);
    }
  }

  function loadProfile() {
    if (currentUser) {
      document.getElementById("profile-email").textContent = currentUser.email;
      document.getElementById("profile-role").textContent = currentUser.role;
    }
  }

  // Campaign modal
  const modal = document.getElementById("campaign-modal");
  const closeBtn = document.querySelector(".close");
  const newCampaignBtn = document.getElementById("new-campaign-btn");
  const campaignForm = document.getElementById("campaign-form");

  // Image file upload elements
  const imageFileInput = document.getElementById("campaign-image-file");
  const imageUrlInput = document.getElementById("campaign-image");
  const imagePreview = document.getElementById("campaign-image-preview");
  const imagePreviewImg = document.getElementById("campaign-image-preview-img");
  const imageClearBtn = document.getElementById("campaign-image-clear");

  // Helper: read file as base64
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); // "data:image/xxx;base64,..."
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Show preview when file is selected
  if (imageFileInput) {
    imageFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) {
        imagePreview.style.display = "none";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File too large. Max 5MB");
        imageFileInput.value = "";
        return;
      }
      const dataUrl = await readFileAsBase64(file);
      imagePreviewImg.src = dataUrl;
      imagePreview.style.display = "block";
    });
  }

  // Clear file selection
  if (imageClearBtn) {
    imageClearBtn.addEventListener("click", () => {
      imageFileInput.value = "";
      imagePreviewImg.src = "";
      imagePreview.style.display = "none";
    });
  }

  // Target Audience dynamic rows
  const audienceContainer = document.getElementById("target-audience-list");
  const addAudienceRowBtn = document.getElementById("add-audience-row");

  function createAudienceRow(label = "", value = "") {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.marginBottom = "8px";
    row.style.alignItems = "center";

    row.innerHTML = `
      <input type="text" placeholder="Label (e.g., Nationality)" value="${label}" style="flex: 0.4; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" class="audience-label" />
      <input type="text" placeholder="Value (e.g., United States)" value="${value}" style="flex: 1; padding: 6px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;" class="audience-value" />
      <button type="button" class="audience-remove" style="background: #ff6b6b; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">
        Remove
      </button>
    `;

    const removeBtn = row.querySelector(".audience-remove");
    removeBtn.addEventListener("click", () => row.remove());

    return row;
  }

  if (addAudienceRowBtn) {
    addAudienceRowBtn.addEventListener("click", (e) => {
      e.preventDefault();
      audienceContainer.appendChild(createAudienceRow());
    });
  }

  // Reset form helper
  function resetCampaignForm() {
    campaignForm.reset();
    document.getElementById("campaign-id").value = "";
    if (imageFileInput) imageFileInput.value = "";
    if (imagePreview) imagePreview.style.display = "none";
    if (imagePreviewImg) imagePreviewImg.src = "";
    // Reset target audience rows
    audienceContainer.innerHTML = "";
  }

  newCampaignBtn.addEventListener("click", () => {
    document.getElementById("modal-title").textContent = "New Campaign";
    resetCampaignForm();
    modal.style.display = "block";
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Save campaign
  campaignForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = campaignForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;

    try {
      // Step 1: If a file is selected, upload it first
      let imageUrl = imageUrlInput.value.trim();
      const file = imageFileInput?.files[0];

      if (file) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading image...";

        const dataUrl = await readFileAsBase64(file);
        const uploadRes = await fetch("/.netlify/functions/upload-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            file: dataUrl,
            filename: file.name,
            contentType: file.type,
          }),
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Image upload failed");
        }
        imageUrl = uploadData.imageUrl;
      }

      // Step 2: Save campaign with image URL
      submitBtn.textContent = "Saving campaign...";

      const campaignId = document.getElementById("campaign-id").value;

      // Parse guidelines (split by newlines)
      const guidelinesText = document.getElementById("campaign-guidelines").value || "";
      const guidelines = guidelinesText
        .split("\n")
        .map((g) => g.trim())
        .filter((g) => g.length > 0);

      // Parse target audience rows
      const targetAudience = Array.from(
        audienceContainer.querySelectorAll("div")
      ).map((row) => ({
        label: row.querySelector(".audience-label").value,
        value: row.querySelector(".audience-value").value,
      }));

      const campaignData = {
        title: document.getElementById("campaign-title").value,
        brand: document.getElementById("campaign-brand").value,
        category: document.getElementById("campaign-category").value,
        description: document.getElementById("campaign-description").value,
        imageUrl: imageUrl,
        budget: document.getElementById("campaign-budget").value,
        spots: parseInt(document.getElementById("campaign-spots").value) || 0,
        deadline: document.getElementById("campaign-deadline").value,
        isActive: document.getElementById("campaign-active").checked,
        guidelines,
        targetAudience,
      };

      const url = campaignId
        ? `/.netlify/functions/admin-campaigns/${campaignId}`
        : "/.netlify/functions/admin-campaigns";
      const method = campaignId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(campaignData),
      });

      if (response.ok) {
        modal.style.display = "none";
        loadCampaigns();
        alert("Campaign saved successfully!");
      } else {
        const err = await response.json().catch(() => ({}));
        alert("Failed to save campaign: " + (err.error || response.statusText));
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
      alert("Error saving campaign: " + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });

  // Global functions for edit/delete
  window.editCampaign = async (id) => {
    try {
      const response = await fetch(`/.netlify/functions/admin-campaigns/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const campaign = await response.json();

      document.getElementById("modal-title").textContent = "Edit Campaign";
      document.getElementById("campaign-id").value = campaign._id;
      document.getElementById("campaign-title").value = campaign.title;
      document.getElementById("campaign-brand").value = campaign.brand;
      document.getElementById("campaign-category").value = campaign.category;
      document.getElementById("campaign-description").value = campaign.description;
      document.getElementById("campaign-image").value = campaign.imageUrl || "";
      document.getElementById("campaign-budget").value = campaign.budget || "";
      document.getElementById("campaign-spots").value = campaign.spots || "";
      document.getElementById("campaign-deadline").value = campaign.deadline || "";
      document.getElementById("campaign-active").checked = campaign.isActive;
      // Populate guidelines
      const guidelinesText = (campaign.guidelines || []).join("\n");
      document.getElementById("campaign-guidelines").value = guidelinesText;

      // Populate target audience
      audienceContainer.innerHTML = "";
      if (campaign.targetAudience && campaign.targetAudience.length > 0) {
        campaign.targetAudience.forEach((audience) => {
          audienceContainer.appendChild(
            createAudienceRow(audience.label, audience.value)
          );
        });
      }
      // Reset file input and show existing image as preview
      if (imageFileInput) imageFileInput.value = "";
      if (campaign.imageUrl && imagePreview && imagePreviewImg) {
        imagePreviewImg.src = campaign.imageUrl;
        imagePreview.style.display = "block";
      } else if (imagePreview) {
        imagePreview.style.display = "none";
      }

      modal.style.display = "block";
    } catch (error) {
      console.error("Error loading campaign:", error);
      alert("Failed to load campaign");
    }
  };

  window.deleteCampaign = async (id) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const response = await fetch(`/.netlify/functions/admin-campaigns/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        loadCampaigns();
        alert("Campaign deleted successfully!");
      } else {
        alert("Failed to delete campaign");
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert("Error deleting campaign");
    }
  };

  window.viewCampaignDetails = async (id) => {
    const existing = campaignsCache.find((c) => String(c._id) === String(id));
    if (existing) {
      await renderCampaignDetailPanel(existing);
      return;
    }

    try {
      const response = await fetch(`/.netlify/functions/admin-campaigns/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error("Failed to load campaign detail");
      const campaign = await response.json();
      await renderCampaignDetailPanel(campaign);
    } catch (error) {
      console.error("Error loading campaign detail:", error);
      alert("Failed to load campaign detail");
    }
  };

  window.viewApplication = (id) => {
    alert("Application details: " + id);
  };

  // =========================
  // USERS MANAGEMENT
  // =========================
  const usersTbody = document.getElementById("users-tbody");
  const usersSearchInput = document.getElementById("users-search");
  const userModal = document.getElementById("user-modal");
  const userModalClose = document.getElementById("user-modal-close");
  const userDetailBody = document.getElementById("user-detail-body");
  const userToggleActiveBtn = document.getElementById("user-toggle-active");
  const userDeleteBtn = document.getElementById("user-delete");

  let allUsersCache = [];
  let currentUserDetail = null;

  function escapeHtml(v) {
    if (v == null) return "";
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(iso) {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleDateString();
    } catch (_) {
      return "-";
    }
  }

  function renderUsersTable(list) {
    if (!usersTbody) return;
    if (!list.length) {
      usersTbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:24px; color:#888;">No users found.</td></tr>`;
      return;
    }
    usersTbody.innerHTML = list
      .map((u) => {
        const name = u.profile?.fullName || u.name || "-";
        const ig = u.socials?.instagram || "-";
        const nat = u.profile?.nationality || "-";
        const provider = u.authProvider || "email";
        const role = u.role || "creator";
        const active = u.isActive !== false;
        return `
          <tr>
            <td>${escapeHtml(u.username || "-")}</td>
            <td>${escapeHtml(name)}</td>
            <td>${escapeHtml(u.email)}</td>
            <td>${escapeHtml(ig)}</td>
            <td>${escapeHtml(nat)}</td>
            <td>${escapeHtml(provider)}</td>
            <td>${escapeHtml(role)}</td>
            <td><span style="color:${active ? "#2b8a3e" : "#c92a2a"};">${active ? "Active" : "Suspended"}</span></td>
            <td>${formatDate(u.createdAt)}</td>
            <td>
              <button class="btn-edit" onclick="viewUser('${u._id}')">View</button>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  async function loadUsers() {
    if (!usersTbody) return;
    usersTbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:24px;">Loading…</td></tr>`;
    try {
      const res = await fetch("/.netlify/functions/admin-users", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        usersTbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:24px; color:#c92a2a;">${escapeHtml(err.error || "Failed to load users")}</td></tr>`;
        return;
      }
      allUsersCache = await res.json();
      renderUsersTable(allUsersCache);
    } catch (error) {
      console.error("Error loading users:", error);
      usersTbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:24px; color:#c92a2a;">Error loading users</td></tr>`;
    }
  }

  if (usersSearchInput) {
    usersSearchInput.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        renderUsersTable(allUsersCache);
        return;
      }
      const filtered = allUsersCache.filter((u) => {
        const hay = [
          u.username,
          u.email,
          u.profile?.fullName,
          u.name,
          u.socials?.instagram,
          u.socials?.tiktok,
          u.socials?.youtube,
          u.profile?.nationality,
          u.profile?.residence,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
      renderUsersTable(filtered);
    });
  }

  function renderUserDetail(u) {
    const p = u.profile || {};
    const s = u.socials || {};
    const c = u.contact || {};
    const rows = [
      ["Username", u.username],
      ["Email", u.email],
      ["Full Name", p.fullName || u.name],
      ["Gender", p.gender],
      ["Nationality", p.nationality],
      ["Second Nationality", p.secondNationality],
      ["Residence", p.residence],
      ["Date of Birth", p.dob],
      ["Phone", c.phone ? `${c.countryCode || ""} ${c.phone}` : null],
      ["Instagram", s.instagram],
      ["TikTok", s.tiktok],
      ["YouTube", s.youtube],
      ["Portfolio", p.portfolioUrl],
      ["Bio", p.bio],
      ["Content Categories", (u.contentCategories || []).join(", ")],
      ["Inviter", u.inviterUsername ? "@" + u.inviterUsername : null],
      ["Auth Provider", u.authProvider || "email"],
      ["Role", u.role || "creator"],
      ["Status", u.isActive === false ? "Suspended" : "Active"],
      ["Marketing Opt-in", u.marketingOptIn ? "Yes" : "No"],
      ["Created", formatDate(u.createdAt)],
      ["Updated", formatDate(u.updatedAt)],
    ];
    const html = rows
      .filter(([, v]) => v !== null && v !== undefined && v !== "")
      .map(
        ([k, v]) => `
          <div style="display:grid; grid-template-columns: 160px 1fr; gap:12px; padding:6px 0; border-bottom: 1px solid #f0f0f0;">
            <div style="color:#666; font-size:13px;">${escapeHtml(k)}</div>
            <div style="font-size:14px;">${escapeHtml(v)}</div>
          </div>
        `
      )
      .join("");
    userDetailBody.innerHTML = html || "<em>No details available.</em>";
  }

  window.viewUser = async (id) => {
    if (!userModal) return;
    userDetailBody.innerHTML = "Loading…";
    userModal.style.display = "block";
    try {
      const res = await fetch(`/.netlify/functions/admin-users/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        userDetailBody.innerHTML = `<div style="color:#c92a2a;">${escapeHtml(err.error || "Failed to load user")}</div>`;
        return;
      }
      currentUserDetail = await res.json();
      renderUserDetail(currentUserDetail);
      if (userToggleActiveBtn) {
        userToggleActiveBtn.textContent =
          currentUserDetail.isActive === false ? "Reactivate User" : "Suspend User";
      }
    } catch (error) {
      console.error("Error loading user:", error);
      userDetailBody.innerHTML = `<div style="color:#c92a2a;">Error loading user</div>`;
    }
  };

  if (userModalClose) {
    userModalClose.addEventListener("click", () => {
      userModal.style.display = "none";
      currentUserDetail = null;
    });
  }
  if (userModal) {
    window.addEventListener("click", (e) => {
      if (e.target === userModal) {
        userModal.style.display = "none";
        currentUserDetail = null;
      }
    });
  }

  if (userToggleActiveBtn) {
    userToggleActiveBtn.addEventListener("click", async () => {
      if (!currentUserDetail) return;
      const nextActive = !(currentUserDetail.isActive !== false);
      try {
        const res = await fetch(
          `/.netlify/functions/admin-users/${currentUserDetail._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ isActive: nextActive }),
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "Failed to update user");
          return;
        }
        currentUserDetail.isActive = nextActive;
        renderUserDetail(currentUserDetail);
        userToggleActiveBtn.textContent = nextActive ? "Suspend User" : "Reactivate User";
        loadUsers();
      } catch (error) {
        console.error("Toggle active error:", error);
        alert("Failed to update user");
      }
    });
  }

  if (userDeleteBtn) {
    userDeleteBtn.addEventListener("click", async () => {
      if (!currentUserDetail) return;
      if (!confirm(`Delete user @${currentUserDetail.username || currentUserDetail.email}? This cannot be undone.`)) return;
      try {
        const res = await fetch(
          `/.netlify/functions/admin-users/${currentUserDetail._id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "Failed to delete user");
          return;
        }
        userModal.style.display = "none";
        currentUserDetail = null;
        loadUsers();
      } catch (error) {
        console.error("Delete user error:", error);
        alert("Failed to delete user");
      }
    });
  }

  // Initial check
  checkAuth();
});
