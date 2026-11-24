import type { MappingIndex } from "../../lib/layout";
import type { Control } from "../../lib/types";
import { ControlTile } from "./ControlTile";

type Props = {
  buttons: Control[];
  extras: Control[];
  switches: Record<string, boolean>;
  index: MappingIndex;
  active: Set<string>;
  selected: string;
  onSelect: (id: string) => void;
};

const EXTRA_NAME: Record<string, string> = { PITCH: "Pitch", MOD: "Mod", SUSTAIN: "Sustain" };

export function Buttons({ buttons, extras, switches, index, active, selected, onSelect }: Props) {
  const tile = (control: Control, name: string) => (
    <ControlTile
      key={control.id}
      id={control.id}
      name={name}
      compact
      mappings={index.get(control.id) ?? []}
      selected={control.id === selected}
      hit={control.type !== "button_toggle" && active.has(control.id)}
      switchOn={control.type === "button_toggle" ? switches[control.id] : undefined}
      onSelect={onSelect}
    />
  );

  return (
    <div className="card map__buttons">
      <h2 className="card__title card__head">Botões e extras</h2>
      <div className="buttons">
        {buttons.map((button) => tile(button, button.id.replace("BTN_", "")))}
        {extras.map((extra) => tile(extra, EXTRA_NAME[extra.id] ?? extra.label))}
      </div>
    </div>
  );
}
