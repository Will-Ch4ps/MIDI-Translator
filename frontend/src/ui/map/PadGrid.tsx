import type { Bank, MappingIndex } from "../../lib/layout";
import type { Control } from "../../lib/types";
import { ControlTile } from "./ControlTile";

type Props = {
  pads: Control[];
  bank: Bank;
  index: MappingIndex;
  active: Set<string>;
  selected: string;
  onSelect: (id: string) => void;
};

export function PadGrid({ pads, bank, index, active, selected, onSelect }: Props) {
  return (
    <div className="card">
      <div className="card__head">
        <h2 className="card__title">Pads · Banco {bank}</h2>
        <span className="hint">O botão PAD BANK do teclado troca o banco aqui também</span>
      </div>
      <div className="pads">
        {pads.map((pad, i) => (
          <ControlTile
            key={pad.id}
            id={pad.id}
            name={String(i + 1).padStart(2, "0")}
            mappings={index.get(pad.id) ?? []}
            selected={pad.id === selected}
            hit={active.has(pad.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
