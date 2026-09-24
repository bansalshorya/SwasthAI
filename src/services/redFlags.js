const RED_FLAG_PATTERNS = [
  /chest pain|pressure in (my |the )?chest|difficulty breathing|can'?t breathe|unconscious|fainted|seizure|heavy bleeding|face droop|sudden weakness|suicid/i,
  /सीने में दर्द|सांस लेने में (दिक्कत|परेशानी)|साँस नहीं|बेहोश|दौरा|बहुत खून|अचानक कमजोरी|चेहरा टेढ़ा|आत्महत्या/i,
];

export function hasRedFlag(text = "") {
  return RED_FLAG_PATTERNS.some((pattern) => pattern.test(text.trim()));
}
