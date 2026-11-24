import type { MappingIndex } from "../../lib/layout";
import type { Control } from "../../lib/types";
import { ControlTile } from "./ControlTile";

type Props = {
  buttons: Control[];
  extras: Control[];
  index: MappingIndex;
  active: Set<string>;
  selected: string;
  onSelect: (id: string) => void;
};

const EXTRA_NAME: Record<string, string> = { PITCH: "Pitch", MOD: "Mod", SUSTAIN: "Sustain" };

export function Buttons({ buttons, extras, index, active, selected, onSelect }: Props) {
  const tile = (control: Control, name: string) => (
    <ControlTile
      key={control.id}
      id={control.id}
      name={name}
      compact
      mappings={index.get(control.id) ?? []}
      selected={control.id === selected}
      hit={active.has(control.id)}
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
