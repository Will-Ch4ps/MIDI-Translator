import { useEffect, useMemo, useState } from "react";
import type { AppState } from "../../state/useApp";
import type { Bootstrap } from "../../lib/types";
import { BANKS, buildModel, indexMappings, type Bank } from "../../lib/layout";
import { PadGrid } from "./PadGrid";
import { Knobs } from "./Knobs";
import { Buttons } from "./Buttons";
import { Piano } from "./Piano";
import { Inspector } from "../inspector/Inspector";
import "./map.css";

type Props = { app: AppState; data: Bootstrap };

export function MapView({ app, data }: Props) {
  const model = useMemo(() => buildModel(data.layout.controls), [data.layout.controls]);
  const index = useMemo(() => indexMappings(data.profile.mappings), [data.profile.mappings]);
  const [bank, setBank] = useState<Bank>("A");
  const [selected, setSelected] = useState(() => model.pads.A[0]?.id ?? "");

  // Apertou um pad de outro banco no teclado → a tela vai para esse banco.
  useEffect(() => {
    if (app.midi.bank) setBank(app.midi.bank);
  }, [app.midi.bank]);

  // Tocou uma nota fora do piano desenhado (OCTAVE +/- no teclado) → a tela muda de oitava.
  const { start: base, count } = model.keyboard;
  const [octave, setOctave] = useState(0);
  const shiftOctave = (next: number) => setOctave(Math.max(-4, Math.min(4, next)));
  useEffect(() => {
    const note = app.midi.lastNote;
    if (note === null) return;
    setOctave((current) => {
      const low = base + current * 12;
      const high = low + count - 1;
      if (note < low) return Math.max(-4, current - Math.ceil((low - note) / 12));
      if (note > high) return Math.min(4, current + Math.ceil((note - high) / 12));
      return current;
    });
  }, [app.midi.noteSeq, app.midi.lastNote, base, count]);

  const control = model.byId.get(selected);
  const mappedCount = new Set(data.profile.mappings.map((m) => m.control_id)).size;
  const bankCount = (b: Bank) => model.pads[b].filter((pad) => index.has(pad.id)).length;
  const live = { active: app.midi.active, selected, onSelect: setSelected };

  return (
    <main className="map">
      <section className="map__device" aria-label="Controlador">
        <div className="map__title">
          <div>
            <h1>{data.layout.name}</h1>
            <p className="muted">{mappedCount} controles vinculados · clique em qualquer um para configurar</p>
          </div>
          <div className="banks" role="group" aria-label="Banco de pads">
            <span className="banks__label">Banco</span>
            {BANKS.map((b) => (
              <button
                key={b}
                type="button"
                className={`banks__item${b === bank ? " is-on" : ""}`}
                aria-pressed={b === bank}
                onClick={() => setBank(b)}
              >
                {b}
                <span className="banks__count">{bankCount(b)}/{model.pads[b].length}</span>
              </button>
            ))}
          </div>
        </div>

        <PadGrid pads={model.pads[bank]} bank={bank} index={index} {...live} />
        <div className="map__row">
          <Knobs knobs={model.knobs} values={app.midi.knobs} index={index} {...live} />
          <Buttons buttons={model.buttons} extras={model.extras} switches={app.midi.switches} index={index} {...live} />
        </div>
        <Piano start={base + octave * 12} count={count} octave={octave} onOctave={shiftOctave} index={index} {...live} />
      </section>

      {control ? (
        <Inspector key={control.id} control={control} mappings={index.get(control.id) ?? []} app={app} />
      ) : (
        <aside className="inspector inspector--empty">
          <p className="muted">Clique num pad, knob, botão ou tecla para configurar.</p>
        </aside>
      )}
    </main>
  );
}
