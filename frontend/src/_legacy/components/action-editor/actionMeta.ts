const EXE_CLEAN_RE = /\.(exe|lnk|bat|cmd|com|vbs|ps1|py)$/i;

export const VOLUME_TARGETS = [
  { value: "master", label: "Sistema (master)" },
  { value: "browser", label: "Navegadores" },
  { value: "lol", label: "League of Legends" },
  { value: "youtube", label: "YouTube (navegador)" },
  { value: "discord", label: "Discord" },
  { value: "spotify", label: "Spotify" },
  { value: "obs", label: "OBS" },
];

export function normalizeVolumeTarget(raw: string) {
  const text = raw.trim().toLowerCase();
  return text || "master";
}

export function friendlyProgramName(raw: string) {
  const token = firstToken(raw);
  if (!token) return "";
  const leaf = token.split(/[\\/]/).filter(Boolean).pop() || token;
  return leaf.replace(EXE_CLEAN_RE, "").replace(/[_-]+/g, " ").trim();
}

export function suggestActionLabel(type: string, value: string, current: string) {
  if (current.trim()) return current;
  if (type === "app_launch" || type === "script") return friendlyProgramName(value);
  if (type === "key") return value.trim().toUpperCase();
  return "";
}

function firstToken(raw: string) {
  const text = raw.trim();
  if (!text) return "";
  if (text.startsWith('"')) {
    const end = text.indexOf('"', 1);
    return end > 1 ? text.slice(1, end) : text.replace(/"/g, "");
  }
  return text.split(/\s+/)[0];
}
