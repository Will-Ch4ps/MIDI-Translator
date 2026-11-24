/** Estado ao vivo do teclado (só visual): o que está apertado, valor dos knobs, banco atual. */
import type { Bank } from "../lib/layout";
import type { RuntimeEvent } from "../lib/types";

export type MidiLive = {
  active: Set<string>;
  knobs: Record<string, number>;
  bank: Bank | null;
  octave: number;
};

export const initialMidi: MidiLive = { active: new Set(), knobs: {}, bank: null, octave: 0 };

export type MidiAction = { type: "event"; event: RuntimeEvent } | { type: "reset" };

export function midiReducer(state: MidiLive, action: MidiAction): MidiLive {
  if (action.type === "reset") return initialMidi;
  const event = action.event;

  if (event.type === "state") {
    return { ...state, bank: event.pad_bank, octave: event.octave };
  }
  if (event.type === "control") {
    const id = event.control_id;
    if (id.startsWith("KNOB_") || id === "MOD") {
      return { ...state, knobs: { ...state.knobs, [id]: event.value } };
    }
    return toggle(state, id, event.pressed);
  }
  if (event.type === "midi" && event.key_id) {
    return toggle(state, event.key_id, event.pressed);
  }
  return state;
}

function toggle(state: MidiLive, id: string, on: boolean): MidiLive {
  if (state.active.has(id) === on) return state;
  const active = new Set(state.active);
  if (on) active.add(id);
  else active.delete(id);
  return { ...state, active };
}
