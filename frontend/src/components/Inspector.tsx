import { Activity, Cpu, Hash, Info, Tag, Zap } from "lucide-react";
import { ActionEditor } from "./ActionEditor";
import type { Control, Mapping, MidiState } from "../types";
import { effectiveNote, noteName } from "./deviceMapHelpers";

type Props = {
  control: Control | null;
  mappings: Mapping[];
  midiState: MidiState;
  onDeleteMapping: (controlId: string, trigger?: string) => Promise<void>;
  onSaveMapping: (mapping: Mapping) => Promise<void>;
};

const MODIFIER_IDS = new Set([
  "PAD_BANK_BTN",
  "TRANSPOSE_DOWN",
  "TRANSPOSE_UP",
  "FULL_LEVEL",
  "OCTAVE_DOWN",
  "OCTAVE_UP",
]);

export function Inspector({ control, mappings, midiState, onDeleteMapping, onSaveMapping }: Props) {
  if (!control) {
    return (
      <aside className="inspector empty">
        <div className="inspector-empty-icon">
          <Cpu size={32} />
        </div>
        <strong>Nenhum controle selecionado</strong>
        <p>Clique em um knob, pad, botão ou tecla no mapa do dispositivo para configurar seu mapeamento.</p>
      </aside>
    );
  }

  const controlMappings = mappings.filter((m) => m.control_id === control.id);
  const mapping = pickPrimaryMapping(controlMappings);
  const isModifier = MODIFIER_IDS.has(control.id) || control.type === "button_internal";
  const isKey = control.id.startsWith("KEY_NOTE_");
  const isKnob = control.id.startsWith("KNOB_") || control.id === "MOD";
  const isPad = control.group === "pads";
  const isActive =
    midiState.activePads.has(control.id) ||
    midiState.activeButtons.has(control.id) ||
    midiState.activeKeys.has(control.id);

  const rawNote = isKey ? Number(control.params.note ?? 0) : null;
  const effNote =
    rawNote !== null
      ? effectiveNote(rawNote, midiState.octave, midiState.transpose)
      : null;

  const knobValue = isKnob ? (midiState.knobValues[control.id] ?? 0) : null;

  return (
    <aside className="inspector">
      {/* Cabeçalho */}
      <div className="inspector-header">
        <div className="inspector-header-left">
          <span className="eyebrow">{groupLabel(control.group)}</span>
          <h2>{control.label}</h2>
        </div>
        {isActive && (
          <div className="inspector-active-badge">
            <Activity size={11} />
            ATIVO
          </div>
        )}
      </div>

      {/* Detalhes técnicos */}
      <div className="detail-grid">
        <div className="detail-row">
          <span><Hash size={11} /> ID</span>
          <strong>{control.id}</strong>
        </div>
        <div className="detail-row">
          <span><Cpu size={11} /> Tipo</span>
          <strong>{control.type}</strong>
        </div>
        <div className="detail-row">
          <span><Zap size={11} /> Sinal</span>
          <strong className="mono">{control.signature || "interno"}</strong>
        </div>
        <div className="detail-row">
          <span><Tag size={11} /> Mapping</span>
          <strong className={mapping ? "mapped-label" : "unmapped-label"}>
            {mapping?.label || mapping?.action.type || "sem ação"}
          </strong>
        </div>
      </div>

      {/* Feedback de estado em tempo real */}
      {(isKey || isKnob || isPad) && (
        <div className="realtime-panel">
          <div className="realtime-title">
            <Activity size={11} />
            Estado em tempo real
          </div>
          <div className="realtime-grid">
            {isKey && rawNote !== null && (
              <>
                <div className="rt-item">
                  <span>Nota raw</span>
                  <strong className="mono">{rawNote}</strong>
                </div>
                <div className="rt-item">
                  <span>Nota efetiva</span>
                  <strong className="mono accent">
                    {noteName(effNote!)}
                    <em> ({effNote})</em>
                  </strong>
                </div>
                <div className="rt-item">
                  <span>Octave offset</span>
                  <strong className={`mono ${midiState.octave !== 0 ? "accent" : ""}`}>
                    {midiState.octave > 0 ? `+${midiState.octave}` : midiState.octave}
                  </strong>
                </div>
                <div className="rt-item">
                  <span>Transpose</span>
                  <strong className={`mono ${midiState.transpose !== 0 ? "accent" : ""}`}>
                    {midiState.transpose > 0 ? `+${midiState.transpose}` : midiState.transpose} st
                  </strong>
                </div>
              </>
            )}
            {isKnob && knobValue !== null && (
              <>
                <div className="rt-item">
                  <span>Valor CC</span>
                  <strong className="mono accent">{knobValue}</strong>
                </div>
                <div className="rt-item">
                  <span>Percentual</span>
                  <strong className="mono">{Math.round((knobValue / 127) * 100)}%</strong>
                </div>
                <div className="rt-item full">
                  <span>Posição</span>
                  <div className="knob-bar-wrap">
                    <div
                      className="knob-bar-fill"
                      style={{ width: `${(knobValue / 127) * 100}%` }}
                    />
                  </div>
                </div>
              </>
            )}
            {isPad && (
              <div className="rt-item">
                <span>Estado</span>
                <strong className={`mono ${isActive ? "accent" : ""}`}>
                  {isActive ? "● PRESSIONADO" : "○ solto"}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aviso para modificadores internos */}
      {isModifier && (
        <div className="modifier-info-box">
          <Info size={14} />
          <div>
            <strong>Controle interno do dispositivo</strong>
            <p>
              Este botão é um modificador de hardware. Ele altera os valores de nota enviados
              pelo teclado e pelos pads (octave, transpose, bank, full level) — não envia
              sinais MIDI mapeáveis e não aceita atalhos de teclado.
            </p>
          </div>
        </div>
      )}

      {/* Editor de ação — só para controles mapeáveis */}
      {!isModifier && (
        <ActionEditor
          control={control}
          mappings={controlMappings}
          onDelete={(trigger) => onDeleteMapping(control.id, trigger)}
          onSave={onSaveMapping}
        />
      )}
    </aside>
  );
}

function groupLabel(group: string) {
  const map: Record<string, string> = {
    keys: "Teclado MIDI",
    pads: "Pad",
    knobs: "Knob / Encoder",
    buttons: "Botão",
    faders: "Fader",
    special: "Controle especial",
  };
  return map[group] ?? "Controle";
}

function pickPrimaryMapping(mappings: Mapping[]) {
  const byPress = mappings.find((item) => (item.trigger || "press") === "press");
  return byPress || mappings[0];
}
