// admin.js - Admin panel
document.addEventListener("DOMContentLoaded", () => {
  let currentUser = null;
  let authToken = null;
  const loginSection = document.getElementById("login-section");
  const adminSidebar = document.querySelector(".admin-sidebar");
  const adminForm = document.getElementById("admin-login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const userInfo = document.getElementById("user-info");

  // Check if user is logged in
  function checkAuth() {
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");

    if (token && user) {
      authToken = token;
      currentUser = JSON.parse(user);
      loginSection.style.display = "none";
      adminSidebar.style.display = "block";
      updateUserInfo();
      loadDashboard();
    } else {
      loginSection.style.display = "block";
      adminSidebar.style.display = "none";
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
        authToken = data.token;
        currentUser = data.user;

        localStorage.setItem("adminToken", authToken);
        localStorage.setItem("adminUser", JSON.stringify(currentUser));

        loginSection.style.display = "none";
        adminSidebar.style.display = "block";
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
    document.querySelectorAll(".admin-section").forEach((s) => {
      s.classList.remove("active");
    });
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.add("active");
      document.getElementById("section-title").textContent =
        section.querySelector("h2")?.textContent || "Admin";

      if (sectionId === "campaigns") {
        loadCampaigns();
      } else if (sectionId === "applications") {
        loadApplications();
      } else if (sectionId === "profile") {
        loadProfile();
      }
    }
  }

  async function loadDashboard() {
    try {
      const campaignsRes = await fetch("/.netlify/functions/admin-campaigns", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const campaigns = await campaignsRes.json();

      const applicationsRes = await fetch("/.netlify/functions/applications", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const applications = await applicationsRes.json();

      document.getElementById("stat-campaigns").textContent = campaigns.length;
      document.getElementById("stat-applications").textContent =
        applications.length;
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  }

  async function loadCampaigns() {
    try {
      const response = await fetch("/.netlify/functions/admin-campaigns", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const campaigns = await response.json();

      const tbody = document.getElementById("campaigns-tbody");
      tbody.innerHTML = campaigns
        .map(
          (c) => `
        <tr>
          <td>${c.title}</td>
          <td>${c.brand}</td>
          <td>${c.category}</td>
          <td>${c.isActive ? "Active" : "Inactive"}</td>
          <td>${c.applicantCount || 0}</td>
          <td>
            <button class="btn-edit" onclick="editCampaign('${c._id}')">Edit</button>
            <button class="btn-delete" onclick="deleteCampaign('${c._id}')">Delete</button>
          </td>
        </tr>
      `
        )
        .join("");
    } catch (error) {
      console.error("Error loading campaigns:", error);
    }
  }

  async function loadApplications() {
    try {
      const response = await fetch("/.netlify/functions/applications", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const applications = await response.json();

      const tbody = document.getElementById("applications-tbody");
      tbody.innerHTML = applications
        .map(
          (app) => `
        <tr>
          <td>${app.name}</td>
          <td>${app.email}</td>
          <td>${app.campaignId}</td>
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

  newCampaignBtn.addEventListener("click", () => {
    document.getElementById("modal-title").textContent = "New Campaign";
    campaignForm.reset();
    document.getElementById("campaign-id").value = "";
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

    const campaignId = document.getElementById("campaign-id").value;
    const campaignData = {
      title: document.getElementById("campaign-title").value,
      brand: document.getElementById("campaign-brand").value,
      category: document.getElementById("campaign-category").value,
      description: document.getElementById("campaign-description").value,
      budget: document.getElementById("campaign-budget").value,
      spots: parseInt(document.getElementById("campaign-spots").value) || 0,
      deadline: document.getElementById("campaign-deadline").value,
      isActive: document.getElementById("campaign-active").checked,
    };

    try {
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
        alert("Failed to save campaign");
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
      alert("Error saving campaign");
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
      document.getElementById("campaign-budget").value = campaign.budget || "";
      document.getElementById("campaign-spots").value = campaign.spots || "";
      document.getElementById("campaign-deadline").value = campaign.deadline || "";
      document.getElementById("campaign-active").checked = campaign.isActive;

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

  window.viewApplication = (id) => {
    alert("Application details: " + id);
  };

  // Initial check
  checkAuth();
});
