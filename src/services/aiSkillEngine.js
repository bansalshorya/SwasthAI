import { APP_CONFIG } from "../config/appConfig";
import { localize } from "../config/localize";
import { localizeConditionName, localizeMedicalText, localizeSymptoms } from "./medicalTranslation";

export { localizeConditionName, localizeMedicalText, localizeSymptoms };

function dataUrlPart(dataUrl) {
  const [metadata, data] = dataUrl.split(",", 2);
  const mimeType = metadata.match(/^data:([^;]+)/)?.[1] ?? "image/webp";
  return { inlineData: { data, mimeType } };
}

export function buildPrompt(session) {
  const language = session.language ?? APP_CONFIG.app.defaultLanguage;
  const images = session.inspection?.images ?? [];
  const answers = session.inspection?.answers ?? {};
  const imageRoles = images.length ? images.map((image, index) => {
    const step = APP_CONFIG.inspection.steps.find((item) => item.id === image.stepId);
    return `Image ${index + 1}: id=${image.stepId}, role=${step?.role ?? image.role ?? "unspecified"}, label=${localize(step?.label, language)}`;
  }).join("\n") : "No image supplied. Do not infer visual findings.";
  const answerLines = [
    `- symptoms: ${answers.symptoms ?? "not_provided"}`,
    ...APP_CONFIG.questions.map((question) => {
      const option = question.options.find((item) => item.value === answers[question.key]);
      return `- ${question.key}: ${answers[question.key] ?? "not_provided"}${option ? ` (${localize(option.label, language)})` : ""}`;
    }),
  ].join("\n");
  const validationRules = (APP_CONFIG.ai.validationRules[language] ?? []).map((rule) => `- ${rule}`).join("\n");
  const evidenceRules = (APP_CONFIG.ai.evidenceRules[language] ?? []).map((rule) => `- ${rule}`).join("\n");

  return `${localize(APP_CONFIG.ai.persona, language)}

Attached image roles, in exact part order:
${imageRoles}

User context:
${answerLines}

Target validation and triage rules:
${validationRules}

Evidence and safety boundaries:
${evidenceRules}

Keep home-care and diet guidance conservative and non-prescriptive. Include explicit escalation criteria.
Respond in ${language === "hi" ? "Hindi" : "English"}.
Return only JSON matching the supplied response schema. Do not add Markdown or extra text.`;
}

function requestBody(session) {
  const images = session.inspection?.images ?? [];
  const parts = images.filter((image) => image.dataUrl).map((image) => dataUrlPart(image.dataUrl));
  parts.push({ text: buildPrompt(session) });
  return {
    contents: [{ role: "user", parts }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: APP_CONFIG.ai.responseSchema,
    },
  };
}

function extractResult(payload) {
  if (payload?.result && typeof payload.result === "object") return payload.result;
  if (payload?.possibleConditions && payload?.riskLevel) return payload;
  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) throw new Error("AI returned no structured result.");
  return JSON.parse(text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, ""));
}

function validateResult(result) {
  const validRisk = ["low", "moderate", "high", "emergency"].includes(result?.riskLevel);
  const validConfidence = ["low", "medium", "high"].includes(result?.confidence);
  if (!validRisk || !validConfidence || !Array.isArray(result?.possibleConditions) || !result?.doctorRecommendation) {
    throw new Error("The screening service returned an incomplete result. Please try again.");
  }
  return result;
}

function demoConditions(symptoms, language) {
  const text = symptoms.toLowerCase();
  const isHindi = language === "hi";

  if (/rash|itch|redness|दाने|खुजली|लाल/.test(text)) return isHindi ? [
    { name: "कॉन्टैक्ट डर्मेटाइटिस", confidence: "medium", reason: "दाने, खुजली या लालिमा किसी चीज़ के संपर्क से हुई जलन से मेल खा सकती है।", commonSymptoms: ["लालिमा", "खुजली", "सूखी या उभरी त्वचा"] },
    { name: "घमौरी या गर्मी से दाने", confidence: "low", reason: "गर्मी और पसीने के बाद छोटे दाने इस स्थिति से मेल खा सकते हैं।", commonSymptoms: ["छोटे दाने", "चुभन", "पसीने वाली जगह पर जलन"] },
  ] : [
    { name: "Contact dermatitis", confidence: "medium", reason: "Rash, itching, or redness can fit irritation after contact with a product or material.", commonSymptoms: ["Redness", "Itching", "Dry or raised skin"] },
    { name: "Heat rash", confidence: "low", reason: "Small bumps after heat or sweating can fit this pattern.", commonSymptoms: ["Small bumps", "Prickling", "Irritation in sweaty areas"] },
  ];

  if (/stomach|abdomen|vomit|diarr|पेट|उल्टी|दस्त/.test(text)) return isHindi ? [
    { name: "वायरल गैस्ट्रोएंटेराइटिस", confidence: "low", reason: "पेट की परेशानी, उल्टी या दस्त अक्सर पेट के अस्थायी संक्रमण से जुड़े हो सकते हैं।", commonSymptoms: ["पेट में ऐंठन", "मतली", "ढीला मल"] },
    { name: "अपच या भोजन से हुई परेशानी", confidence: "low", reason: "भोजन के बाद दर्द या भारीपन अपच से मेल खा सकता है।", commonSymptoms: ["भारीपन", "गैस", "मतली"] },
  ] : [
    { name: "Viral gastroenteritis", confidence: "low", reason: "Stomach upset, vomiting, or diarrhea can occur with a short-lived gut infection.", commonSymptoms: ["Cramps", "Nausea", "Loose stools"] },
    { name: "Indigestion or food-related irritation", confidence: "low", reason: "Pain or fullness after eating can fit indigestion.", commonSymptoms: ["Fullness", "Gas", "Nausea"] },
  ];

  if (/cough|fever|cold|sore throat|खाँसी|खांसी|बुखार|जुकाम|गला/.test(text)) return isHindi ? [
    { name: "वायरल श्वसन संक्रमण", confidence: "medium", reason: "बुखार, खाँसी, जुकाम या गले की परेशानी अक्सर वायरल संक्रमण में साथ दिखते हैं।", commonSymptoms: ["खाँसी", "गले में खराश", "थकान", "बुखार"] },
    { name: "मौसमी एलर्जी", confidence: "low", reason: "यदि बुखार नहीं है और छींक या खुजली अधिक है, तो एलर्जी भी संभव हो सकती है।", commonSymptoms: ["छींक", "नाक बहना", "आँखों में खुजली"] },
  ] : [
    { name: "Viral respiratory infection", confidence: "medium", reason: "Fever, cough, a runny nose, or a sore throat commonly occur together with a viral infection.", commonSymptoms: ["Cough", "Sore throat", "Fatigue", "Fever"] },
    { name: "Seasonal allergy", confidence: "low", reason: "If there is no fever and sneezing or itching dominates, allergy is another possibility.", commonSymptoms: ["Sneezing", "Runny nose", "Itchy eyes"] },
  ];

  return isHindi ? [
    { name: "सामान्य अस्थायी बीमारी", confidence: "low", reason: "दी गई जानकारी किसी एक स्थिति की पहचान के लिए पर्याप्त विशिष्ट नहीं है।", commonSymptoms: ["अस्वस्थ महसूस करना", "थकान", "दर्द या परेशानी"] },
  ] : [
    { name: "A common short-term illness", confidence: "low", reason: "The information provided is not specific enough to identify one clear pattern.", commonSymptoms: ["Feeling unwell", "Fatigue", "Pain or discomfort"] },
  ];
}

function buildDemoResult(session) {
  const language = session.language ?? "en";
  const isHindi = language === "hi";
  const answers = session.inspection?.answers ?? {};
  const images = session.inspection?.images ?? [];
  const highConcern = answers.severity === "severe" && answers.progression === "worsening";
  const moderateConcern = answers.severity === "moderate" || answers.progression === "worsening" || ["child", "older_adult"].includes(answers.ageGroup);
  const riskLevel = highConcern ? "high" : moderateConcern ? "moderate" : "low";
  const localizedAnswer = (key) => {
    const question = APP_CONFIG.questions.find((item) => item.key === key);
    const option = question?.options.find((item) => item.value === answers[key]);
    return localize(option?.label, language, answers[key] || (isHindi ? "उपलब्ध नहीं" : "not provided"));
  };

  return {
    isTargetValid: Boolean(answers.symptoms),
    riskLevel,
    confidence: images.length ? "medium" : "low",
    summary: isHindi
      ? "आपके उत्तर कुछ सामान्य स्थितियों से मेल खा सकते हैं। यह पुष्टि नहीं है—बदलाव पर नज़र रखें और जरूरत होने पर डॉक्टर से सलाह लें।"
      : "Your answers may fit a few common conditions. This is not confirmation—monitor changes and consult a clinician when needed.",
    possibleConditions: demoConditions(answers.symptoms ?? "", language),
    evidence: isHindi
      ? [`बताए गए मुख्य लक्षण: ${answers.symptoms || "उपलब्ध नहीं"}`, `अवधि: ${localizedAnswer("duration")}`, `गंभीरता: ${localizedAnswer("severity")}`]
      : [`Main symptoms reported: ${answers.symptoms || "not provided"}`, `Duration: ${localizedAnswer("duration")}`, `Severity: ${localizedAnswer("severity")}`],
    imageAssessment: isHindi
      ? images.length ? `${images.length} फोटो जोड़ी गई। डेमो मोड में वास्तविक दृश्य निदान नहीं किया जाता।` : "कोई फोटो नहीं जोड़ी गई; स्क्रीनिंग केवल आपके उत्तरों पर आधारित है।"
      : images.length ? `${images.length} photo(s) added. Prototype mode does not perform a real visual diagnosis.` : "No photo was added; this screening is based only on your answers.",
    homeCare: isHindi
      ? ["आराम करें और पर्याप्त तरल लें।", "लक्षणों और तापमान में बदलाव नोट करें।", "यदि परेशानी बढ़े तो स्वयं इलाज करने के बजाय डॉक्टर से बात करें।"]
      : ["Rest and drink adequate fluids.", "Keep track of symptom and temperature changes.", "If symptoms worsen, speak with a clinician instead of self-treating."],
    dietPlan: isHindi
      ? { eat: ["पानी और हल्के तरल", "सहन होने पर सादा, संतुलित भोजन"], avoid: ["शराब", "बहुत तला या मसालेदार भोजन यदि पेट खराब है"] }
      : { eat: ["Water and light fluids", "Plain, balanced meals as tolerated"], avoid: ["Alcohol", "Very oily or spicy food when the stomach is upset"] },
    monitorSymptoms: isHindi
      ? ["लक्षण तेजी से बढ़ना", "बुखार कई दिन रहना", "पानी या भोजन न रख पाना", "नई सूजन या फैलती लालिमा"]
      : ["Symptoms worsening quickly", "Fever lasting several days", "Unable to keep fluids down", "New swelling or spreading redness"],
    redFlags: isHindi
      ? ["सांस लेने में कठिनाई", "सीने में दर्द", "बेहोशी या भ्रम", "तेज़ रक्तस्राव या अचानक कमजोरी"]
      : ["Difficulty breathing", "Chest pain", "Fainting or confusion", "Heavy bleeding or sudden weakness"],
    doctorRecommendation: isHindi
      ? { specialist: "प्राथमिक देखभाल डॉक्टर या सामान्य चिकित्सक", timeframe: riskLevel === "high" ? "आज ही सलाह लें" : riskLevel === "moderate" ? "24 घंटों के भीतर सलाह लें" : "यदि 2–3 दिनों में सुधार न हो तो सलाह लें" }
      : { specialist: "Primary-care doctor or general physician", timeframe: riskLevel === "high" ? "Seek advice today" : riskLevel === "moderate" ? "Seek advice within 24 hours" : "Seek advice if there is no improvement in 2–3 days" },
    disclaimer: localize(APP_CONFIG.results.disclaimer, language),
    prototype: true,
  };
}

export async function runAnalysis(session) {
  const proxyUrl = import.meta.env.VITE_AI_PROXY_URL;
  if (!proxyUrl) {
    await new Promise((resolve) => setTimeout(resolve, 1100));
    return buildDemoResult(session);
  }

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: APP_CONFIG.ai.model, request: requestBody(session) }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.error?.message ?? `AI request failed (${response.status})`);
  return validateResult(extractResult(payload));
}

export function hydrateSession(session, targetLanguage) {
  if (!session) return session;
  const language = targetLanguage ?? session.language ?? APP_CONFIG.app.defaultLanguage;
  const isHindi = language === "hi";
  const existingAnswers = session.inspection?.answers ?? {};

  let symptoms = existingAnswers.symptoms;
  if (!symptoms && session.result?.possibleConditions?.[0]) {
    const firstCond = session.result.possibleConditions[0];
    if (firstCond.commonSymptoms && firstCond.commonSymptoms.length) {
      symptoms = firstCond.commonSymptoms.join(", ");
    } else {
      symptoms = firstCond.name;
    }
  }

  const localizedSymptoms = localizeSymptoms(symptoms, language) || (isHindi ? "त्वचा पर दाने, खुजली" : "Rash, itching");

  const inspection = {
    ...session.inspection,
    answers: {
      ...existingAnswers,
      symptoms: localizedSymptoms,
    },
    images: session.inspection?.images ?? [],
  };

  const syntheticSession = { ...session, language, inspection };
  const fallback = buildDemoResult(syntheticSession);

  const existingResult = session.result || session.analysis || {};
  const hasFullGuidance = Boolean(
    existingResult.homeCare?.length &&
    existingResult.dietPlan?.eat?.length &&
    existingResult.monitorSymptoms?.length &&
    existingResult.redFlags?.length &&
    existingResult.doctorRecommendation?.specialist
  );

  const fullResult = hasFullGuidance ? existingResult : {
    ...fallback,
    ...existingResult,
    possibleConditions: (existingResult.possibleConditions && existingResult.possibleConditions.length)
      ? existingResult.possibleConditions
      : fallback.possibleConditions,
    evidence: (existingResult.evidence && existingResult.evidence.length)
      ? existingResult.evidence
      : fallback.evidence,
    imageAssessment: existingResult.imageAssessment || fallback.imageAssessment,
    homeCare: (existingResult.homeCare && existingResult.homeCare.length)
      ? existingResult.homeCare
      : fallback.homeCare,
    dietPlan: (existingResult.dietPlan?.eat && existingResult.dietPlan.eat.length)
      ? existingResult.dietPlan
      : fallback.dietPlan,
    monitorSymptoms: (existingResult.monitorSymptoms && existingResult.monitorSymptoms.length)
      ? existingResult.monitorSymptoms
      : fallback.monitorSymptoms,
    redFlags: (existingResult.redFlags && existingResult.redFlags.length)
      ? existingResult.redFlags
      : fallback.redFlags,
    doctorRecommendation: existingResult.doctorRecommendation?.specialist
      ? existingResult.doctorRecommendation
      : fallback.doctorRecommendation,
  };

  const localizedConditions = (fullResult.possibleConditions || []).map((c) => ({
    ...c,
    name: localizeConditionName(c.name, language),
    reason: localizeMedicalText(c.reason, language),
    commonSymptoms: (c.commonSymptoms || []).map((s) => localizeSymptoms(s, language)),
  }));

  const localizedEvidence = (fullResult.evidence || []).map((e) => localizeMedicalText(e, language));
  const localizedSummary = localizeMedicalText(fullResult.summary, language);
  const localizedImageAssessment = localizeMedicalText(fullResult.imageAssessment, language);
  const localizedHomeCare = (fullResult.homeCare || []).map((h) => localizeMedicalText(h, language));
  const localizedDietPlan = {
    eat: (fullResult.dietPlan?.eat || []).map((item) => localizeMedicalText(item, language)),
    avoid: (fullResult.dietPlan?.avoid || []).map((item) => localizeMedicalText(item, language)),
  };
  const localizedMonitorSymptoms = (fullResult.monitorSymptoms || []).map((m) => localizeMedicalText(m, language));
  const localizedRedFlags = (fullResult.redFlags || []).map((r) => localizeMedicalText(r, language));
  const localizedDoctorRecommendation = fullResult.doctorRecommendation ? {
    specialist: localizeMedicalText(fullResult.doctorRecommendation.specialist, language),
    timeframe: localizeMedicalText(fullResult.doctorRecommendation.timeframe, language),
  } : fullResult.doctorRecommendation;

  const fullyLocalizedResult = {
    ...fullResult,
    summary: localizedSummary,
    possibleConditions: localizedConditions,
    evidence: localizedEvidence,
    imageAssessment: localizedImageAssessment,
    homeCare: localizedHomeCare,
    dietPlan: localizedDietPlan,
    monitorSymptoms: localizedMonitorSymptoms,
    redFlags: localizedRedFlags,
    doctorRecommendation: localizedDoctorRecommendation,
    disclaimer: localize(APP_CONFIG.results.disclaimer, language),
  };

  return {
    ...session,
    language,
    inspection,
    analysis: fullyLocalizedResult,
    result: fullyLocalizedResult,
  };
}
