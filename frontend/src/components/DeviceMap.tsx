import { useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Control, DeviceLayout, Mapping, MidiState } from "../types";
import { buildKeysFromRange, clsWithState, countByTab, mapLabel, padLabel, tabClass } from "./deviceMapHelpers";
import { KnobWidget } from "./KnobWidget";
import { Piano } from "./Piano";

type Props = {
  layout: DeviceLayout;
  mappings: Mapping[];
  selectedId: string | null;
  midiState: MidiState;
  onSelect: (id: string) => void;
  onSwapControls: (sourceId: string, targetId: string) => Promise<void>;
};

const TABS = [
  ["all",      "Todos"],
  ["controls", "Knobs / Botoes"],
  ["pads",     "Pads"],
  ["keys",     "Teclado"],
] as const;

export function DeviceMap({ layout, mappings, selectedId, midiState, onSelect, onSwapControls }: Props) {
  const [focusTab,   setFocusTab]   = useState("all");
  const [activeBank, setActiveBank] = useState<"A"|"B"|"C">(midiState.padBank);
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSessionRef = useRef<{
    sourceId: string;
    pointerId: number;
    startX: number;
    startY: number;
    started: boolean;
  } | null>(null);
  const swapPendingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const controls        = layout.controls;
  const mappingByControl = new Map(mappings.map((m) => [m.control_id, m]));
  const find = (id: string) => controls.find((c) => c.id === id);

  const selected    = selectedId ? find(selectedId) : null;
  const selectedMap = selected ? mappingByControl.get(selected.id) : undefined;
  const knobs       = controls.filter((c) => c.id.startsWith("KNOB_"));
  const buttons     = controls.filter((c) => c.id.startsWith("BTN_"));
  const keyControls = controls.filter((c) => c.id.startsWith("KEY_NOTE_"));
  const keyboardRange = find("KEYBOARD");
  const sustain = find("SUSTAIN");
  const pitch   = find("PITCH");
  const mod     = find("MOD");

  // Segue o bank do hardware automaticamente
  useEffect(() => { setActiveBank(midiState.padBank); }, [midiState.padBank]);

  // Se um pad de outro bank for ativado, muda o bank visível
  useEffect(() => {
    for (const padId of midiState.activePads) {
      const match = padId.match(/^PAD_([ABC])\d+$/);
      if (match) {
        setActiveBank(match[1] as "A"|"B"|"C");
        break;
      }
    }
  }, [midiState.activePads]);

  const pads = controls
    .filter((c) => c.group === "pads" && c.params.bank === activeBank)
    .sort((a, b) => Number(a.params.position ?? 0) - Number(b.params.position ?? 0));

  const tabCounts = countByTab(mappingByControl, controls, pads, [], keyControls, [pitch, mod, sustain]);

  function familyOf(control: Control | undefined) {
    if (!control) return null;
    if (control.group === "pads") return "pad";
    if (control.id.startsWith("KNOB_")) return "knob";
    if (control.id.startsWith("BTN_")) return "button";
    return null;
  }

  function canSwap(sourceId: string | null, targetId: string) {
    if (!sourceId || sourceId === targetId) return false;
    const source = find(sourceId);
    const target = find(targetId);
    const sourceFamily = familyOf(source);
    const targetFamily = familyOf(target);
    return Boolean(sourceFamily && targetFamily && sourceFamily === targetFamily);
  }

  function resetDragState() {
    dragSessionRef.current = null;
    setDragSourceId(null);
    setDragOverId(null);
  }

  function controlIdFromPoint(clientX: number, clientY: number) {
    const element = document.elementFromPoint(clientX, clientY);
    if (!(element instanceof HTMLElement)) return null;
    const host = element.closest("[data-control-id]");
    if (!(host instanceof HTMLElement)) return null;
    return host.dataset.controlId || null;
  }

  function handlePointerDown(controlId: string, event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    if (!familyOf(find(controlId))) return;
    dragSessionRef.current = {
      sourceId: controlId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      started: false,
    };
    setDragSourceId(controlId);
    setDragOverId(null);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - session.startX, event.clientY - session.startY);
    if (!session.started && moved < 6) return;
    if (!session.started) {
      session.started = true;
      suppressClickRef.current = true;
    }
    const hoverId = controlIdFromPoint(event.clientX, event.clientY);
    setDragOverId(hoverId && canSwap(session.sourceId, hoverId) ? hoverId : null);
  }

  async function finishPointerDrag(event: PointerEvent<HTMLElement>) {
    const session = dragSessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const sourceId = session.sourceId;
    const targetId = dragOverId;
    const shouldSwap = Boolean(session.started && targetId && canSwap(sourceId, targetId));
    resetDragState();
    if (shouldSwap && !swapPendingRef.current && targetId) {
      swapPendingRef.current = true;
      try {
        await onSwapControls(sourceId, targetId);
      } finally {
        swapPendingRef.current = false;
      }
    }
  }

  function handlePointerCancel() {
    suppressClickRef.current = false;
    resetDragState();
  }

  function handleControlClick(controlId: string) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onSelect(controlId);
  }

  function handleShellPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!dragSessionRef.current) return;
    event.preventDefault();
    suppressClickRef.current = false;
    resetDragState();
  }

  return (
    <div className="device-shell" onPointerUp={handleShellPointerUp}>
      {/* HUD */}
      <header className="selection-hud">
        <div className="hud-left">
          <strong>{selected?.label || "Selecione um controle"}</strong>
          <span>{selected ? mapLabel(selectedMap) : "Clique no mapa para editar o controle"}</span>
        </div>
        <div className="hud-right">
          <div className="hud-badge">{mappings.length} mapeados</div>
          <div className="hud-badge accent">Bank {activeBank}</div>
          {midiState.fullLevel    && <div className="hud-badge warn">FULL LVL</div>}
          {midiState.sustainActive && <div className="hud-badge info">SUSTAIN</div>}
          {midiState.octave !== 0 && (
            <div className="hud-badge accent">
              OCT {midiState.octave > 0 ? `+${midiState.octave}` : midiState.octave}
            </div>
          )}
          {midiState.transpose !== 0 && (
            <div className="hud-badge accent">
              TRANS {midiState.transpose > 0 ? `+${midiState.transpose}` : midiState.transpose}st
            </div>
          )}
        </div>
      </header>

      {/* Tabs — sem "Funções" */}
      <nav className="input-tabs">
        {TABS.map(([id, label]) => (
          <button
            className={`tab-btn ${focusTab === id ? "active" : ""}`}
            key={id}
            type="button"
            onClick={() => setFocusTab(id)}
          >
            <span>{label}</span>
            <b>{tabCounts[id] ?? 0}</b>
          </button>
        ))}
      </nav>

      <div className="device-body">
        {/* Esquerda: knobs, botões, pads */}
        <section className={tabClass("device-left", "left", focusTab)}>

          {/* Knobs */}
          <div className={tabClass("zone", "controls", focusTab)}>
            <div className="zone-head">
              <span>Knobs</span><em>CC absoluto</em>
            </div>
            <div className="knob-row">
              {knobs.map((ctrl, i) => {
                const value      = midiState.knobValues[ctrl.id] ?? 0;
                const isSelected = selectedId === ctrl.id;
                const isMapped   = mappingByControl.has(ctrl.id);
                const isDragSource = dragSourceId === ctrl.id;
                const isDragOver = dragOverId === ctrl.id;
                return (
                  <button
                    className={`knob-cell ${isSelected ? "selected" : ""} ${isMapped ? "mapped" : ""} ${isDragSource ? "drag-source" : ""} ${isDragOver ? "drag-over" : ""}`}
                    key={ctrl.id}
                    type="button"
                    data-control-id={ctrl.id}
                    onClick={() => handleControlClick(ctrl.id)}
                    onPointerDown={(event) => handlePointerDown(ctrl.id, event)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(event) => void finishPointerDrag(event)}
                    onPointerCancel={handlePointerCancel}
                  >
                    <KnobWidget value={value} size={52} selected={isSelected} mapped={isMapped} />
                    <span className="knob-label">K{i + 1}</span>
                    <span className="knob-value">{value}</span>
                    <span className="knob-action">{mapLabel(mappingByControl.get(ctrl.id))}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botões */}
          <div className={tabClass("zone", "controls", focusTab)}>
            <div className="zone-head"><span>Botoes</span><em>momentary</em></div>
            <div className="btn-row">
              {buttons.map((ctrl, i) => {
                const isActive   = midiState.activeButtons.has(ctrl.id);
                const isSelected = selectedId === ctrl.id;
                const isMapped   = mappingByControl.has(ctrl.id);
                const isDragSource = dragSourceId === ctrl.id;
                const isDragOver = dragOverId === ctrl.id;
                return (
                  <button
                    className={`hw-btn ${isSelected ? "selected" : ""} ${isMapped ? "mapped" : ""} ${isActive ? "active" : ""} ${isDragSource ? "drag-source" : ""} ${isDragOver ? "drag-over" : ""}`}
                    key={ctrl.id}
                    type="button"
                    data-control-id={ctrl.id}
                    onClick={() => handleControlClick(ctrl.id)}
                    onPointerDown={(event) => handlePointerDown(ctrl.id, event)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(event) => void finishPointerDrag(event)}
                    onPointerCancel={handlePointerCancel}
                  >
                    <div className="hw-btn-led" />
                    <span className="hw-btn-id">B{i + 1}</span>
                    <span className="hw-btn-action">{mapLabel(mappingByControl.get(ctrl.id))}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pads — bank switcher inteligente */}
          <div className={tabClass("zone", "pads", focusTab)}>
            <div className="zone-head">
              <span>Pads — Bank {activeBank}</span>
              <div className="bank-switcher">
                {(["A","B","C"] as const).map((bank) => (
                  <button
                    className={`bank-chip ${activeBank === bank ? "active" : ""}`}
                    key={bank}
                    type="button"
                    onClick={() => setActiveBank(bank)}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
            <div className="pad-grid">
              {pads.map((ctrl) => {
                const isActive   = midiState.activePads.has(ctrl.id);
                const isSelected = selectedId === ctrl.id;
                const isMapped   = mappingByControl.has(ctrl.id);
                const isDragSource = dragSourceId === ctrl.id;
                const isDragOver = dragOverId === ctrl.id;
                return (
                  <button
                    className={`pad-cell ${isSelected ? "selected" : ""} ${isMapped ? "mapped" : ""} ${isActive ? "active" : ""} ${isDragSource ? "drag-source" : ""} ${isDragOver ? "drag-over" : ""}`}
                    key={ctrl.id}
                    type="button"
                    data-control-id={ctrl.id}
                    onClick={() => handleControlClick(ctrl.id)}
                    onPointerDown={(event) => handlePointerDown(ctrl.id, event)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(event) => void finishPointerDrag(event)}
                    onPointerCancel={handlePointerCancel}
                  >
                    <div className="pad-glow" />
                    <span className="pad-id">{padLabel(ctrl)}</span>
                    <span className="pad-note">note {Number(ctrl.params.note ?? 0)}</span>
                    <span className="pad-action">{mapLabel(mappingByControl.get(ctrl.id))}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </section>

        {/* Direita: teclado */}
        <section className={tabClass("device-right", "keys", focusTab)}>
          <div className="zone">
            <div className="zone-head">
              <span>Teclado MIDI</span>
              <div className="keyboard-badges">
                {pitch && (
                  <button
                    className={`wheel-badge ${clsWithState("", pitch, selectedId, mappingByControl, midiState)}`}
                    type="button"
                    onClick={() => onSelect(pitch.id)}
                  >Pitch</button>
                )}
                {mod && (
                  <button
                    className={`wheel-badge ${clsWithState("", mod, selectedId, mappingByControl, midiState)}`}
                    type="button"
                    onClick={() => onSelect(mod.id)}
                  >Mod {midiState.knobValues.MOD ?? 0}</button>
                )}
                <button
                  className={`wheel-badge ${sustain && midiState.sustainActive ? "active" : ""} ${sustain && mappingByControl.has(sustain.id) ? "mapped" : ""}`}
                  type="button"
                  onClick={() => sustain && onSelect(sustain.id)}
                >
                  Sustain {midiState.sustainActive ? "ON" : "OFF"}
                </button>
              </div>
            </div>

            {keyControls.length > 0 && (
              <Piano
                keys={keyControls}
                mappings={mappings}
                selectedId={selectedId}
                midiState={midiState}
                onSelect={onSelect}
              />
            )}
            {keyControls.length === 0 && keyboardRange && (
              <Piano
                keys={buildKeysFromRange(keyboardRange)}
                mappings={mappings}
                selectedId={selectedId}
                midiState={midiState}
                onSelect={onSelect}
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
