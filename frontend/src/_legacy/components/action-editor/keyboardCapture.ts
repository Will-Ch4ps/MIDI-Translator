export function captureCombo(event: KeyboardEvent) {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push("ctrl");
  if (event.shiftKey) parts.push("shift");
  if (event.altKey) parts.push("alt");
  if (event.metaKey) parts.push("windows");
  const key = normalizeKey(event.key);
  if (key) parts.push(key);
  return [...new Set(parts)].join("+");
}

function normalizeKey(key: string) {
  const next = key.toLowerCase();
  if (["control", "shift", "alt", "meta"].includes(next)) return "";
  if (next === " ") return "space";
  if (next === "escape") return "esc";
  if (next.startsWith("arrow")) return next.replace("arrow", "");
  return next;
}
