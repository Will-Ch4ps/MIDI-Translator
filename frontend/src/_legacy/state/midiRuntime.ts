import type { MidiRuntimeEvent, MidiState } from "../types";
import { defaultMidiState } from "../types";

export type MidiAction =
  | { type: "KNOB_CHANGE"; id: string; value: number }
  | { type: "PAD_DOWN"; id: string }
  | { type: "PAD_UP"; id: string }
  | { type: "BTN_DOWN"; id: string }
  | { type: "BTN_UP"; id: string }
  | { type: "KEY_DOWN"; id: string }
  | { type: "KEY_UP"; id: string }
  | { type: "SET_MODIFIERS"; octave: number; transpose: number; padBank: "A" | "B" | "C"; fullLevel: boolean; sustainActive: boolean }
  | { type: "SUSTAIN_CHANGE"; active: boolean }
  | { type: "RESET" };

export function midiReducer(state: MidiState, action: MidiAction): MidiState {
  switch (action.type) {
    case "KNOB_CHANGE":
      return { ...state, knobValues: { ...state.knobValues, [action.id]: action.value } };
    case "PAD_DOWN": return withSet(state, "activePads", action.id, true);
    case "PAD_UP": return withSet(state, "activePads", action.id, false);
    case "BTN_DOWN": return withSet(state, "activeButtons", action.id, true);
    case "BTN_UP": return withSet(state, "activeButtons", action.id, false);
    case "KEY_DOWN": return withSet(state, "activeKeys", action.id, true);
    case "KEY_UP": return withSet(state, "activeKeys", action.id, false);
    case "SET_MODIFIERS": return { ...state, ...action };
    case "SUSTAIN_CHANGE": return { ...state, sustainActive: action.active };
    case "RESET": return defaultMidiState();
    default: return state;
  }
}

type RuntimeSink = {
  setListenerRunning: (running: boolean) => void;
  setListenerStatus: (status: string) => void;
  dispatchMidi: (action: MidiAction) => void;
};

export function applyRuntimeEvent(event: MidiRuntimeEvent, sink: RuntimeSink) {
  if (event.type === "status") {
    if (event.status === "connected") {
      sink.setListenerRunning(true);
      sink.setListenerStatus(`escutando: ${event.port || "porta"}`);
    } else if (event.status === "disconnected") {
      sink.setListenerRunning(false);
      sink.setListenerStatus("listener parado");
    } else if (event.status === "error") {
      sink.setListenerRunning(false);
      sink.setListenerStatus(`erro: ${event.message || "falha"}`);
    }
    return;
  }

  if (event.type === "state") {
    sink.dispatchMidi({
      type: "SET_MODIFIERS",
      octave: event.octave,
      transpose: event.transpose,
      padBank: event.pad_bank,
      fullLevel: event.full_level,
      sustainActive: event.sustain_active,
    });
    return;
  }

  if (event.type === "control") {
    const id = event.control_id;
    if (id.startsWith("KNOB_") || id === "MOD") sink.dispatchMidi({ type: "KNOB_CHANGE", id, value: event.value });
    else if (id.startsWith("PAD_")) sink.dispatchMidi({ type: event.pressed ? "PAD_DOWN" : "PAD_UP", id });
    else if (id.startsWith("BTN_")) sink.dispatchMidi({ type: event.pressed ? "BTN_DOWN" : "BTN_UP", id });
    else if (id.startsWith("KEY_NOTE_")) sink.dispatchMidi({ type: event.pressed ? "KEY_DOWN" : "KEY_UP", id });
    else if (id === "SUSTAIN") sink.dispatchMidi({ type: "SUSTAIN_CHANGE", active: event.pressed });
    return;
  }

  if (event.type === "midi" && event.key_id) {
    sink.dispatchMidi({ type: event.pressed ? "KEY_DOWN" : "KEY_UP", id: event.key_id });
  }
}

function withSet(
  state: MidiState,
  key: "activePads" | "activeButtons" | "activeKeys",
  id: string,
  add: boolean,
): MidiState {
  const next = new Set(state[key]);
  if (add) next.add(id); else next.delete(id);
  return { ...state, [key]: next };
}
