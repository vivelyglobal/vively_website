// Admin: AI-generate a single campaign form field from the rest of the form.
const { verifyRequest } = require("./auth");

const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const FIELD_SPECS = {
  description:
    'a campaign description for creators: what the campaign/brand is, what creators receive, and what they are expected to do. 80-160 words, 2-3 short paragraphs, plain text, no markdown. Schema: {"value": string}',
  guidelines:
    'creator guidelines for this campaign: 4-7 short, concrete, imperative rules. Schema: {"value": string[]}',
  targetAudience:
    'target creator audience criteria: 2-5 rows such as Nationality, Age, Gender, Platform, Followers, Location, Interests. Schema: {"value": [{"label": string, "value": string}]}',
  budget:
    'a realistic budget range or compensation summary for each creator, in KRW (e.g. "₩100,000 - ₩300,000" or "Free experience + ₩50,000"). Schema: {"value": string}',
  spots:
    'a realistic number of creator spots for this campaign. Schema: {"value": integer between 1 and 200}',
};

function str(v, max) {
  return typeof v === "string" ? v.slice(0, max) : "";
}

function cleanForm(form) {
  const f = form && typeof form === "object" ? form : {};
  const audience = Array.isArray(f.targetAudience) ? f.targetAudience.slice(0, 10) : [];
  return {
    title: str(f.title, 200),
    brand: str(f.brand, 200),
    category: str(f.category, 100),
    description: str(f.description, 3000),
    guidelines: str(f.guidelines, 2000),
    targetAudience: audience
      .map((r) => ({ label: str(r && r.label, 100), value: str(r && r.value, 200) }))
      .filter((r) => r.label || r.value),
    budget: str(f.budget, 200),
    spots: str(String(f.spots ?? ""), 10),
    deadline: str(f.deadline, 20),
  };
}

function normalize(field, value) {
  if (field === "guidelines") {
    if (!Array.isArray(value)) return null;
    return value.filter((g) => typeof g === "string" && g.trim()).map((g) => g.trim()).slice(0, 10);
  }
  if (field === "targetAudience") {
    if (!Array.isArray(value)) return null;
    return value
      .filter((r) => r && typeof r.label === "string" && typeof r.value === "string")
      .map((r) => ({ label: r.label.trim().slice(0, 100), value: r.value.trim().slice(0, 200) }))
      .slice(0, 8);
  }
  if (field === "spots") {
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? Math.min(Math.max(n, 1), 200) : null;
  }
  return typeof value === "string" ? value.trim() : null;
}

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const auth = verifyRequest(event);
  if (auth.error) return json(auth.status, { error: auth.error });
  if (auth.user.role !== "admin" && auth.user.role !== "super_admin") {
    return json(403, { error: "Admin access required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return json(503, { error: "AI is not configured (GEMINI_API_KEY missing)." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const field = body.field;
  if (typeof field !== "string" || !FIELD_SPECS[field]) {
    return json(400, { error: "Invalid field" });
  }

  const form = cleanForm(body.form);
  if (!form.title && !form.brand && !form.category && !form.description) {
    return json(400, { error: "Fill in Title, Brand or Category first." });
  }

  const system =
    "You help the Vively admin team write campaign listings for a creator marketplace in Korea, where creators (often foreigners living in Korea) apply to brand campaigns. " +
    `Generate ONLY the "${field}" field: ${FIELD_SPECS[field]}. ` +
    "Use the other form fields as context. If the target field already has text, treat it as the admin's draft or notes: keep its intent and facts, and improve or complete it. " +
    "Never invent specific facts (prices, addresses, dates) that contradict the form. " +
    "Write in the same language the admin used in the form (title/description/draft); if unclear, use English. " +
    "Reply with a single JSON object matching the schema, no prose, no code fences.";

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: `Campaign form:\n${JSON.stringify(form, null, 2)}` }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 4096, temperature: 0.7 },
        }),
      }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[campaign-ai] Gemini error ${res.status}:`, JSON.stringify(data.error || data).slice(0, 300));
      if (res.status === 429) return json(429, { error: "AI free quota reached. Try again in a minute." });
      return json(502, { error: "AI generation failed. Try again." });
    }
    if (data.promptFeedback?.blockReason) return json(422, { error: "AI declined to generate this field." });

    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    const match = text.match(/\{[\s\S]*\}/);
    let parsed = null;
    try { parsed = match ? JSON.parse(match[0]) : null; } catch { parsed = null; }

    const value = parsed ? normalize(field, parsed.value) : null;
    if (value === null || (Array.isArray(value) && value.length === 0) || value === "") {
      return json(502, { error: "AI returned an unexpected result. Try again." });
    }

    return json(200, { field, value });
  } catch (error) {
    console.error("[campaign-ai] generation failed:", error.message);
    return json(502, { error: "AI generation failed. Try again." });
  }
};
