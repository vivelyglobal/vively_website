// campaign-detail.js - Campaign detail page
document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const campaignId = urlParams.get("id");
  const detailContent = document.getElementById("detail-content");
  const applicationForm = document.getElementById("application-form");
  const campaignIdInput = document.getElementById("campaign-id");
  const formSuccess = document.getElementById("form-success");

  if (!campaignId) {
    detailContent.innerHTML =
      '<p class="error">Campaign not found. <a href="campaigns.html">Back to campaigns</a></p>';
    return;
  }

  async function loadCampaignDetail() {
    try {
      const response = await fetch(
        `/.netlify/functions/campaigns?id=${campaignId}`
      );
      if (!response.ok) throw new Error("Campaign not found");

      const campaign = await response.json();
      renderCampaignDetail(campaign);
      campaignIdInput.value = campaign._id;
    } catch (error) {
      console.error("Error loading campaign:", error);
      detailContent.innerHTML =
        '<p class="error">Failed to load campaign. <a href="campaigns.html">Back to campaigns</a></p>';
    }
  }

  function renderCampaignDetail(campaign) {
    detailContent.innerHTML = `
      <div class="campaign-hero-detail">
        <img src="${campaign.imageUrl || 'assets/img/placeholder.jpg'}" alt="${campaign.title}" />
        <div class="campaign-header-overlay">
          <span class="campaign-tag">${campaign.category}</span>
          <h1>${campaign.title}</h1>
          <p>${campaign.brand}</p>
        </div>
      </div>

      <div class="campaign-details-table">
        <div class="detail-row">
          <span class="detail-label">Location</span>
          <span class="detail-value">${campaign.location || 'Seoul'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Experience Type</span>
          <span class="detail-value">${campaign.experienceType || 'TBD'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Content Type</span>
          <span class="detail-value">${campaign.contentType || 'Video/Photos'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Min. Followers</span>
          <span class="detail-value">${campaign.minFollowers || 'No requirement'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Budget Range</span>
          <span class="detail-value">${campaign.budget || 'TBD'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Available Spots</span>
          <span class="detail-value">${campaign.spots || 'TBD'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Application Deadline</span>
          <span class="detail-value">${campaign.deadline || 'No deadline'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Platform</span>
          <span class="detail-value">${campaign.platform || 'Instagram/TikTok'}</span>
        </div>
      </div>

      <div class="campaign-description">
        <h2>About this Campaign</h2>
        <p>${campaign.description}</p>
      </div>

      <div class="campaign-guidelines">
        <h2>Guidelines</h2>
        <ul>
          ${(campaign.guidelines || []).map((g) => `<li>${g}</li>`).join("")}
        </ul>
      </div>

      <div class="campaign-target-audience">
        <h2>Target Audience</h2>
        <ul>
          ${(campaign.targetAudience || []).map((a) => `<li><strong>${a.label}:</strong> ${a.value}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  // Handle application form submission
  applicationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      campaignId: campaignIdInput.value,
      name: document.getElementById("app-name").value,
      email: document.getElementById("app-email").value,
      instagram: document.getElementById("app-instagram").value,
      message: document.getElementById("app-message").value,
    };

    try {
      const response = await fetch("/.netlify/functions/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        applicationForm.style.display = "none";
        formSuccess.style.display = "block";
        formSuccess.scrollIntoView({ behavior: "smooth" });
      } else {
        alert("Failed to submit application. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      alert("Error submitting application. Please try again.");
    }
  });

  loadCampaignDetail();
});
