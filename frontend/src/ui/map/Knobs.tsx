import { KIND_TAG, kindOf } from "../../lib/actions";
import { primary, type MappingIndex } from "../../lib/layout";
import type { Control } from "../../lib/types";

type Props = {
  knobs: Control[];
  values: Record<string, number>;
  index: MappingIndex;
  selected: string;
  onSelect: (id: string) => void;
};

const R = 17;
const ARC = 2 * Math.PI * R * 0.75; // o anel ocupa 270°

export function Knobs({ knobs, values, index, selected, onSelect }: Props) {
  return (
    <div className="card map__knobs">
      <h2 className="card__title card__head">Knobs</h2>
      <div className="knobs">
        {knobs.map((knob, i) => {
          const main = primary(index.get(knob.id));
          const kind = kindOf(main);
          const level = (values[knob.id] ?? 0) / 127;
          const on = knob.id === selected;
          return (
            <button
              key={knob.id}
              type="button"
              className={`knob${on ? " is-selected" : ""}${main ? "" : " knob--free"}`}
              aria-pressed={on}
              aria-label={`Knob ${i + 1}: ${main?.label || "livre"}`}
              onClick={() => onSelect(knob.id)}
            >
              <svg width="48" height="48" viewBox="0 0 44 44" aria-hidden="true">
                <circle className="knob__track" cx="22" cy="22" r={R} strokeDasharray={`${ARC} 999`} />
                <circle className="knob__level" cx="22" cy="22" r={R} strokeDasharray={`${ARC * level} 999`} />
              </svg>
              <span className="knob__label">{main ? main.label || "Sem nome" : `Knob ${i + 1}`}</span>
              <span className="knob__sub">{kind ? KIND_TAG[kind] : "Livre"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
