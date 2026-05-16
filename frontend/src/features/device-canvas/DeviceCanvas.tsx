import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp, useActiveDevice } from '../../state/store';
import type { Control } from '../../types/models';
import { PadControl } from './PadControl';
import { KnobControl } from './KnobControl';
import { ButtonControl } from './ButtonControl';
import { PianoControl } from './PianoControl';
import { SpecialControl } from './SpecialControl';
import './DeviceCanvas.css';

const GRID = 56;

export function DeviceCanvas() {
  const device = useActiveDevice();
  const profile = useApp((s) => s.profile);
  const selectedId = useApp((s) => s.selectedControlId);
  const selectControl = useApp((s) => s.selectControl);
  const [size, setSize] = useState({ w: 800, h: 480 });
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const grouped = useMemo(() => {
    if (!device) return { pads: [], knobs: [], buttons: [], faders: [], keys: [], special: [] };
    const pads: Control[] = [];
    const knobs: Control[] = [];
    const buttons: Control[] = [];
    const faders: Control[] = [];
    const keys: Control[] = [];
    const special: Control[] = [];
    for (const control of device.controls) {
      if (control.kind === 'pad') pads.push(control);
      else if (control.kind === 'knob_abs' || control.kind === 'knob_rel') knobs.push(control);
      else if (control.kind === 'fader') faders.push(control);
      else if (control.kind === 'key') keys.push(control);
      else if (control.kind === 'pitch' || control.kind === 'sustain') special.push(control);
      else buttons.push(control);
    }
    return { pads, knobs, buttons, faders, keys, special };
  }, [device]);

  if (!device) {
    return (
      <div className="canvas canvas--empty">
        <div>
          <h3>Sem controlador ativo</h3>
          <p>Adicione um device em Controladores ou use o Wizard de Learn pra descobrir um MIDI.</p>
        </div>
      </div>
    );
  }

  const padBanks = bucketByBank(grouped.pads);
  const padBankNames = Object.keys(padBanks);

  const mappedSet = new Set(profile?.mappings.map((m) => m.control_id) ?? []);

  const worldW = 1280;
  const worldH = 600;
  const scale = Math.min(size.w / worldW, size.h / worldH, 1.4);

  return (
    <div className="canvas" ref={stageRef}>
      <div
        className="canvas__stage"
        style={{ width: worldW, height: worldH, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <div className="canvas__section canvas__section--special" style={{ left: 32, top: 32 }}>
          <h4 className="canvas__section-title">Pitch & Sustain</h4>
          <div className="canvas__special-wrap">
            {grouped.special.map((control) => (
              <SpecialControl
                key={control.id}
                control={control}
                selected={selectedId === control.id}
                mapped={mappedSet.has(control.id)}
                onSelect={() => selectControl(control.id)}
              />
            ))}
          </div>
        </div>

        {padBankNames.length > 0 ? (
          <div className="canvas__section canvas__section--pads" style={{ left: 220, top: 32 }}>
            <h4 className="canvas__section-title">Pads</h4>
            <div className="canvas__pad-banks">
              {padBankNames.map((bank) => (
                <div key={bank} className="canvas__pad-bank">
                  <span className="canvas__pad-bank-label">Banco {bank}</span>
                  <div className="canvas__pad-grid">
                    {padBanks[bank].map((control) => (
                      <PadControl
                        key={control.id}
                        control={control}
                        selected={selectedId === control.id}
                        mapped={mappedSet.has(control.id)}
                        onSelect={() => selectControl(control.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(grouped.knobs.length > 0 || grouped.buttons.length > 0) ? (
          <div className="canvas__section canvas__section--knobs" style={{ left: 760, top: 32 }}>
            <h4 className="canvas__section-title">Knobs & botões</h4>
            <div className="canvas__knob-row">
              {grouped.knobs.map((control) => (
                <KnobControl
                  key={control.id}
                  control={control}
                  selected={selectedId === control.id}
                  mapped={mappedSet.has(control.id)}
                  onSelect={() => selectControl(control.id)}
                />
              ))}
            </div>
            <div className="canvas__btn-row">
              {grouped.buttons.map((control) => (
                <ButtonControl
                  key={control.id}
                  control={control}
                  selected={selectedId === control.id}
                  mapped={mappedSet.has(control.id)}
                  onSelect={() => selectControl(control.id)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {grouped.keys.length > 0 ? (
          <div className="canvas__section canvas__section--keys" style={{ left: 32, top: 360, width: worldW - 64 }}>
            <h4 className="canvas__section-title">Teclado</h4>
            <PianoControl
              keys={grouped.keys}
              selectedId={selectedId}
              mappedSet={mappedSet}
              onSelect={selectControl}
            />
          </div>
        ) : null}
      </div>
      <CanvasGrid scale={scale} />
      {grouped.pads.length === 0 && grouped.knobs.length === 0 && grouped.keys.length === 0 ? (
        <div className="canvas__hint">Use o Wizard de Learn pra capturar controles</div>
      ) : (
        <div className="canvas__hint">
          Clique num pad, knob ou tecla pra editar o atalho
        </div>
      )}
    </div>
  );
}

function bucketByBank(pads: Control[]): Record<string, Control[]> {
  const banks: Record<string, Control[]> = {};
  for (const pad of pads) {
    const bank = String((pad.params as { bank?: string })?.bank ?? 'A').toUpperCase();
    (banks[bank] ?? (banks[bank] = [])).push(pad);
  }
  for (const bank of Object.keys(banks)) {
    banks[bank].sort((a, b) => {
      const aIdx = Number((a.params as { position?: number })?.position ?? 0);
      const bIdx = Number((b.params as { position?: number })?.position ?? 0);
      return aIdx - bIdx;
    });
  }
  return banks;
}

function CanvasGrid({ scale }: { scale: number }) {
  const spacing = GRID * scale;
  return (
    <svg className="canvas__grid" aria-hidden>
      <defs>
        <pattern id="dotgrid" width={spacing} height={spacing} patternUnits="userSpaceOnUse">
          <circle cx={1} cy={1} r={1} fill="rgba(255,255,255,0.05)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />
    </svg>
  );
}
