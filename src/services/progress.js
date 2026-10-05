const severityOrder = { mild: 1, moderate: 2, severe: 3 };

export function compareScreenings(previous, current) {
  if (!previous || !current) return null;
  const earlier = previous.inspection?.answers || {};
  const later = current.inspection?.answers || {};
  const earlierScore = severityOrder[earlier.severity];
  const laterScore = severityOrder[later.severity];
  let change = "stable";
  if (earlierScore && laterScore && earlierScore !== laterScore) change = laterScore < earlierScore ? "better" : "worse";
  else if (later.progression === "improving") change = "better";
  else if (later.progression === "worsening") change = "worse";
  return { change, previous, current };
}
