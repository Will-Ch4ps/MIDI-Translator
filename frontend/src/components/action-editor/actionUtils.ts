import type { Control, Mapping } from "../../types";
import { normalizeVolumeTarget } from "./actionMeta";
import { actionExamples, actionHelp, optionLabel, placeholderFor, valueLabel } from "./actionDescriptions";

export type Option = { type: string; label: string };
export type OptionGroup = { id: string; label: string; items: Option[] };
export type ActionExample = { label: string; value: string; args?: string };
export type TriggerMode = "press" | "release" | "hold" | "double";

type ParamsExtra = { scriptArgs?: string; volumeTarget?: string };

export function optionsFor(type: string): Option[] {
  return groupedOptionsFor(type).flatMap((group) => group.items);
}

export function groupedOptionsFor(type: string): OptionGroup[] {
  if (isContinuous(type)) {
    return [
      { id: "continuous", label: "Controle continuo", items: options("volume_set", "volume_up", "volume_down") },
      { id: "exec", label: "Execucao", items: options("command", "script") },
    ];
  }

  return [
    { id: "shortcut", label: "Atalhos e macro", items: options("key", "macro") },
    { id: "media", label: "Midia e volume", items: options("media_play", "media_next", "media_prev", "volume_up", "volume_down", "volume_mute") },
    { id: "exec", label: "Programas e scripts", items: options("app_launch", "command", "script") },
  ];
}

export function paramsFor(type: string, value: string, control: Control, extra: ParamsExtra = {}) {
  if (type === "key") return { combo: value.trim(), mode: "tap" };
  if (type === "macro") return { steps: splitValue(value).map((combo) => ({ combo, delay_ms: 70 })) };
  if (type === "app_launch") return { path: value.trim() };
  if (type === "command") return { command: value.trim(), shell: true };
  if (type === "script") return { path: value.trim(), args: (extra.scriptArgs || "").trim() };
  if (type === "volume_up" || type === "volume_down") {
    return {
      step: percent(value),
      target: normalizeVolumeTarget(extra.volumeTarget || "master"),
      use_knob_direction: control.type.includes("knob"),
    };
  }
  if (type === "volume_set") {
    return { knob_mode: "auto", invert: false, target: normalizeVolumeTarget(extra.volumeTarget || value || "master") };
  }
  return {};
}

export function valueFrom(mapping?: Mapping) {
  const params = mapping?.action.params ?? {};
  const type = mapping?.action.type;

  if (type === "key") return String(params.combo ?? "");
  if (type === "macro" && Array.isArray(params.steps)) {
    return params.steps.map((step) => String((step as { combo?: unknown }).combo ?? "")).join("\n");
  }
  if (type === "app_launch" || type === "script") return String(params.path ?? "");
  if (type === "command") return String(params.command ?? "");
  if (type === "volume_up" || type === "volume_down") return String(Math.round(Number(params.step ?? 0.04) * 100));
  if (type === "volume_set") return String(params.target ?? "master");
  return "";
}

export function triggerFrom(mapping?: Mapping, control?: Control): TriggerMode {
  const raw = String(mapping?.trigger || "").toLowerCase();
  if (raw === "release" || raw === "hold" || raw === "double" || raw === "press") return raw;
  if (control && isContinuous(control.type)) return "press";
  return "press";
}

export function triggerOptionsFor(control: Control) {
  if (isContinuous(control.type)) {
    return [{ value: "press" as const, label: "Enquanto mexe" }];
  }
  return [
    { value: "press" as const, label: "Tap (toque simples)" },
    { value: "double" as const, label: "Double tap" },
    { value: "release" as const, label: "Ao soltar" },
    { value: "hold" as const, label: "Segurar (hold)" },
  ];
}

export function scriptArgsFrom(mapping?: Mapping) {
  return mapping?.action.type === "script" ? String(mapping.action.params.args ?? "") : "";
}

export function volumeTargetFrom(mapping?: Mapping) {
  const type = mapping?.action.type;
  if (type !== "volume_set" && type !== "volume_up" && type !== "volume_down") return "master";
  return normalizeVolumeTarget(String(mapping?.action.params.target ?? "master"));
}

export const splitValue = (value: string) => value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
export const percent = (value: string) => Math.max(0.1, Number(value) || 4) / 100;
export const needsValue = (type: string) => !["media_play", "media_next", "media_prev", "volume_mute"].includes(type);
export function optionLabelFor(type: string) {
  return optionLabel(type);
}

function isContinuous(type: string) {
  return type.includes("knob") || type === "pitch_bend" || type === "fader";
}

function options(...types: string[]): Option[] {
  return types.map((type) => ({ type, label: optionLabel(type) }));
}

export { actionExamples, actionHelp, placeholderFor, valueLabel };
