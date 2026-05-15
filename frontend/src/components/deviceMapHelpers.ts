import type { Control, Mapping, MidiState } from "../types";

export function clsWithState(
  base: string,
  control: Control,
  selectedId: string | null,
  map: Map<string, Mapping>,
  midiState: MidiState,
) {
  const isSelected = selectedId === control.id;
  const isMapped = map.has(control.id);
  const isActive =
    midiState.activePads.has(control.id) ||
    midiState.activeButtons.has(control.id) ||
    midiState.activeKeys.has(control.id);

  return [base, isSelected ? "selected" : "", isMapped ? "mapped" : "", isActive ? "active" : ""]
    .filter(Boolean)
    .join(" ");
}

export function padLabel(control: Control) {
  const pos = numberParam(control, "position", 0) + 1;
  return `Pad ${String(pos).padStart(2, "0")}`;
}

export function buildKeysFromRange(control: Control) {
  const channel = numberParam(control, "channel", 1) - 1;
  const mappingRange = control.params.mapping_range;

  let start = numberParam(control, "start_note", 48);
  let count = numberParam(control, "count", 25);

  if (Array.isArray(mappingRange) && mappingRange.length >= 2) {
    start = Number(mappingRange[0]);
    const end = Number(mappingRange[1]);
    count = Math.max(0, end - start + 1);
  }

  return Array.from({ length: count }, (_, i) => {
    const note = start + i;
    return {
      id: `KEY_NOTE_${note}`,
      label: `Key ${noteName(note)}`,
      group: "keys",
      type: "keys_chromatic",
      params: { note, channel: channel + 1, source: "KEYBOARD", virtual: true },
      signature: `note:${channel}:${note}`,
    } as Control;
  });
}

export function mapLabel(mapping?: Mapping) {
  return mapping?.label || mapping?.action.type || "sem vínculo";
}

export function tabClass(base: string, group: string, tab: string) {
  if (group === "left") return tab === "keys" ? `${base} muted` : base;
  if (group === "keys") return tab === "all" || tab === "keys" || tab === "functions" ? base : `${base} muted`;
  if (tab === "all" || tab === group || (tab === "keys" && group === "functions")) return base;

  return `${base} muted`;
}

export function countByTab(
  map: Map<string, Mapping>,
  controls: Control[],
  pads: Control[],
  functionButtons: Control[],
  keyControls: Control[],
  specials: Array<Control | undefined>,
) {
  const controlsIds = controls
    .filter((c) => c.id.startsWith("KNOB_") || c.id.startsWith("BTN_"))
    .map((c) => c.id);

  const padIds = pads.map((c) => c.id);
  const keyIds = keyControls.map((c) => c.id);
  const fnIds = [
    ...functionButtons,
    ...specials.filter((c): c is Control => Boolean(c)),
  ].map((c) => c.id);

  return {
    all: map.size,
    controls: countMapped(controlsIds, map),
    pads: countMapped(padIds, map),
    keys: countMapped(keyIds, map),
    functions: countMapped(fnIds, map),
  };
}

function countMapped(ids: string[], map: Map<string, Mapping>) {
  return ids.filter((id) => map.has(id)).length;
}

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;

export function noteName(note: number) {
  const safeIndex = ((note % 12) + 12) % 12;
  return `${NOTE_NAMES[safeIndex]}${Math.floor(note / 12) - 1}`;
}

export function effectiveNote(note: number, octave: number, transpose: number) {
  return note + octave * 12 + transpose;
}

function numberParam(control: Control, key: string, fallback: number) {
  const value = control.params[key];

  if (Array.isArray(value)) {
    return Number(value[0] ?? fallback);
  }

  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}
