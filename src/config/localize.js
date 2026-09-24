export function localize(value, language, fallback = "") {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return fallback;
  return value[language] ?? value.en ?? Object.values(value)[0] ?? fallback;
}

