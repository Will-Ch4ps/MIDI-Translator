/** Quais gatilhos cada tipo de controle oferece, com nomes que fazem sentido para ele. */
import type { Control, Trigger } from "../../lib/types";

export type TriggerOption = { id: Trigger; label: string };

const PRESS_TRIGGERS: TriggerOption[] = [
  { id: "press", label: "Ao tocar" },
  { id: "hold", label: "Segurar" },
  { id: "double", label: "Duplo" },
  { id: "release", label: "Ao soltar" },
];

/** Botões A–D: ficam ligados ou desligados; a regra é "ao ligar" e "ao desligar". */
const SWITCH_TRIGGERS: TriggerOption[] = [
  { id: "press", label: "Ao ligar" },
  { id: "release", label: "Ao desligar" },
];

/** Pedal e botões momentâneos: apertou / soltou. */
const MOMENTARY_TRIGGERS: TriggerOption[] = [
  { id: "press", label: "Ao apertar" },
  { id: "release", label: "Ao soltar" },
];

export const isSwitch = (control: Control) => control.type === "button_toggle";

export function triggersFor(control: Control): TriggerOption[] {
  if (isSwitch(control)) return SWITCH_TRIGGERS;
  if (["button_momentary", "button_trigger", "sustain"].includes(control.type)) return MOMENTARY_TRIGGERS;
  return PRESS_TRIGGERS;
}
