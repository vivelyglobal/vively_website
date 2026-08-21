// campaigns.js - Campaigns listing page
document.addEventListener("DOMContentLoaded", async () => {
  const campaignsList = document.getElementById("campaigns-list");
  const searchFilter = document.getElementById("search-filter");
  const heroBadge = document.getElementById("campaign-hero-badge");
  const categoryButtons = Array.from(
    document.querySelectorAll("[data-category-filter]")
  );

  let allCampaigns = [];
  let activeCategory = "all";

  if (!campaignsList) {
    return;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeCategory(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s*&\s*/g, " and ")
      .replace(/\s+/g, " ");
  }

  function formatDeadline(value) {
    if (!value) return "TBD";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return escapeHtml(value);
    }

    return parsed.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatMoney(value) {
    const numericValue = Number(String(value || "").replace(/[^\d]/g, ""));

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return value || "TBD";
    }

    return numericValue.toLocaleString("en-US");
  }

  function getSpotsLeft(campaign) {
    const totalSpots = Number(campaign.spots) || 0;
    const applicantCount = Number(campaign.applicantCount) || 0;

    if (!totalSpots) {
      return "TBD";
    }

    return Math.max(totalSpots - applicantCount, 0);
  }

  function getFilteredCampaigns() {
    const searchValue = searchFilter ? searchFilter.value.trim().toLowerCase() : "";

    return allCampaigns.filter((campaign) => {
      const matchesCategory =
        activeCategory === "all" ||
        normalizeCategory(campaign.category) === normalizeCategory(activeCategory);
      const searchableText = [
        campaign.title,
        campaign.brand,
        campaign.category,
        campaign.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !searchValue || searchableText.includes(searchValue);

      return matchesCategory && matchesSearch;
    });
  }

  function updateHeroBadge() {
    if (!heroBadge) return;

    heroBadge.textContent = `${allCampaigns.length} live campaigns`;
  }

  function updateCategoryCounts() {
    const counts = allCampaigns.reduce(
      (accumulator, campaign) => {
        accumulator.all += 1;
        if (campaign.category) {
          const key = normalizeCategory(campaign.category);
          accumulator[key] = (accumulator[key] || 0) + 1;
        }
        return accumulator;
      },
      { all: 0 }
    );

    categoryButtons.forEach((button) => {
      const categoryValue = button.dataset.categoryFilter;
      const countElement = button.querySelector("[data-category-count]");

      if (countElement) {
        const lookupKey = categoryValue === "all" ? "all" : normalizeCategory(categoryValue);
        countElement.textContent = counts[lookupKey] || 0;
      }
    });
  }

  function setActiveCategory(categoryValue) {
    activeCategory = categoryValue;

    categoryButtons.forEach((button) => {
      button.classList.toggle(
        "is-active",
        button.dataset.categoryFilter === activeCategory
      );
    });

    renderCampaigns();
  }

  async function loadCampaigns() {
    try {
      const response = await fetch("/.netlify/functions/campaigns");
      if (!response.ok) {
        throw new Error(`Failed to fetch campaigns (${response.status})`);
      }
      const campaigns = await response.json();
      allCampaigns = Array.isArray(campaigns) ? campaigns : [];
      updateHeroBadge();
      updateCategoryCounts();
      renderCampaigns();
    } catch (error) {
      console.error("Error loading campaigns:", error);
      campaignsList.innerHTML =
        '<p class="campaign-empty">Failed to load campaigns. Please try again.</p>';
    }
  }

  function renderCampaigns() {
    const campaigns = getFilteredCampaigns();

    if (!campaigns.length) {
      campaignsList.innerHTML =
        '<p class="campaign-empty">No campaigns found.</p>';
      return;
    }

    campaignsList.innerHTML = campaigns
      .map((campaign) => {
        const spotsLeft = getSpotsLeft(campaign);
        const spotsClass =
          typeof spotsLeft === "number" && spotsLeft <= 5 ? " is-urgent" : "";
        const campaignTitle = escapeHtml(campaign.title || "Untitled campaign");
        const campaignBrand = escapeHtml(campaign.brand || "Unknown brand");
        const campaignCategory = escapeHtml(campaign.category || "Campaign");
        const campaignImage = escapeHtml(campaign.imageUrl || "assets/img/content-04.jpeg");
        const rawDescription = String(campaign.description || "");
        const shortDescription = escapeHtml(rawDescription.slice(0, 110));
        const hasMoreDescription = rawDescription.length > 110;
        const deadlineText = formatDeadline(campaign.deadline);
        const detailsHref = `campaign-detail.html?id=${encodeURIComponent(String(campaign._id || ""))}`;

        return `
          <article class="campaign-card">
            <div class="campaign-image">
              <img src="${campaignImage}" alt="${campaignTitle}" loading="lazy" />
              <span class="campaign-category">${campaignCategory}</span>
              <span class="campaign-save" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 3.75h12a.75.75 0 0 1 .75.75v16.5l-6.75-3.75-6.75 3.75V4.5a.75.75 0 0 1 .75-.75Z"></path>
                </svg>
              </span>
            </div>
            <div class="campaign-content">
              <div class="campaign-brand">${campaignBrand}</div>
              <h3>${campaignTitle}</h3>
              <p class="campaign-description">${shortDescription}${hasMoreDescription ? "..." : ""}</p>
              <div class="campaign-meta">
                <div class="campaign-meta-item">
                  <span class="campaign-meta-label">Budget</span>
                  <strong>${escapeHtml(formatMoney(campaign.budget))}</strong>
                </div>
                <div class="campaign-meta-item">
                  <span class="campaign-meta-label">Deadline</span>
                  <strong>${deadlineText}</strong>
                </div>
              </div>
              <div class="campaign-card-footer">
                <span class="campaign-spots${spotsClass}">${spotsLeft} spots left</span>
                <a href="${detailsHref}" class="btn btn-accent btn-sm">See details</a>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveCategory(button.dataset.categoryFilter || "all");
    });
  });

  if (searchFilter) {
    searchFilter.addEventListener("input", renderCampaigns);
  }

  await loadCampaigns();
});
