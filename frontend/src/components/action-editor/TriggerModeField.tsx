import type { Control } from "../../types";
import { triggerOptionsFor, type TriggerMode } from "./actionUtils";

type Props = {
  control: Control;
  value: TriggerMode;
  onChange: (mode: TriggerMode) => void;
};

export function TriggerModeField({ control, value, onChange }: Props) {
  const options = triggerOptionsFor(control);
  if (options.length <= 1) return null;

  return (
    <div className="field">
      <label>Quando disparar</label>
      <div className="example-row">
        {options.map((item) => (
          <button
            className={`example-chip ${value === item.value ? "selected" : ""}`}
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {value === "hold" && <small className="field-help">Hold dispara apos ~350ms segurando o controle.</small>}
      {value === "double" && <small className="field-help">Double tap espera um segundo toque rapido (~220ms).</small>}
    </div>
  );
}
