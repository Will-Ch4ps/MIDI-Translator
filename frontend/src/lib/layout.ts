/** Organiza os controles do layout (devices/starrykey25.json) nas seções da tela. */
import type { Control, Mapping, Trigger } from "./types";

export type Bank = "A" | "B" | "C";
export const BANKS: Bank[] = ["A", "B", "C"];

export type DeviceModel = {
  pads: Record<Bank, Control[]>;
  knobs: Control[];
  buttons: Control[];
  extras: Control[];
  keyboard: { start: number; count: number };
  byId: Map<string, Control>;
};

const num = (value: unknown, fallback = 0) => (typeof value === "number" ? value : fallback);

export function buildModel(controls: Control[]): DeviceModel {
  const pads: Record<Bank, Control[]> = { A: [], B: [], C: [] };
  for (const control of controls) {
    const bank = control.params.bank as Bank | undefined;
    if (control.type === "pad_bank" && bank && pads[bank]) pads[bank].push(control);
  }
  for (const bank of BANKS) pads[bank].sort((a, b) => num(a.params.position) - num(b.params.position));

  const keyboard = controls.find((control) => control.id === "KEYBOARD");
  return {
    pads,
    knobs: controls.filter((control) => control.id.startsWith("KNOB_")),
    buttons: controls.filter((control) => control.id.startsWith("BTN_")),
    extras: ["PITCH", "MOD", "SUSTAIN"]
      .map((id) => controls.find((control) => control.id === id))
      .filter((control): control is Control => Boolean(control)),
    keyboard: {
      start: num(keyboard?.params.start_note, 48),
      count: num(keyboard?.params.count, 25),
    },
    byId: new Map(controls.map((control) => [control.id, control])),
  };
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const noteName = (note: number) => `${NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
export const isBlackKey = (note: number) => [1, 3, 6, 8, 10].includes(note % 12);
export const keyId = (note: number) => `KEY_NOTE_${note}`;

/** Título e linha técnica do controle selecionado, para o painel lateral. */
export function describe(control: Control): { title: string; detail: string } {
  const p = control.params;
  if (control.type === "pad_bank") {
    const n = String(num(p.position) + 1).padStart(2, "0");
    return { title: `Pad ${n}`, detail: `PAD ${n} · BANCO ${p.bank} · NOTA ${p.note}` };
  }
  if (control.id.startsWith("KNOB_")) {
    return { title: `Knob ${control.id.slice(5)}`, detail: `KNOB ${control.id.slice(5)} · CC ${p.cc}` };
  }
  if (control.id.startsWith("BTN_")) {
    return { title: `Botão ${control.id.slice(4)}`, detail: `BOTÃO ${control.id.slice(4)} · CC ${p.cc}` };
  }
  if (control.id.startsWith("KEY_NOTE_")) {
    const note = Number(control.id.slice(9));
    return { title: `Tecla ${noteName(note)}`, detail: `TECLA · NOTA ${note}` };
  }
  const names: Record<string, string> = { PITCH: "Pitch bend", MOD: "Mod wheel", SUSTAIN: "Pedal sustain" };
  return { title: names[control.id] ?? control.label, detail: control.id };
}

export type MappingIndex = Map<string, Mapping[]>;

export function indexMappings(mappings: Mapping[]): MappingIndex {
  const index: MappingIndex = new Map();
  for (const mapping of mappings) {
    const list = index.get(mapping.control_id) ?? [];
    list.push(mapping);
    index.set(mapping.control_id, list);
  }
  return index;
}

export const triggerOf = (mapping: Mapping): Trigger => mapping.trigger ?? "press";

/** O vínculo "principal" de um controle: o de toque simples, senão o primeiro. */
export const primary = (list: Mapping[] = []) => list.find((m) => triggerOf(m) === "press") ?? list[0];
