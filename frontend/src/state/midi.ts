/**
 * Estado ao vivo do teclado (só visual).
 *
 * O StarryKey não avisa banco nem oitava (os botões PAD BANK/OCTAVE são
 * internos ao teclado), e o evento "state" do backend sempre diz A/0.
 * Por isso deduzimos: o banco pelo pad que chega, a oitava pela nota tocada.
 */
import type { Bank } from "../lib/layout";
import type { RuntimeEvent } from "../lib/types";

export type MidiLive = {
  active: Set<string>;
  knobs: Record<string, number>;
  /** Último estado conhecido de botões liga/desliga (só depois de mexer neles). */
  switches: Record<string, boolean>;
  bank: Bank | null;
  lastNote: number | null;
  /** Muda a cada nota tocada, para a tela reagir mesmo se for a mesma nota. */
  noteSeq: number;
};

export const initialMidi: MidiLive = { active: new Set(), knobs: {}, switches: {}, bank: null, lastNote: null, noteSeq: 0 };

export type MidiAction = { type: "event"; event: RuntimeEvent } | { type: "reset" };

const PAD_ID = /^PAD_([ABC])\d+$/;
const SWITCH_ID = /^(BTN_|SUSTAIN$)/;

export function midiReducer(state: MidiLive, action: MidiAction): MidiLive {
  if (action.type === "reset") return initialMidi;
  const event = action.event;

  if (event.type === "control") {
    const id = event.control_id;
    if (id.startsWith("KNOB_") || id === "MOD") {
      return { ...state, knobs: { ...state.knobs, [id]: event.value } };
    }
    let next = toggle(state, id, event.pressed);
    const pad = PAD_ID.exec(id);
    if (pad && event.pressed && pad[1] !== next.bank) next = { ...next, bank: pad[1] as Bank };
    if (SWITCH_ID.test(id)) next = { ...next, switches: { ...next.switches, [id]: event.pressed } };
    if (id.startsWith("KEY_NOTE_") && event.pressed) next = playedNote(next, Number(id.slice(9)));
    return next;
  }
  if (event.type === "midi" && event.key_id) {
    const next = toggle(state, event.key_id, event.pressed);
    return event.pressed ? playedNote(next, Number(event.key_id.slice(9))) : next;
  }
  return state;
}

const playedNote = (state: MidiLive, note: number): MidiLive => ({ ...state, lastNote: note, noteSeq: state.noteSeq + 1 });

function toggle(state: MidiLive, id: string, on: boolean): MidiLive {
  if (state.active.has(id) === on) return state;
  const active = new Set(state.active);
  if (on) active.add(id);
  else active.delete(id);
  return { ...state, active };
}
