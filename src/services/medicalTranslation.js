// Comprehensive medical dictionary mapping between English and Hindi for conditions, symptoms, and guidance

const CONDITIONS = [
  { en: "Viral respiratory infection", hi: "वायरल श्वसन संक्रमण" },
  { en: "Seasonal allergy", hi: "मौसमी एलर्जी" },
  { en: "Contact dermatitis", hi: "कॉन्टैक्ट डर्मेटाइटिस" },
  { en: "Heat rash", hi: "घमौरी या गर्मी से दाने" },
  { en: "Viral gastroenteritis", hi: "वायरल गैस्ट्रोएंटेराइटिस" },
  { en: "Indigestion or food-related irritation", hi: "अपच या भोजन से हुई परेशानी" },
  { en: "A common short-term illness", hi: "सामान्य अस्थायी बीमारी" },
];

const SYMPTOMS = [
  { en: "Cough", hi: "खाँसी" },
  { en: "Fever", hi: "बुखार" },
  { en: "Cold", hi: "जुकाम" },
  { en: "Sore throat", hi: "गले में खराश" },
  { en: "Fatigue", hi: "थकान" },
  { en: "Redness", hi: "लालिमा" },
  { en: "Itching", hi: "खुजली" },
  { en: "Dry or raised skin", hi: "सूखी या उभरी त्वचा" },
  { en: "Small bumps", hi: "छोटे दाने" },
  { en: "Prickling", hi: "चुभन" },
  { en: "Irritation in sweaty areas", hi: "पसीने वाली जगह पर जलन" },
  { en: "Cramps", hi: "पेट में ऐंठन" },
  { en: "Nausea", hi: "मतली" },
  { en: "Loose stools", hi: "ढीला मल" },
  { en: "Fullness", hi: "भारीपन" },
  { en: "Gas", hi: "गैस" },
  { en: "Sneezing", hi: "छींक" },
  { en: "Runny nose", hi: "नाक बहना" },
  { en: "Itchy eyes", hi: "आँखों में खुजली" },
  { en: "Headache", hi: "सिर दर्द" },
  { en: "Stomach pain", hi: "पेट दर्द" },
  { en: "Skin rash", hi: "त्वचा पर दाने" },
  { en: "Feeling unwell", hi: "अस्वस्थ महसूस करना" },
  { en: "Pain or discomfort", hi: "दर्द या परेशानी" },
  { en: "Rash", hi: "दाने" },
  { en: "Vomiting", hi: "उल्टी" },
  { en: "Diarrhea", hi: "दस्त" },
  { en: "Body pain", hi: "बदन दर्द" },
  { en: "Chest pain", hi: "सीने में दर्द" },
  { en: "Difficulty breathing", hi: "सांस लेने में कठिनाई" },
  { en: "Weakness", hi: "कमजोरी" },
  { en: "Chills", hi: "कंपकंपी" },
  { en: "Dizziness", hi: "चक्कर आना" },
];

const PHRASES = [
  // Summaries
  {
    en: "Your answers may fit a few common conditions. This is not confirmation—monitor changes and consult a clinician when needed.",
    hi: "आपके उत्तर कुछ सामान्य स्थितियों से मेल खा सकते हैं। यह पुष्टि नहीं है—बदलाव पर नज़र रखें और जरूरत होने पर डॉक्टर से सलाह लें।",
  },
  // Reasons
  {
    en: "Rash, itching, or redness can fit irritation after contact with a product or material.",
    hi: "दाने, खुजली या लालिमा किसी चीज़ के संपर्क से हुई जलन से मेल खा सकती है।",
  },
  {
    en: "Small bumps after heat or sweating can fit this pattern.",
    hi: "गर्मी और पसीने के बाद छोटे दाने इस स्थिति से मेल खा सकते हैं।",
  },
  {
    en: "Stomach upset, vomiting, or diarrhea can occur with a short-lived gut infection.",
    hi: "पेट की परेशानी, उल्टी या दस्त अक्सर पेट के अस्थायी संक्रमण से जुड़े हो सकते हैं।",
  },
  {
    en: "Pain or fullness after eating can fit indigestion.",
    hi: "भोजन के बाद दर्द या भारीपन अपच से मेल खा सकता है।",
  },
  {
    en: "Fever, cough, a runny nose, or a sore throat commonly occur together with a viral infection.",
    hi: "बुखार, खाँसी, जुकाम या गले की परेशानी अक्सर वायरल संक्रमण में साथ दिखते हैं।",
  },
  {
    en: "If there is no fever and sneezing or itching dominates, allergy is another possibility.",
    hi: "यदि बुखार नहीं है और छींक या खुजली अधिक है, तो एलर्जी भी संभव हो सकती है।",
  },
  {
    en: "The information provided is not specific enough to identify one clear pattern.",
    hi: "दी गई जानकारी किसी एक स्थिति की पहचान के लिए पर्याप्त विशिष्ट नहीं है।",
  },
  // Home care
  {
    en: "Rest and drink adequate fluids.",
    hi: "आराम करें और पर्याप्त तरल लें।",
  },
  {
    en: "Keep track of symptom and temperature changes.",
    hi: "लक्षणों और तापमान में बदलाव नोट करें।",
  },
  {
    en: "If symptoms worsen, speak with a clinician instead of self-treating.",
    hi: "यदि परेशानी बढ़े तो स्वयं इलाज करने के बजाय डॉक्टर से बात करें।",
  },
  // Diet
  {
    en: "Water and light fluids",
    hi: "पानी और हल्के तरल",
  },
  {
    en: "Plain, balanced meals as tolerated",
    hi: "सहन होने पर सादा, संतुलित भोजन",
  },
  {
    en: "Alcohol",
    hi: "शराब",
  },
  {
    en: "Very oily or spicy food when the stomach is upset",
    hi: "बहुत तला या मसालेदार भोजन यदि पेट खराब है",
  },
  // Monitor
  {
    en: "Symptoms worsening quickly",
    hi: "लक्षण तेजी से बढ़ना",
  },
  {
    en: "Fever lasting several days",
    hi: "बुखार कई दिन रहना",
  },
  {
    en: "Unable to keep fluids down",
    hi: "पानी या भोजन न रख पाना",
  },
  {
    en: "New swelling or spreading redness",
    hi: "नई सूजन या फैलती लालिमा",
  },
  // Red flags
  {
    en: "Difficulty breathing",
    hi: "सांस लेने में कठिनाई",
  },
  {
    en: "Chest pain",
    hi: "सीने में दर्द",
  },
  {
    en: "Fainting or confusion",
    hi: "बेहोशी या भ्रम",
  },
  {
    en: "Heavy bleeding or sudden weakness",
    hi: "तेज़ रक्तस्राव या अचानक कमजोरी",
  },
  // Doctor recommendations
  {
    en: "Primary-care doctor or general physician",
    hi: "प्राथमिक देखभाल डॉक्टर या सामान्य चिकित्सक",
  },
  {
    en: "Seek advice today",
    hi: "आज ही सलाह लें",
  },
  {
    en: "Seek advice within 24 hours",
    hi: "24 घंटों के भीतर सलाह लें",
  },
  {
    en: "Seek advice if there is no improvement in 2–3 days",
    hi: "यदि 2–3 दिनों में सुधार न हो तो सलाह लें",
  },
  // Image Assessment
  {
    en: "No photo was added; this screening is based only on your answers.",
    hi: "कोई फोटो नहीं जोड़ी गई; स्क्रीनिंग केवल आपके उत्तरों पर आधारित है।",
  },
  {
    en: "Prototype mode does not perform a real visual diagnosis.",
    hi: "डेमो मोड में वास्तविक दृश्य निदान नहीं किया जाता।",
  },
  // Question options in evidence
  { en: "Started today", hi: "आज शुरू हुए" },
  { en: "1–3 days", hi: "1–3 दिन" },
  { en: "4–7 days", hi: "4–7 दिन" },
  { en: "More than a week", hi: "एक हफ्ते से ज्यादा" },
  { en: "Mild—I can do normal activities", hi: "हल्की—काम कर पा रहा/रही हूँ" },
  { en: "Moderate—activities are affected", hi: "मध्यम—काम प्रभावित है" },
  { en: "Severe—normal activities are difficult", hi: "तेज़—सामान्य काम मुश्किल है" },
  { en: "Getting better", hi: "बेहतर हो रहे हैं" },
  { en: "About the same", hi: "लगभग वैसे ही हैं" },
  { en: "Getting worse", hi: "बढ़ रहे हैं" },
  { en: "Child—under 12", hi: "बच्चा—12 वर्ष से कम" },
  { en: "Teen—12 to 17", hi: "किशोर—12 से 17" },
  { en: "Adult—18 to 59", hi: "वयस्क—18 से 59" },
  { en: "Older adult—60 or above", hi: "वरिष्ठ—60 या अधिक" },
  { en: "not provided", hi: "उपलब्ध नहीं" },
];

export function localizeConditionName(name, targetLang = "hi") {
  if (!name) return name;
  const match = CONDITIONS.find(
    (item) => item.en.toLowerCase() === name.toLowerCase() || item.hi === name
  );
  if (!match) return name;
  return targetLang === "hi" ? match.hi : match.en;
}

export function localizeSingleSymptom(word, targetLang = "hi") {
  const trimmed = word.trim();
  if (!trimmed) return trimmed;
  const match = SYMPTOMS.find(
    (item) => item.en.toLowerCase() === trimmed.toLowerCase() || item.hi === trimmed
  );
  if (!match) return trimmed;
  return targetLang === "hi" ? match.hi : match.en;
}

export function localizeSymptoms(symptoms, targetLang = "hi") {
  if (!symptoms || typeof symptoms !== "string") return symptoms;
  // Handle comma-separated or slash-separated lists
  const parts = symptoms.split(/([,、/]+|\band\b|\bतथा\b|\bऔर\b)/i);
  return parts
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed || /^(,|、|\/|and|तथा|और)$/i.test(trimmed)) {
        if (/^and$/i.test(trimmed) && targetLang === "hi") return " और ";
        if (/^और$/i.test(trimmed) && targetLang === "en") return " and ";
        return part;
      }
      return localizeSingleSymptom(trimmed, targetLang);
    })
    .join("");
}

export function localizeMedicalText(text, targetLang = "hi") {
  if (!text || typeof text !== "string") return text;
  const trimmed = text.trim();

  // 1. Direct phrase match
  const phraseMatch = PHRASES.find(
    (item) => item.en.toLowerCase() === trimmed.toLowerCase() || item.hi === trimmed
  );
  if (phraseMatch) {
    return targetLang === "hi" ? phraseMatch.hi : phraseMatch.en;
  }

  // 2. Direct condition match
  const conditionMatch = CONDITIONS.find(
    (item) => item.en.toLowerCase() === trimmed.toLowerCase() || item.hi === trimmed
  );
  if (conditionMatch) {
    return targetLang === "hi" ? conditionMatch.hi : conditionMatch.en;
  }

  // 3. Evidence strings like "Main symptoms reported: ..." or "Duration: ..."
  if (targetLang === "hi") {
    if (trimmed.startsWith("Main symptoms reported:")) {
      const rest = trimmed.replace(/^Main symptoms reported:\s*/i, "");
      return `बताए गए मुख्य लक्षण: ${localizeSymptoms(rest, "hi")}`;
    }
    if (trimmed.startsWith("Duration:")) {
      const rest = trimmed.replace(/^Duration:\s*/i, "");
      return `अवधि: ${localizeMedicalText(rest, "hi")}`;
    }
    if (trimmed.startsWith("Severity:")) {
      const rest = trimmed.replace(/^Severity:\s*/i, "");
      return `गंभीरता: ${localizeMedicalText(rest, "hi")}`;
    }
    if (trimmed.includes("photo(s) added")) {
      const countMatch = trimmed.match(/^(\d+)\s+photo/i);
      const count = countMatch ? countMatch[1] : "";
      return `${count ? `${count} ` : ""}फोटो जोड़ी गई। डेमो मोड में वास्तविक दृश्य निदान नहीं किया जाता।`;
    }
  } else {
    if (trimmed.startsWith("बताए गए मुख्य लक्षण:")) {
      const rest = trimmed.replace(/^बताए गए मुख्य लक्षण:\s*/, "");
      return `Main symptoms reported: ${localizeSymptoms(rest, "en")}`;
    }
    if (trimmed.startsWith("अवधि:")) {
      const rest = trimmed.replace(/^अवधि:\s*/, "");
      return `Duration: ${localizeMedicalText(rest, "en")}`;
    }
    if (trimmed.startsWith("गंभीरता:")) {
      const rest = trimmed.replace(/^गंभीरता:\s*/, "");
      return `Severity: ${localizeMedicalText(rest, "en")}`;
    }
    if (trimmed.includes("फोटो जोड़ी गई")) {
      const countMatch = trimmed.match(/^(\d+)\s+फोटो/);
      const count = countMatch ? countMatch[1] : "";
      return `${count ? `${count} ` : ""}photo(s) added. Prototype mode does not perform a real visual diagnosis.`;
    }
  }

  return text;
}
