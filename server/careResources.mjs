import { ScreeningError } from "./openaiScreening.mjs";

const SEARCH_ENDPOINT = "https://api.search.tinyfish.ai/";
const CARE_TERMS = {
  hospital: { en: "hospital", hi: "अस्पताल" },
  clinic: { en: "general physician clinic", hi: "सामान्य चिकित्सक क्लिनिक" },
  pediatrician: { en: "pediatrician clinic", hi: "बाल रोग विशेषज्ञ क्लिनिक" },
  dermatologist: { en: "dermatologist clinic", hi: "त्वचा रोग विशेषज्ञ क्लिनिक" },
};

export function validateCareSearch(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)
    || Object.keys(raw).some((key) => !["location", "careType", "language"].includes(key))) {
    throw new ScreeningError("Only a location and care type may be searched.", "INVALID_CARE_SEARCH", 400);
  }
  const location = typeof raw.location === "string" ? raw.location.trim().replace(/\s+/g, " ") : "";
  const isPin = /^\d+$/.test(location);
  const isCity = /^[\p{L}][\p{L}\p{M}\s,.'-]{1,79}$/u.test(location);
  if (!(isPin ? /^\d{6}$/.test(location) : isCity) || !Object.hasOwn(CARE_TERMS, raw.careType)
    || !["en", "hi"].includes(raw.language)) {
    throw new ScreeningError("Enter a city or six-digit PIN and choose a care type.", "INVALID_CARE_SEARCH", 400);
  }
  return { location, careType: raw.careType, language: raw.language };
}

function publicResultUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password
      || !url.hostname.includes(".") || url.hostname === "localhost") return null;
    return url.href;
  } catch {
    return null;
  }
}

export async function searchCareResources(raw, options = {}) {
  const { location, careType, language } = validateCareSearch(raw);
  const apiKey = Object.hasOwn(options, "apiKey") ? options.apiKey : process.env.TINYFISH_API_KEY;
  if (!apiKey) throw new ScreeningError("Care search is not configured.", "CARE_SEARCH_NOT_CONFIGURED", 503);

  const url = new URL(SEARCH_ENDPOINT);
  url.searchParams.set("query", `${CARE_TERMS[careType][language]} ${location} India`);
  url.searchParams.set("location", "IN");
  url.searchParams.set("language", language);
  url.searchParams.set("purpose", "Find public healthcare facility listings near a user-supplied city or postal code in India.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let response;
  try {
    response = await (options.fetchImpl || fetch)(url, {
      headers: { "X-API-Key": apiKey },
      signal: controller.signal,
    });
  } catch (error) {
    throw new ScreeningError(
      error?.name === "AbortError" ? "Care search timed out." : "Care search is temporarily unavailable.",
      error?.name === "AbortError" ? "CARE_SEARCH_TIMEOUT" : "CARE_SEARCH_UNAVAILABLE", 502,
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const code = response.status === 401 || response.status === 403 ? "CARE_SEARCH_INVALID_KEY"
      : response.status === 429 ? "CARE_SEARCH_RATE_LIMITED"
        : response.status === 402 ? "CARE_SEARCH_QUOTA" : "CARE_SEARCH_UNAVAILABLE";
    throw new ScreeningError("Care search is temporarily unavailable.", code, response.status === 429 ? 429 : 502);
  }

  let payload;
  try { payload = await response.json(); } catch {
    throw new ScreeningError("Care search returned an invalid response.", "CARE_SEARCH_UNAVAILABLE", 502);
  }
  if (!Array.isArray(payload?.results)) {
    throw new ScreeningError("Care search returned an invalid response.", "CARE_SEARCH_UNAVAILABLE", 502);
  }

  const seen = new Set();
  const results = [];
  for (const item of payload.results.slice(0, 50)) {
    const resultUrl = publicResultUrl(item?.url);
    const title = typeof item?.title === "string" ? item.title.trim().slice(0, 160) : "";
    if (!resultUrl || !title || seen.has(resultUrl)) continue;
    seen.add(resultUrl);
    results.push({
      title,
      url: resultUrl,
      siteName: typeof item.site_name === "string" ? item.site_name.trim().slice(0, 80) : new URL(resultUrl).hostname,
      snippet: typeof item.snippet === "string" ? item.snippet.trim().slice(0, 240) : "",
    });
    if (results.length === 5) break;
  }
  return { results };
}
