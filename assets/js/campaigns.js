// campaigns.js - Campaigns listing page
document.addEventListener("DOMContentLoaded", async () => {
  const campaignsList = document.getElementById("campaigns-list");
  const searchFilter = document.getElementById("search-filter");
  const heroBadge = document.getElementById("campaign-hero-badge");
  const totalLabel = document.getElementById("campaign-total");
  const emptyState = document.getElementById("campaign-empty");
  const emptyTitle = document.getElementById("campaign-empty-title");
  const emptyBody = document.getElementById("campaign-empty-body");
  const resetButton = document.getElementById("campaign-reset");
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

  // Local preview only: static file servers have no /api, so fall back to sample data.
  const isLocalPreview = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const SAMPLE_CAMPAIGNS = [
    { _id: "s1", brand: "Juno Hair", category: "Beauty & Care", title: "Seoul Hair Makeover Experience", description: "Visit Juno Hair Gangnam for a full styling session and share your transformation with your audience.", imageUrl: "assets/banner/juno.png", budget: "150000", deadline: "2026-10-05", spots: 10, applicantCount: 6 },
    { _id: "s2", brand: "LA BAB", category: "Dining", title: "Korean Rice Bowl Tasting Reel", description: "Try LA BAB's signature bowls in Hongdae and film a short-form review for your followers.", imageUrl: "assets/banner/labab.png", budget: "80000", deadline: "2026-09-28", spots: 15, applicantCount: 4 },
    { _id: "s3", brand: "TONYMOLY", category: "Product", title: "K-Beauty Skincare Unboxing", description: "Receive a curated TONYMOLY skincare set and create an honest first-impression video.", imageUrl: "assets/banner/tonymoly.png", budget: "120000", deadline: "2026-10-12", spots: 30, applicantCount: 21 },
    { _id: "s4", brand: "Jaimdang", category: "Life Service", title: "Korean Medicine Wellness Visit", description: "Experience a traditional wellness consultation at Jaimdang clinic and document your visit.", imageUrl: "assets/banner/jaimdang.png", budget: "100000", deadline: "2026-10-20", spots: 8, applicantCount: 5 },
    { _id: "s5", brand: "Myeongdong K-Galbi", category: "Dining", title: "Late-Night Galbi Mukbang", description: "Film a mukbang-style dinner at Myeongdong K-Galbi and highlight the tabletop grilling experience.", imageUrl: "assets/banner/mkd.png", budget: "90000", deadline: "2026-09-30", spots: 12, applicantCount: 9 },
    { _id: "s6", brand: "Park Jun Beauty Lab", category: "Beauty & Care", title: "Scalp Care & Perm Session", description: "Get a professional perm and scalp treatment, then share before-and-after content.", imageUrl: "assets/banner/parkjun.png", budget: "130000", deadline: "2026-10-08", spots: 6, applicantCount: 2 },
    { _id: "s7", brand: "Berry Stay", category: "Stay & Travel", title: "Hanok Weekend Getaway", description: "Stay two nights in a traditional hanok in Bukchon and capture the neighborhood at golden hour.", imageUrl: "assets/banner/berry.png", budget: "200000", deadline: "2026-11-02", spots: 4, applicantCount: 1 },
    { _id: "s8", brand: "Seoul Kimbap Class", category: "Class & Activity", title: "Hands-On Kimbap Workshop", description: "Join a 2-hour kimbap making class in Seongsu and vlog the process from start to finish.", imageUrl: "assets/img/content-05.jpeg", budget: "60000", deadline: "2026-10-15", spots: 20, applicantCount: 11 },
    { _id: "s9", brand: "ADM Studio", category: "Casting", title: "Global Creator Casting Call", description: "Open casting for a K-brand commercial shoot; we're looking for creators from 5+ countries.", imageUrl: "assets/banner/adm.png", budget: "300000", deadline: "2026-10-25", spots: 5, applicantCount: 5 },
  ];

  async function loadCampaigns() {
    try {
      const response = await fetch("/api/campaigns");
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
      if (isLocalPreview) {
        allCampaigns = SAMPLE_CAMPAIGNS;
        updateHeroBadge();
        updateCategoryCounts();
        renderCampaigns();
        return;
      }
      campaignsList.innerHTML =
        '<p class="campaign-empty">Failed to load campaigns. Please try again.</p>';
    }
  }

  function showEmptyState(searchValue) {
    if (!emptyState) {
      campaignsList.innerHTML = '<p class="cp-empty show">No campaigns found.</p>';
      return;
    }
    const activeLabel = (categoryButtons.find((b) => b.dataset.categoryFilter === activeCategory) || {}).textContent || activeCategory;
    if (searchValue) {
      emptyTitle.textContent = `\u201c${searchValue}\u201d 검색 결과가 없어요`;
      emptyBody.textContent = "철자를 확인하거나 다른 키워드로 검색해 보세요.";
    } else if (activeCategory !== "all") {
      emptyTitle.textContent = `${activeLabel.replace(/\s*\d+\s*$/, "").trim()} 카테고리에 등록된 캠페인이 없어요`;
      emptyBody.textContent = "다른 카테고리를 둘러보거나 브랜드 캠페인을 먼저 제안해 보세요.";
    } else {
      emptyTitle.textContent = "아직 등록된 캠페인이 없어요";
      emptyBody.textContent = "새로운 캠페인이 곧 열립니다. 브랜드 캠페인을 먼저 제안해 보세요.";
    }
    emptyState.classList.add("show");
  }

  function renderCampaigns() {
    const campaigns = getFilteredCampaigns();
    const searchValue = searchFilter ? searchFilter.value.trim() : "";

    if (totalLabel) {
      totalLabel.textContent = `${campaigns.length} campaigns`;
    }
    if (emptyState) emptyState.classList.remove("show");

    if (!campaigns.length) {
      campaignsList.innerHTML = "";
      showEmptyState(searchValue);
      return;
    }

    campaignsList.innerHTML = campaigns
      .map((campaign) => {
        const spotsLeft = getSpotsLeft(campaign);
        const isOpen = typeof spotsLeft !== "number" || spotsLeft > 0;
        const isUrgent = typeof spotsLeft === "number" && spotsLeft > 0 && spotsLeft <= 5;
        const campaignTitle = escapeHtml(campaign.title || "Untitled campaign");
        const campaignBrand = escapeHtml(campaign.brand || "Unknown brand");
        const campaignCategory = escapeHtml(campaign.category || "Campaign");
        const campaignImage = escapeHtml(campaign.imageUrl || "assets/img/content-04.jpeg");
        const rawDescription = String(campaign.description || "");
        const shortDescription = escapeHtml(rawDescription.slice(0, 90));
        const hasMoreDescription = rawDescription.length > 90;
        const deadlineText = formatDeadline(campaign.deadline);
        const detailsHref = `campaign-detail.html?id=${encodeURIComponent(String(campaign._id || ""))}`;
        const spotsText = typeof spotsLeft === "number" ? `${spotsLeft} spots left` : "Spots TBD";

        return `
          <a class="cp-card" href="${detailsHref}">
            <div class="cp-thumb">
              <img src="${campaignImage}" alt="${campaignTitle}" loading="lazy" />
              <span class="badge${isOpen ? " live" : ""}">${isOpen ? "모집 중" : "마감"}</span>
            </div>
            <div class="cp-body">
              <span class="cp-tag">${campaignCategory}</span>
              <h3>${campaignTitle}</h3>
              <span class="brand">${campaignBrand}</span>
              <p class="desc">${shortDescription}${hasMoreDescription ? "..." : ""}</p>
              <div class="cp-meta">
                <span>리워드 <b>₩${escapeHtml(formatMoney(campaign.budget))}</b></span>
                <span>~${deadlineText}</span>
              </div>
              <div class="cp-meta" style="border-top:0;padding-top:6px">
                <span class="spots${isUrgent ? " urgent" : ""}">${spotsText}</span>
                <b>See details →</b>
              </div>
            </div>
          </a>
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

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (searchFilter) searchFilter.value = "";
      setActiveCategory("all");
    });
  }

  await loadCampaigns();
});
