// campaigns.js - Campaigns listing page
document.addEventListener("DOMContentLoaded", async () => {
  const campaignsList = document.getElementById("campaigns-list");
  const categoryFilter = document.getElementById("category-filter");
  const searchFilter = document.getElementById("search-filter");

  let allCampaigns = [];

  async function loadCampaigns() {
    try {
      const category = categoryFilter.value;
      const search = searchFilter.value;

      let url = "/.netlify/functions/campaigns";
      const params = new URLSearchParams();
      
      if (category && category !== "all") params.append("category", category);
      if (search) params.append("search", search);

      if (params.toString()) {
        url += "?" + params.toString();
      }

      const response = await fetch(url);
      const campaigns = await response.json();
      allCampaigns = campaigns;
      renderCampaigns();
    } catch (error) {
      console.error("Error loading campaigns:", error);
      campaignsList.innerHTML =
        '<p class="error">Failed to load campaigns. Please try again.</p>';
    }
  }

  function renderCampaigns() {
    if (!allCampaigns.length) {
      campaignsList.innerHTML =
        '<p class="no-campaigns">No campaigns found.</p>';
      return;
    }

    campaignsList.innerHTML = allCampaigns
      .map(
        (campaign) => `
      <div class="campaign-card">
        <div class="campaign-image">
          <img src="${campaign.imageUrl || 'assets/img/placeholder.jpg'}" alt="${campaign.title}" />
          <span class="campaign-category">${campaign.category}</span>
        </div>
        <div class="campaign-content">
          <h3>${campaign.title}</h3>
          <p class="campaign-brand">${campaign.brand}</p>
          <p class="campaign-description">${campaign.description.substring(0, 100)}...</p>
          <div class="campaign-meta">
            <span class="campaign-budget">${campaign.budget || 'TBD'}</span>
            <span class="campaign-spots">${campaign.spots || 'TBD'} spots</span>
          </div>
          <a href="campaign-detail.html?id=${campaign._id}" class="btn btn-accent">View Details</a>
        </div>
      </div>
    `
      )
      .join("");
  }

  // Event listeners
  categoryFilter.addEventListener("change", loadCampaigns);
  searchFilter.addEventListener("input", loadCampaigns);

  // Load campaigns on page load
  loadCampaigns();
});
