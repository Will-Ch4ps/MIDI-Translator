/**
 * Tradução entre o que a UI mostra ("tipos" simples) e as ações que o
 * backend Python entende (core/mapper/models.py → ActionType).
 */
import type { Action, Control, Mapping } from "./types";

export type Kind = "app" | "script" | "command" | "key" | "media" | "volume";
export type MediaOp = "play" | "next" | "prev";
export type VolumeOp = "up" | "down" | "mute";

export const KIND_LABEL: Record<Kind, string> = {
  app: "Abrir programa",
  script: "Rodar script",
  command: "Comando",
  key: "Atalho de teclado",
  media: "Mídia",
  volume: "Volume",
};

export const KIND_TAG: Record<Kind, string> = {
  app: "Programa",
  script: "Script",
  command: "Comando",
  key: "Atalho",
  media: "Mídia",
  volume: "Volume",
};

export type Form = {
  label: string;
  path: string;
  args: string;
  command: string;
  combo: string;
  media: MediaOp;
  volumeOp: VolumeOp;
  target: string;
  step: number;
};

export const emptyForm = (): Form => ({
  label: "", path: "", args: "", command: "", combo: "",
  media: "play", volumeOp: "up", target: "master", step: 4,
});

/** Knobs, pitch e faders mandam valor contínuo (0–127), não "apertou/soltou". */
export const isContinuous = (control: Control) =>
  control.type.includes("knob") || control.type === "pitch_bend" || control.type === "fader";

export const kindsFor = (continuous: boolean): Kind[] =>
  continuous ? ["volume", "command", "script"] : ["app", "script", "command", "key", "media", "volume"];

export function kindOf(mapping?: Mapping): Kind | null {
  const type = mapping?.action.type;
  if (type === "key" || type === "macro") return "key";
  if (type === "app_launch") return "app";
  if (type === "script" || type === "command") return type;
  if (type?.startsWith("media")) return "media";
  if (type?.startsWith("volume")) return "volume";
  return null;
}

export function formFrom(mapping?: Mapping): Form {
  const form = emptyForm();
  if (!mapping) return form;
  const { type, params } = mapping.action;
  const text = (key: string) => String(params[key] ?? "");
  form.label = mapping.label;
  form.path = text("path");
  form.args = text("args");
  form.command = text("command");
  form.combo = type === "macro" && Array.isArray(params.steps)
    ? params.steps.map((step) => String((step as { combo?: unknown }).combo ?? "")).join(", ")
    : text("combo");
  form.media = type === "media_next" ? "next" : type === "media_prev" ? "prev" : "play";
  form.volumeOp = type === "volume_down" ? "down" : type === "volume_mute" ? "mute" : "up";
  form.target = text("target") || "master";
  form.step = Math.round(Number(params.step ?? 0.04) * 100) || 4;
  return form;
}

/** Monta a ação pro backend. `null` = falta informação obrigatória. */
export function toAction(kind: Kind, form: Form, continuous: boolean): Action | null {
  switch (kind) {
    case "app":
      return form.path.trim() ? { type: "app_launch", params: { path: form.path.trim() } } : null;
    case "script":
      return form.path.trim()
        ? { type: "script", params: { path: form.path.trim(), args: form.args.trim() } }
        : null;
    case "command":
      return form.command.trim() ? { type: "command", params: { command: form.command.trim(), shell: true } } : null;
    case "key": {
      const combos = splitCombos(form.combo);
      if (combos.length === 0) return null;
      if (combos.length === 1) return { type: "key", params: { combo: combos[0], mode: "tap" } };
      return { type: "macro", params: { steps: combos.map((combo) => ({ combo, delay_ms: 70 })) } };
    }
    case "media":
      return { type: `media_${form.media}`, params: {} };
    case "volume": {
      const target = form.target.trim().toLowerCase() || "master";
      if (continuous) return { type: "volume_set", params: { knob_mode: "auto", invert: false, target } };
      if (form.volumeOp === "mute") return { type: "volume_mute", params: {} };
      const step = Math.min(100, Math.max(1, form.step)) / 100;
      return { type: `volume_${form.volumeOp}`, params: { step, target, use_knob_direction: false } };
    }
  }
}

export const splitCombos = (text: string) =>
  text.split(/[\n,;]/).map((item) => item.trim().toLowerCase()).filter(Boolean);

const MEDIA_NAME: Record<MediaOp, string> = { play: "Play/Pause", next: "Próxima", prev: "Anterior" };

/** Nome automático quando o usuário não digita um. */
export function suggestLabel(kind: Kind, form: Form): string {
  if (kind === "app" || kind === "script") return programName(form.path);
  if (kind === "key") return form.combo.trim().toUpperCase();
  if (kind === "media") return MEDIA_NAME[form.media];
  if (kind === "volume") return form.volumeOp === "mute" ? "Mudo" : form.target || "Volume";
  return "";
}

function programName(raw: string): string {
  let token = raw.trim();
  if (token.startsWith('"')) token = token.slice(1, token.indexOf('"', 1) > 0 ? token.indexOf('"', 1) : undefined);
  else token = token.split(/\s+/)[0] ?? "";
  const leaf = token.split(/[\\/!]/).filter(Boolean).pop() ?? "";
  return leaf.replace(/\.(exe|lnk|bat|cmd|com|vbs|ps1|py)$/i, "").replace(/[_-]+/g, " ").trim();
}
