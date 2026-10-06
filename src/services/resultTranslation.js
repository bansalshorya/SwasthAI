// Translate only user-facing text. Clinical enums, confidence, and risk levels
// stay in the original result so a language change cannot alter triage state.
export function reportTextEntries(session) {
  const result = session?.result;
  if (!result) return [];
  const entries = [];
  const add = (id, value) => {
    if (typeof value === "string" && value.trim()) entries.push({ id, text: value.trim() });
  };
  const addList = (prefix, values) => {
    if (Array.isArray(values)) values.forEach((value, index) => add(`${prefix}.${index}`, value));
  };

  add("reportedSymptoms", session.inspection?.answers?.symptoms);
  add("summary", result.summary);
  (result.possibleConditions || []).forEach((condition, index) => {
    add(`possibleConditions.${index}.name`, condition.name);
    add(`possibleConditions.${index}.reason`, condition.reason);
    addList(`possibleConditions.${index}.commonSymptoms`, condition.commonSymptoms);
  });
  addList("evidence", result.evidence);
  add("imageAssessment", result.imageAssessment);
  add("imageConsistency.explanation", result.imageConsistency?.explanation);
  add("imageConsistency.recommendedAction", result.imageConsistency?.recommendedAction);
  addList("homeCare", result.homeCare);
  addList("dietPlan.eat", result.dietPlan?.eat);
  addList("dietPlan.avoid", result.dietPlan?.avoid);
  addList("monitorSymptoms", result.monitorSymptoms);
  addList("redFlags", result.redFlags);
  add("doctorRecommendation.specialist", result.doctorRecommendation?.specialist);
  add("doctorRecommendation.timeframe", result.doctorRecommendation?.timeframe);
  add("disclaimer", result.disclaimer);
  return entries;
}

export function validateReportTranslations(entries, items) {
  if (!Array.isArray(items) || items.length !== entries.length) return null;
  const expected = new Set(entries.map((entry) => entry.id));
  const translations = {};
  for (const item of items) {
    if (!item || !expected.has(item.id) || Object.hasOwn(translations, item.id)
      || typeof item.text !== "string" || !item.text.trim() || item.text.length > 4_000) return null;
    translations[item.id] = item.text.trim();
  }
  return translations;
}

export async function requestReportTranslation(entries, sourceLanguage, targetLanguage, options = {}) {
  const requestBody = JSON.stringify({ sourceLanguage, targetLanguage, items: entries });
  const fetchImpl = options.fetchImpl || fetch;
  const sleepImpl = options.sleepImpl || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetchImpl("/api/translate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    });
    const payload = await response.json().catch(() => null);
    if (response.ok) {
      const translations = validateReportTranslations(entries, payload?.items);
      if (!translations) throw new Error("The translated report was incomplete.");
      return translations;
    }
    const error = new Error(payload?.error?.message || `Translation failed: ${response.status}`);
    error.code = payload?.error?.code;
    error.retryAfterSeconds = Number(payload?.error?.retryAfterSeconds);
    // Retry a short provider cooldown once. Longer limits are shown to the
    // user instead of leaving the page waiting indefinitely or looping.
    if (attempt === 0 && error.code === "AI_RATE_LIMITED"
      && error.retryAfterSeconds > 0 && error.retryAfterSeconds <= 8) {
      await sleepImpl(error.retryAfterSeconds * 1000);
      continue;
    }
    throw error;
  }
  throw new Error("The translated report could not be completed.");
}

export function applyReportTranslations(session, translations, language) {
  if (!session?.result || !translations) return session;
  const translate = (id, original) => typeof original === "string" && original.trim()
    ? translations[id] || original
    : original;
  const translateList = (prefix, values) => Array.isArray(values)
    ? values.map((value, index) => translate(`${prefix}.${index}`, value))
    : values;
  const result = session.result;
  const translatedResult = {
    ...result,
    summary: translate("summary", result.summary),
    possibleConditions: (result.possibleConditions || []).map((condition, index) => ({
      ...condition,
      name: translate(`possibleConditions.${index}.name`, condition.name),
      reason: translate(`possibleConditions.${index}.reason`, condition.reason),
      commonSymptoms: translateList(`possibleConditions.${index}.commonSymptoms`, condition.commonSymptoms),
    })),
    evidence: translateList("evidence", result.evidence),
    imageAssessment: translate("imageAssessment", result.imageAssessment),
    imageConsistency: result.imageConsistency && {
      ...result.imageConsistency,
      explanation: translate("imageConsistency.explanation", result.imageConsistency.explanation),
      recommendedAction: translate("imageConsistency.recommendedAction", result.imageConsistency.recommendedAction),
    },
    homeCare: translateList("homeCare", result.homeCare),
    dietPlan: result.dietPlan && {
      ...result.dietPlan,
      eat: translateList("dietPlan.eat", result.dietPlan.eat),
      avoid: translateList("dietPlan.avoid", result.dietPlan.avoid),
    },
    monitorSymptoms: translateList("monitorSymptoms", result.monitorSymptoms),
    redFlags: translateList("redFlags", result.redFlags),
    doctorRecommendation: result.doctorRecommendation && {
      ...result.doctorRecommendation,
      specialist: translate("doctorRecommendation.specialist", result.doctorRecommendation.specialist),
      timeframe: translate("doctorRecommendation.timeframe", result.doctorRecommendation.timeframe),
    },
    disclaimer: translate("disclaimer", result.disclaimer),
  };
  return {
    ...session,
    language,
    inspection: {
      ...session.inspection,
      answers: {
        ...session.inspection?.answers,
        symptoms: translate("reportedSymptoms", session.inspection?.answers?.symptoms),
      },
    },
    result: translatedResult,
    analysis: translatedResult,
  };
}
