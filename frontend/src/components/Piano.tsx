import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, WheelEvent as ReactWheelEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import type { Control, Mapping, MidiState } from "../types";
import { noteName } from "./deviceMapHelpers";

type Props = {
  keys: Control[];
  mappings: Mapping[];
  selectedId: string | null;
  midiState: MidiState;
  onSelect: (id: string) => void;
};

const BLACK_OFFSETS = new Set([1, 3, 6, 8, 10]);
const MIDI_MIN = 0;
const MIDI_MAX = 127;

const noteOf = (c: Control) => Number(c.params.note ?? 0);
const isBlack = (note: number) => BLACK_OFFSETS.has(((note % 12) + 12) % 12);

export function Piano({ keys, mappings, selectedId, midiState, onSelect }: Props) {
  const [keyWidth, setKeyWidth] = useState(46);
  const [viewStart, setViewStart] = useState(60); // C4

  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; start: number } | null>(null);

  const sorted = useMemo(
    () => [...keys].sort((a, b) => noteOf(a) - noteOf(b)),
    [keys],
  );

  const mapped = useMemo(
    () => new Set(mappings.map((m) => m.control_id)),
    [mappings],
  );

  const whites = useMemo(
    () => sorted.filter((k) => !isBlack(noteOf(k))),
    [sorted],
  );

  const blacks = useMemo(
    () => sorted.filter((k) => isBlack(noteOf(k))),
    [sorted],
  );

  const { octave, transpose } = midiState;
  const shift = octave * 12 + transpose;

  const activeArr = useMemo(() => [...midiState.activeKeys], [midiState.activeKeys]);
  const lastId = activeArr[activeArr.length - 1] ?? null;
  const lastCtrl = lastId ? sorted.find((k) => k.id === lastId) : null;

  const stageWidth = stageRef.current?.clientWidth || 800;
  const maxWhiteKeys = Math.max(1, Math.floor(stageWidth / keyWidth));
  const viewCount = Math.max(1, Math.min(maxWhiteKeys, 52));

  useEffect(() => {
    if (!lastCtrl || whites.length === 0) return;

    const note = noteOf(lastCtrl);
    let targetStart = note;

    while (targetStart > MIDI_MIN && isBlack(targetStart)) {
      targetStart--;
    }

    const targetWhiteIdx = whites.findIndex((k) => noteOf(k) >= targetStart);
    if (targetWhiteIdx < 0) return;

    const centerOffset = Math.floor(viewCount / 2);
    const maxStartIdx = Math.max(0, whites.length - viewCount);
    const newStartIdx = Math.max(0, Math.min(maxStartIdx, targetWhiteIdx - centerOffset));
    const newStart = noteOf(whites[newStartIdx]);

    setViewStart(newStart);
  }, [lastCtrl, viewCount, whites]);

  if (sorted.length === 0 || whites.length === 0) {
    return (
      <div className="piano-wrap2">
        <div className="piano-info">
          <span>🎹 Nenhuma tecla MIDI disponível no layout</span>
        </div>
      </div>
    );
  }

  const WH = 140;
  const BH = 88;
  const BW = keyWidth * 0.6;

  const startWhiteIdxRaw = whites.findIndex((k) => noteOf(k) >= viewStart);
  const startWhiteIdx = startWhiteIdxRaw >= 0 ? startWhiteIdxRaw : 0;
  const visibleWhites = whites.slice(startWhiteIdx, startWhiteIdx + viewCount);

  const firstWhiteNote = visibleWhites[0] ? noteOf(visibleWhites[0]) : noteOf(whites[0]);
  const lastWhiteNote = visibleWhites[visibleWhites.length - 1]
    ? noteOf(visibleWhites[visibleWhites.length - 1])
    : firstWhiteNote;

  const visibleBlacks = blacks.filter((k) => {
    const note = noteOf(k);
    return note >= firstWhiteNote - 1 && note <= lastWhiteNote + 1;
  });

  function blackLeft(note: number): number {
    const whitesBefore = visibleWhites.filter((w) => noteOf(w) < note).length;
    return whitesBefore * keyWidth - BW / 2 - 1;
  }

  function whiteIndex(note: number): number {
    return visibleWhites.findIndex((w) => noteOf(w) === note);
  }

  function scrollLeft() {
    const currentIdx = whites.findIndex((k) => noteOf(k) >= viewStart);
    const safeCurrent = currentIdx >= 0 ? currentIdx : 0;
    const newIdx = Math.max(0, safeCurrent - 7);
    setViewStart(noteOf(whites[newIdx]));
  }

  function scrollRight() {
    const currentIdx = whites.findIndex((k) => noteOf(k) >= viewStart);
    const safeCurrent = currentIdx >= 0 ? currentIdx : 0;
    const maxStartIdx = Math.max(0, whites.length - viewCount);
    const newIdx = Math.min(maxStartIdx, safeCurrent + 7);
    setViewStart(noteOf(whites[newIdx]));
  }

  function zoomIn() {
    setKeyWidth((w) => Math.min(64, w + 4));
  }

  function zoomOut() {
    setKeyWidth((w) => Math.max(24, w - 4));
  }

  function jumpToOctave(octaveNum: number) {
    const targetNote = (octaveNum + 1) * 12;
    const targetWhite = whites.find((k) => noteOf(k) >= targetNote);

    if (targetWhite) {
      setViewStart(noteOf(targetWhite));
    }
  }

  function onMouseDown(e: ReactMouseEvent) {
    dragRef.current = { x: e.clientX, start: viewStart };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function onMove(e: MouseEvent) {
    if (!dragRef.current) return;

    const deltaX = dragRef.current.x - e.clientX;
    const deltaWhites = Math.round(deltaX / keyWidth);
    const currentIdx = whites.findIndex((k) => noteOf(k) >= dragRef.current!.start);
    const safeCurrent = currentIdx >= 0 ? currentIdx : 0;
    const maxStartIdx = Math.max(0, whites.length - viewCount);
    const newIdx = Math.max(0, Math.min(maxStartIdx, safeCurrent + deltaWhites));

    setViewStart(noteOf(whites[newIdx]));
  }

  function onUp() {
    dragRef.current = null;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  }

  function onWheel(e: ReactWheelEvent) {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
      return;
    }

    const delta = e.deltaY > 0 ? 2 : -2;
    const currentIdx = whites.findIndex((k) => noteOf(k) >= viewStart);
    const safeCurrent = currentIdx >= 0 ? currentIdx : 0;
    const maxStartIdx = Math.max(0, whites.length - viewCount);
    const newIdx = Math.max(0, Math.min(maxStartIdx, safeCurrent + delta));

    setViewStart(noteOf(whites[newIdx]));
  }

  const effFirst = firstWhiteNote + shift;
  const effLast = lastWhiteNote + shift;

  return (
    <div className="piano-wrap2">
      {/* ── Controles ── */}
      <div className="piano-controls">
        <div className="piano-status2">
          <StatusChip label="RANGE" value={`${displayNoteName(effFirst)} – ${displayNoteName(effLast)}`} />
          <StatusChip label="OCTAVE" value={octave > 0 ? `+${octave}` : String(octave)} active={octave !== 0} />
          <StatusChip label="TRANSPOSE" value={`${transpose > 0 ? "+" : ""}${transpose}st`} active={transpose !== 0} />
          <StatusChip label="SHIFT" value={`${shift > 0 ? "+" : ""}${shift}st`} active={shift !== 0} accent />
          {lastCtrl && (
            <StatusChip label="TOCANDO" value={displayNoteName(noteOf(lastCtrl) + shift)} accent pulse />
          )}
        </div>

        <div className="piano-nav">
          <button className="piano-nav-btn" type="button" onClick={scrollLeft} title="Scroll esquerda (1 oitava)">
            <ChevronLeft size={16} />
          </button>
          <button className="piano-nav-btn" type="button" onClick={scrollRight} title="Scroll direita (1 oitava)">
            <ChevronRight size={16} />
          </button>
          <div className="piano-divider" />
          <button className="piano-nav-btn" type="button" onClick={zoomIn} title="Zoom in (Ctrl+Scroll)">
            <Maximize2 size={14} />
          </button>
          <button className="piano-nav-btn" type="button" onClick={zoomOut} title="Zoom out (Ctrl+Scroll)">
            <Minimize2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Atalhos de oitava ── */}
      <div className="octave-jumps">
        {[-1, 0, 1, 2, 3, 4, 5, 6, 7, 8].map((oct) => {
          const targetNote = (oct + 1) * 12;
          const isVisible = targetNote >= firstWhiteNote && targetNote <= lastWhiteNote;

          return (
            <button
              key={oct}
              className={`octave-jump ${isVisible ? "active" : ""}`}
              type="button"
              onClick={() => jumpToOctave(oct)}
            >
              C{oct}
            </button>
          );
        })}
      </div>

      {/* ── Teclado ── */}
      <div
        ref={stageRef}
        className="piano-stage"
        style={{ cursor: dragRef.current ? "grabbing" : "grab" }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
      >
        <div
          className="piano-keys2"
          style={{
            width: visibleWhites.length * keyWidth,
            height: WH,
            position: "relative",
          }}
        >
          {/* Teclas brancas */}
          {visibleWhites.map((key, idx) => {
            const note = noteOf(key);
            const effNote = note + shift;
            const isC = ((effNote % 12) + 12) % 12 === 0;
            const active = midiState.activeKeys.has(key.id);
            const sel = selectedId === key.id;
            const mp = mapped.has(key.id);

            return (
              <button
                key={key.id}
                className={`wkey ${sel ? "sel" : ""} ${mp ? "mp" : ""} ${active ? "on" : ""}`}
                style={{ left: idx * keyWidth, width: keyWidth - 1, height: WH }}
                title={`${displayNoteName(effNote)} (raw ${note})`}
                type="button"
                onClick={() => onSelect(key.id)}
              >
                {isC && <span className="wkey-label">{displayNoteName(effNote)}</span>}
              </button>
            );
          })}

          {/* Teclas pretas */}
          {visibleBlacks.map((key) => {
            const note = noteOf(key);
            const effNote = note + shift;
            const left = blackLeft(note);

            if (left < -BW || left > visibleWhites.length * keyWidth) return null;

            const active = midiState.activeKeys.has(key.id);
            const sel = selectedId === key.id;
            const mp = mapped.has(key.id);

            return (
              <button
                key={key.id}
                className={`bkey ${sel ? "sel" : ""} ${mp ? "mp" : ""} ${active ? "on" : ""}`}
                style={{ left, width: BW, height: BH, zIndex: 2 }}
                title={`${displayNoteName(effNote)} (raw ${note})`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(key.id);
                }}
              />
            );
          })}

          {/* ── Highlight da nota ativa ── */}
          {lastCtrl && (() => {
            const note = noteOf(lastCtrl);
            const black = isBlack(note);
            const wIdx = whiteIndex(note);
            const bLeft = black ? blackLeft(note) : null;

            if (!black && wIdx < 0) return null;
            if (black && (bLeft === null || bLeft < -BW || bLeft > visibleWhites.length * keyWidth)) return null;

            const effNote = note + shift;
            const label = displayNoteName(effNote);

            return (
              <div
                className={`note-flash ${black ? "note-flash-black" : "note-flash-white"}`}
                style={
                  black
                    ? { left: bLeft! + 1, width: BW - 2, top: 0, height: BH, zIndex: 5 }
                    : { left: wIdx * keyWidth + 1, width: keyWidth - 3, bottom: 0, height: 52, zIndex: 5 }
                }
              >
                <div className="note-flash-glow" />
                <span className="note-flash-label">{label}</span>
                <div className="note-flash-ring" />
                <div className="note-flash-pulse" />
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Marcadores de oitava ── */}
      <div className="piano-oct-row" style={{ width: visibleWhites.length * keyWidth }}>
        {visibleWhites
          .filter((k) => ((noteOf(k) + shift) % 12 + 12) % 12 === 0)
          .map((k) => {
            const note = noteOf(k);
            const wIdx = visibleWhites.findIndex((w) => noteOf(w) === note);
            const effNote = note + shift;
            const octNum = Math.floor(effNote / 12) - 1;

            return (
              <div key={k.id} className="piano-oct-mark" style={{ left: wIdx * keyWidth + keyWidth / 2 }}>
                <span className="oct-mark-note">{displayNoteName(effNote)}</span>
                <span className="oct-mark-num">Oct {octNum}</span>
              </div>
            );
          })}
      </div>

      {/* ── Info ── */}
      <div className="piano-info">
        <span>🎹 {visibleWhites.length} teclas visíveis</span>
        <span>📏 Largura: {keyWidth}px</span>
        <span>🎵 Range MIDI: {displayNoteName(MIDI_MIN)} ({MIDI_MIN}) até {displayNoteName(MIDI_MAX)} ({MIDI_MAX})</span>
        <span className="piano-hint">💡 Ctrl+Scroll para zoom • Arraste para navegar</span>
      </div>
    </div>
  );
}

function displayNoteName(note: number) {
  if (note < MIDI_MIN || note > MIDI_MAX) {
    return `${safeNoteName(note)}*`;
  }

  return noteName(note);
}

function safeNoteName(note: number) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const idx = ((note % 12) + 12) % 12;
  return `${names[idx]}${Math.floor(note / 12) - 1}`;
}

function StatusChip({
  label,
  value,
  active,
  accent,
  pulse,
}: {
  label: string;
  value: string;
  active?: boolean;
  accent?: boolean;
  pulse?: boolean;
}) {
  return (
    <div
      className={`pchip ${active ? "pchip-active" : ""} ${accent ? "pchip-accent" : ""} ${
        pulse ? "pchip-pulse" : ""
      }`}
    >
      <span className="pchip-label">{label}</span>
      <span className="pchip-value">{value}</span>
    </div>
  );
}
