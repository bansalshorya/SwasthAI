const yesNo = [
  { value: "yes", label: { en: "Yes", hi: "हाँ" } },
  { value: "no", label: { en: "No", hi: "नहीं" } },
  { value: "unsure", label: { en: "Not sure", hi: "पता नहीं" } },
];

export const FOLLOW_UP_QUESTIONS = [
  { key: "fever", title: { en: "Do you also have a fever?", hi: "क्या बुखार भी है?" }, subtitle: { en: "Choose what you have noticed.", hi: "जो महसूस हुआ है, वह चुनें।" }, options: yesNo },
  { key: "breathing", title: { en: "Any breathing difficulty?", hi: "क्या साँस लेने में कठिनाई है?" }, subtitle: { en: "If severe or sudden, seek urgent help now.", hi: "तेज़ या अचानक होने पर तुरंत मदद लें।" }, options: yesNo },
  { key: "pain", title: { en: "Is there pain along with this symptom?", hi: "क्या इसके साथ दर्द भी है?" }, subtitle: { en: "Include pain you can feel even if it is not visible.", hi: "ऐसा दर्द भी शामिल करें जो दिखता नहीं है।" }, options: yesNo },
  { key: "spreading", title: { en: "Is the affected area spreading?", hi: "क्या प्रभावित हिस्सा फैल रहा है?" }, subtitle: { en: "Consider any visible change since it began.", hi: "शुरुआत से अब तक दिखने वाला बदलाव सोचें।" }, options: yesNo },
  { key: "newExposure", title: { en: "Did this begin after a new food, product, or exposure?", hi: "क्या यह किसी नए भोजन, उत्पाद या संपर्क के बाद शुरू हुआ?" }, subtitle: { en: "This includes soaps, plants, and other recent changes.", hi: "इसमें साबुन, पौधे या हाल के अन्य बदलाव शामिल हैं।" }, options: yesNo },
  { key: "vomiting", title: { en: "Have you been vomiting?", hi: "क्या उल्टी हो रही है?" }, subtitle: { en: "Choose what is happening now.", hi: "अभी जो हो रहा है, वह चुनें।" }, options: yesNo },
  { key: "hydration", title: { en: "Are you able to drink fluids normally?", hi: "क्या आप सामान्य रूप से तरल पदार्थ पी पा रहे हैं?" }, subtitle: { en: "Difficulty keeping fluids down can matter.", hi: "तरल पदार्थ न रुकना महत्वपूर्ण हो सकता है।" }, options: yesNo },
  { key: "dizziness", title: { en: "Have you felt dizzy or faint?", hi: "क्या चक्कर या बेहोशी जैसा लगा है?" }, subtitle: { en: "If fainting occurred, seek urgent help.", hi: "बेहोशी हुई हो तो तुरंत मदद लें।" }, options: yesNo },
];

export const FOLLOW_UP_BY_KEY = new Map(FOLLOW_UP_QUESTIONS.map((question) => [question.key, question]));

export function fallbackFollowUpIds(symptoms = "") {
  const value = String(symptoms).toLowerCase();
  if (/rash|skin|itch|swelling|redness|दाने|खुज|त्वचा|सूजन/.test(value)) return ["spreading", "newExposure", "fever"];
  if (/cough|cold|throat|breath|खाँसी|गला|साँस/.test(value)) return ["fever", "breathing", "pain"];
  if (/stomach|abdomen|vomit|diarr|पेट|उल्टी|दस्त/.test(value)) return ["vomiting", "hydration", "pain"];
  return ["fever", "pain", "dizziness"];
}
