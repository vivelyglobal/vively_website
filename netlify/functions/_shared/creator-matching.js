// Creator matching for brands: rule-based scoring always runs; when
// ANTHROPIC_API_KEY is set, Claude parses free-text queries into criteria
// and writes the per-creator reasons. Without a key, heuristics + templates.

const MODEL = process.env.ANTHROPIC_MATCH_MODEL || "claude-opus-5";

// Campaign categories (brand side) -> creator content categories (signup).
const CAMPAIGN_TO_CREATOR = {
  casting: ["Entertainment", "Fashion", "Lifestyle"],
  dining: ["Food", "Lifestyle"],
  "beauty & care": ["Beauty", "Fashion", "Lifestyle"],
  product: ["Beauty", "Tech", "Fashion", "Lifestyle"],
  "stay & travel": ["Travel", "Lifestyle"],
  "class & activity": ["Fitness", "Lifestyle", "Entertainment"],
  "life service": ["Lifestyle", "Beauty", "Fitness"],
};
const CREATOR_CATEGORIES = ["Food", "Beauty", "Travel", "Fitness", "Fashion", "Lifestyle", "Tech", "Entertainment"];

const CATEGORY_KEYWORDS = {
  Food: ["food", "dining", "restaurant", "cafe", "mukbang", "makan", "kuliner", "음식", "맛집", "다이닝", "카페", "먹방"],
  Beauty: ["beauty", "skincare", "makeup", "cosmetic", "hair", "salon", "kecantikan", "뷰티", "화장품", "스킨케어", "헤어", "메이크업"],
  Travel: ["travel", "trip", "hotel", "stay", "tour", "wisata", "liburan", "여행", "호텔", "숙소"],
  Fitness: ["fitness", "gym", "workout", "yoga", "pilates", "olahraga", "운동", "헬스", "필라테스", "요가"],
  Fashion: ["fashion", "outfit", "style", "clothing", "ootd", "패션", "옷", "스타일"],
  Lifestyle: ["lifestyle", "daily", "vlog", "life", "라이프", "일상", "브이로그"],
  Tech: ["tech", "gadget", "app", "device", "테크", "가젯", "앱"],
  Entertainment: ["entertainment", "music", "dance", "comedy", "casting", "actor", "model", "엔터", "음악", "댄스", "캐스팅", "모델"],
};

const COUNTRIES = {
  Indonesia: ["indonesia", "indonesian", "인도네시아"],
  "South Korea": ["korea", "korean", "한국", "seoul", "서울", "korea selatan"],
  "United States": ["usa", "american", "united states", "미국", "amerika"],
  Japan: ["japan", "japanese", "일본", "jepang"],
  "United Kingdom": ["uk", "british", "united kingdom", "영국", "inggris"],
  Canada: ["canada", "canadian", "캐나다"],
  Australia: ["australia", "australian", "호주"],
  Vietnam: ["vietnam", "vietnamese", "베트남"],
  Thailand: ["thailand", "thai", "태국"],
  Philippines: ["philippines", "filipino", "필리핀"],
  Malaysia: ["malaysia", "malaysian", "말레이시아"],
  India: ["india", "indian", "인도"],
  China: ["china", "chinese", "중국"],
};

function lower(s) {
  return String(s || "").toLowerCase();
}

function parseFollowerNumber(text) {
  const m = lower(text).replace(/(\d),(?=\d{3}\b)/g, "$1").match(/(\d+(?:[.,]\d+)?)\s*(k|천|m|만|juta|ribu|rb)?/);
  if (!m) return null;
  let n = parseFloat(m[1].replace(",", "."));
  const unit = m[2];
  if (unit === "k" || unit === "천" || unit === "ribu" || unit === "rb") n *= 1000;
  else if (unit === "만") n *= 10000;
  else if (unit === "m" || unit === "juta") n *= 1000000;
  return Math.round(n);
}

// Heuristic query parser (used when no API key, and as a safety net).
function parseQueryHeuristic(query) {
  const q = lower(query);
  const criteria = { categories: [], nationality: null, residence: null, gender: null, ageMin: null, ageMax: null, minFollowers: null, platforms: [], keywords: [] };

  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => q.includes(w))) criteria.categories.push(cat);
  }
  for (const [country, words] of Object.entries(COUNTRIES)) {
    if (words.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`).test(q))) {
      // "living in Seoul/Korea" reads as residence; other countries as nationality
      if (country === "South Korea") criteria.residence = criteria.residence || country;
      else criteria.nationality = criteria.nationality || country;
    }
  }
  if (/\b(female|women|woman|girl|perempuan|wanita|cewek)\b|여성|여자/.test(q)) criteria.gender = "Female";
  else if (/\b(male|men|man|boy|laki|pria|cowok)\b|남성|남자/.test(q)) criteria.gender = "Male";

  const decade = q.match(/(\d)0\s*(대|s\b|-an\b|an\b)/);
  const range = q.match(/(\d{2})\s*[-~–]\s*(\d{2})\s*(세|살|tahun|years?|y\.?o\.?|\b)/);
  if (range) { criteria.ageMin = +range[1]; criteria.ageMax = +range[2]; }
  else if (decade) { criteria.ageMin = +decade[1] * 10; criteria.ageMax = +decade[1] * 10 + 9; }

  const fol = q.match(/(\d+(?:[.,]\d+)?\s*(?:k|천|m|만|juta|ribu|rb)?)\s*\+?\s*(followers?|팔로워|subscribers?|구독자|pengikut)/);
  if (fol) criteria.minFollowers = parseFollowerNumber(fol[1]);

  if (/instagram|ig\b|인스타|reels?|릴스/.test(q)) criteria.platforms.push("instagram");
  if (/tiktok|틱톡/.test(q)) criteria.platforms.push("tiktok");
  if (/youtube|유튜브|shorts/.test(q)) criteria.platforms.push("youtube");

  criteria.keywords = q.split(/[^a-z0-9가-힣]+/).filter((w) => w.length >= 4).slice(0, 12);
  return criteria;
}

function criteriaFromCampaign(campaign) {
  const cats = CAMPAIGN_TO_CREATOR[lower(campaign.category)] || [];
  const fromText = parseQueryHeuristic([campaign.title, campaign.description, campaign.location, campaign.platform].filter(Boolean).join(" "));
  const platforms = [];
  const p = lower(campaign.platform);
  if (p.includes("instagram")) platforms.push("instagram");
  if (p.includes("tiktok")) platforms.push("tiktok");
  if (p.includes("youtube")) platforms.push("youtube");
  return {
    ...fromText,
    categories: [...new Set([...cats, ...fromText.categories])],
    minFollowers: parseFollowerNumber(campaign.minFollowers) || fromText.minFollowers,
    platforms: platforms.length ? platforms : fromText.platforms,
    residence: fromText.residence || "South Korea",
  };
}

function ageOf(dob) {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

function maxFollowers(creator, platforms) {
  const s = creator.stats || {};
  const map = { instagram: s.instagramFollowers, tiktok: s.tiktokFollowers, youtube: s.youtubeSubscribers };
  const keys = platforms && platforms.length ? platforms : Object.keys(map);
  return Math.max(0, ...keys.map((k) => Number(map[k]) || 0));
}

// Returns { score, breakdown } — score 0..100.
function scoreCreator(creator, criteria) {
  const b = {};
  const cats = creator.contentCategories || [];

  if (criteria.categories.length) {
    const hits = criteria.categories.filter((c) => cats.includes(c)).length;
    b.category = Math.round((hits / criteria.categories.length) * 40);
  } else b.category = 20;

  const nat = [creator.profile?.nationality, creator.profile?.secondNationality].filter(Boolean);
  if (criteria.nationality) b.nationality = nat.includes(criteria.nationality) ? 15 : 0;
  else b.nationality = 8;

  if (criteria.residence) b.residence = creator.profile?.residence === criteria.residence ? 10 : 0;
  else b.residence = 5;

  if (criteria.gender) b.gender = creator.profile?.gender === criteria.gender ? 8 : 0;
  else b.gender = 4;

  const age = ageOf(creator.profile?.dob);
  if (criteria.ageMin || criteria.ageMax) {
    const min = criteria.ageMin || 0, max = criteria.ageMax || 200;
    b.age = age != null && age >= min && age <= max ? 8 : age != null && (age >= min - 3 && age <= max + 3) ? 3 : 0;
  } else b.age = 4;

  const followers = maxFollowers(creator, criteria.platforms);
  if (criteria.minFollowers) {
    b.followers = followers >= criteria.minFollowers ? 12 : followers >= criteria.minFollowers * 0.5 ? 5 : 0;
  } else b.followers = followers > 0 ? Math.min(12, Math.round(Math.log10(followers + 1) * 2)) : 3;

  if (criteria.platforms.length) {
    const has = { instagram: !!creator.socials?.instagram, tiktok: !!creator.socials?.tiktok, youtube: !!creator.socials?.youtube };
    b.platform = criteria.platforms.every((p) => has[p]) ? 7 : criteria.platforms.some((p) => has[p]) ? 3 : 0;
  } else b.platform = 4;

  const bio = lower(creator.profile?.bio);
  const kw = criteria.keywords.filter((k) => bio.includes(k)).length;
  b.bio = Math.min(5, kw * 2);

  const score = Math.min(100, Object.values(b).reduce((a, v) => a + v, 0));
  return { score, breakdown: b, age, followers };
}

function fmtFollowers(n) {
  if (!n) return null;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

function templateReasons(creator, criteria, scored) {
  const r = [];
  const cats = (creator.contentCategories || []).filter((c) => criteria.categories.includes(c));
  if (cats.length) r.push(`Creates ${cats.join(" & ").toLowerCase()} content, matching the campaign category.`);
  else if (creator.contentCategories?.length) r.push(`Focuses on ${creator.contentCategories.slice(0, 2).join(" & ").toLowerCase()} content.`);
  const nat = creator.profile?.nationality;
  const res = creator.profile?.residence;
  if (criteria.nationality && scored.breakdown.nationality) r.push(`${nat} creator${res ? ` based in ${res}` : ""} — the audience you're targeting.`);
  else if (nat && res && nat !== res) r.push(`${nat} creator living in ${res}, bridging both audiences.`);
  if (scored.followers) r.push(`${fmtFollowers(scored.followers)} followers${criteria.minFollowers ? (scored.followers >= criteria.minFollowers ? ", above your minimum." : ", below your minimum.") : "."}`);
  if (criteria.ageMin && scored.age != null && scored.breakdown.age === 8) r.push(`Age ${scored.age}, within your target range.`);
  return r.slice(0, 3);
}

function aiAvailable() {
  return !!process.env.ANTHROPIC_API_KEY;
}

function extractJSON(text) {
  const m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

async function claude(system, user, maxTokens) {
  const Anthropic = require("@anthropic-ai/sdk").default;
  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    output_config: { effort: "low" },
    messages: [{ role: "user", content: user }],
  });
  if (response.stop_reason === "refusal") return null;
  return response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
}

async function parseQueryWithAI(query) {
  const heuristic = parseQueryHeuristic(query);
  if (!aiAvailable() || !query) return heuristic;
  try {
    const text = await claude(
      `You convert a brand's free-text search for influencers into JSON criteria. Reply with JSON only, no prose. Schema: {"categories": subset of ${JSON.stringify(CREATOR_CATEGORIES)}, "nationality": country name or null, "residence": country name or null, "gender": "Female"|"Male"|null, "ageMin": int|null, "ageMax": int|null, "minFollowers": int|null, "platforms": subset of ["instagram","tiktok","youtube"], "keywords": up to 8 lowercase words}. Country names must be in English (e.g. "South Korea", "Indonesia"). "Seoul" means residence "South Korea". The query may be Korean, Indonesian or English.`,
      query,
      600
    );
    const parsed = extractJSON(text);
    if (!parsed) return heuristic;
    return {
      categories: Array.isArray(parsed.categories) ? parsed.categories.filter((c) => CREATOR_CATEGORIES.includes(c)) : heuristic.categories,
      nationality: parsed.nationality || null,
      residence: parsed.residence || null,
      gender: ["Female", "Male"].includes(parsed.gender) ? parsed.gender : null,
      ageMin: Number.isFinite(parsed.ageMin) ? parsed.ageMin : null,
      ageMax: Number.isFinite(parsed.ageMax) ? parsed.ageMax : null,
      minFollowers: Number.isFinite(parsed.minFollowers) ? parsed.minFollowers : null,
      platforms: Array.isArray(parsed.platforms) ? parsed.platforms.filter((p) => ["instagram", "tiktok", "youtube"].includes(p)) : [],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(lower).slice(0, 8) : heuristic.keywords,
    };
  } catch (error) {
    console.error("[match] AI parse failed, using heuristic:", error.message);
    return heuristic;
  }
}

// results: [{ creator, scored }] — returns Map(creatorId -> reasons[])
async function explainMatches(query, criteria, results) {
  const fallback = new Map(results.map((r) => [String(r.creator._id), templateReasons(r.creator, criteria, r.scored)]));
  if (!aiAvailable() || !results.length) return fallback;
  try {
    const candidates = results.map((r) => ({
      id: String(r.creator._id),
      categories: r.creator.contentCategories || [],
      nationality: r.creator.profile?.nationality || null,
      residence: r.creator.profile?.residence || null,
      gender: r.creator.profile?.gender || null,
      age: r.scored.age,
      followers: r.scored.followers || null,
      bio: String(r.creator.profile?.bio || "").slice(0, 200),
      score: r.scored.score,
    }));
    const text = await claude(
      `You write short, specific reasons why each influencer fits a brand's campaign search. Reply with JSON only: {"reasons": {"<id>": ["reason 1", "reason 2"]}}. 1-3 reasons per creator, each under 18 words, in the same language as the search query (default English). Never invent facts not in the data. Do not mention the numeric score.`,
      JSON.stringify({ query, criteria, candidates }),
      3000
    );
    const parsed = extractJSON(text);
    if (!parsed || !parsed.reasons) return fallback;
    for (const [id, reasons] of Object.entries(parsed.reasons)) {
      if (fallback.has(id) && Array.isArray(reasons) && reasons.length) fallback.set(id, reasons.map(String).slice(0, 3));
    }
    return fallback;
  } catch (error) {
    console.error("[match] AI explain failed, using templates:", error.message);
    return fallback;
  }
}

module.exports = {
  CREATOR_CATEGORIES,
  parseQueryHeuristic,
  parseQueryWithAI,
  criteriaFromCampaign,
  scoreCreator,
  explainMatches,
  aiAvailable,
  fmtFollowers,
};
