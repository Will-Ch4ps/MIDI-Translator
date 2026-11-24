import { useState } from "react";
import { Play } from "lucide-react";
import { isContinuous } from "../../lib/actions";
import { describe, triggerOf } from "../../lib/layout";
import type { Control, Mapping, Trigger } from "../../lib/types";
import type { AppState } from "../../state/useApp";
import { MappingEditor } from "./MappingEditor";
import "./inspector.css";

type Props = { control: Control; mappings: Mapping[]; app: AppState };

const TRIGGERS: { id: Trigger; label: string }[] = [
  { id: "press", label: "Ao tocar" },
  { id: "hold", label: "Segurar" },
  { id: "double", label: "Duplo" },
  { id: "release", label: "Ao soltar" },
];

export function Inspector({ control, mappings, app }: Props) {
  const continuous = isContinuous(control);
  const used = new Set(mappings.map(triggerOf));
  const [trigger, setTrigger] = useState<Trigger>(() => (used.has("press") || used.size === 0 ? "press" : [...used][0]));
  const current = mappings.find((m) => triggerOf(m) === trigger);
  const { title, detail } = describe(control);
  const [tested, setTested] = useState(false);

  const test = async () => {
    if (current && (await app.testAction(current.action, continuous))) {
      setTested(true);
      window.setTimeout(() => setTested(false), 1500);
    }
  };

  return (
    <aside className="inspector" aria-label="Configurar controle">
      <div className="inspector__head">
        <div className="inspector__titles">
          <div className="inspector__detail">{detail}</div>
          <h2 className="inspector__title">{current?.label || title}</h2>
        </div>
        {current && !continuous && (
          <button type="button" className="btn" onClick={() => void test()}>
            <Play size={14} aria-hidden="true" />
            {tested ? "Disparado" : "Testar"}
          </button>
        )}
      </div>

      {!continuous && (
        <div className="inspector__triggers">
          <span className="field">Quando disparar</span>
          <div className="seg" role="group" aria-label="Quando disparar">
            {TRIGGERS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`seg__item${t.id === trigger ? " is-on" : ""}`}
                aria-pressed={t.id === trigger}
                onClick={() => setTrigger(t.id)}
              >
                {t.label}
                {used.has(t.id) && <span className="seg__dot" aria-label="(tem ação)" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <MappingEditor
        key={`${control.id}:${trigger}`}
        control={control}
        mapping={current}
        trigger={trigger}
        continuous={continuous}
        app={app}
      />
    </aside>
  );
}
