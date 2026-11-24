import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { isBlackKey, keyId, noteName, type MappingIndex } from "../../lib/layout";

type Props = {
  start: number;
  count: number;
  octave: number;
  onOctave: (octave: number) => void;
  index: MappingIndex;
  active: Set<string>;
  selected: string;
  onSelect: (id: string) => void;
};

export function Piano({ start, count, octave, onOctave, index, active, selected, onSelect }: Props) {
  const notes = Array.from({ length: count }, (_, i) => start + i).filter((n) => n >= 0 && n <= 127);
  const whites = notes.filter((n) => !isBlackKey(n));
  const whiteWidth = 100 / whites.length;
  const mappedKeys = notes.filter((n) => index.has(keyId(n))).length;

  const key = (note: number, style?: CSSProperties) => {
    const id = keyId(note);
    const cls = [
      "key",
      isBlackKey(note) ? "key--black" : "key--white",
      index.has(id) && "is-mapped",
      id === selected && "is-selected",
      active.has(id) && "is-hit",
    ].filter(Boolean).join(" ");
    return (
      <button
        key={note}
        type="button"
        className={cls}
        style={style}
        aria-label={`Tecla ${noteName(note)}${index.has(id) ? ", com atalho" : ""}`}
        aria-pressed={id === selected}
        onClick={() => onSelect(id)}
      >
        {note % 12 === 0 && <span className="key__name">{noteName(note)}</span>}
      </button>
    );
  };

  return (
    <div className="card">
      <div className="card__head">
        <h2 className="card__title">Teclado · {notes.length} teclas</h2>
        <span className="hint">
          {mappedKeys > 0 ? `${mappedKeys} com atalho · ` : ""}Clique numa tecla para vincular um atalho.
        </span>
        <div className="octave" role="group" aria-label="Oitava mostrada">
          <button type="button" className="octave__btn" aria-label="Oitava abaixo" disabled={octave <= -4} onClick={() => onOctave(octave - 1)}>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span className="octave__label" title="Acompanha sozinho quando você toca fora da faixa">
            Oitava {octave > 0 ? `+${octave}` : octave}
          </span>
          <button type="button" className="octave__btn" aria-label="Oitava acima" disabled={octave >= 4} onClick={() => onOctave(octave + 1)}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="piano">
        <div className="piano__whites">{whites.map((note) => key(note))}</div>
        {notes.filter(isBlackKey).map((note) => {
          const whitesBefore = whites.filter((w) => w < note).length;
          return key(note, { left: `calc(${whitesBefore * whiteWidth}% - ${whiteWidth * 0.33}%)`, width: `${whiteWidth * 0.66}%` });
        })}
      </div>
    </div>
  );
}
