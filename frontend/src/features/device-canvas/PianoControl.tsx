import { useMemo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Control } from '../../types/models';
import './PianoControl.css';

const BLACK_SET = new Set([1, 3, 6, 8, 10]);

export function PianoControl({
  keys,
  selectedId,
  mappedSet,
  onSelect,
}: {
  keys: Control[];
  selectedId: string | null;
  mappedSet: Set<string>;
  onSelect: (id: string) => void;
}) {
  const { whites, blacks, range } = useMemo(() => buildKeyboard(keys), [keys]);

  return (
    <div className="piano">
      <div className="piano__range font-mono">
        {range.first} — {range.last}
      </div>
      <div className="piano__board">
        <div className="piano__whites">
          {whites.map((white) => (
            <PianoKey
              key={white.id}
              control={white}
              variant="white"
              selected={selectedId === white.id}
              mapped={mappedSet.has(white.id)}
              onSelect={onSelect}
              flex={1}
            />
          ))}
        </div>
        <div className="piano__blacks">
          {blacks.map(({ control, leftPercent, widthPercent }) => (
            <div
              key={control.id}
              className="piano__black-wrap"
              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
            >
              <PianoKey
                control={control}
                variant="black"
                selected={selectedId === control.id}
                mapped={mappedSet.has(control.id)}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PianoKey({
  control,
  variant,
  selected,
  mapped,
  onSelect,
  flex,
}: {
  control: Control;
  variant: 'white' | 'black';
  selected: boolean;
  mapped: boolean;
  onSelect: (id: string) => void;
  flex?: number;
}) {
  const note = (control.params as { note?: number })?.note;
  const showLabel = note != null && note % 12 === 0;
  return (
    <motion.button
      type="button"
      className={clsx(
        'piano__key',
        `piano__key--${variant}`,
        selected && 'piano__key--selected',
        mapped && 'piano__key--mapped',
      )}
      style={flex ? { flex } : undefined}
      onClick={() => onSelect(control.id)}
      whileTap={{ y: 2 }}
      transition={{ duration: 0.08 }}
    >
      {mapped ? <span className="piano__key-dot" /> : null}
      {showLabel ? <span className="piano__key-label">{noteName(note)}</span> : null}
    </motion.button>
  );
}

function buildKeyboard(keys: Control[]) {
  const withNotes = keys
    .map((control) => ({ control, note: Number((control.params as { note?: number })?.note ?? -1) }))
    .filter((entry) => entry.note >= 0)
    .sort((a, b) => a.note - b.note);
  if (withNotes.length === 0) {
    return { whites: [] as Control[], blacks: [] as Array<{ control: Control; leftPercent: number; widthPercent: number }>, range: { first: '', last: '' } };
  }
  const firstNote = withNotes[0].note;
  const lastNote = withNotes[withNotes.length - 1].note;

  const whites = withNotes.filter((entry) => !BLACK_SET.has(entry.note % 12)).map((entry) => entry.control);
  const totalWhites = whites.length;

  const whitesIndex = new Map<number, number>();
  whites.forEach((control, idx) => {
    whitesIndex.set(Number((control.params as { note?: number })?.note ?? 0), idx);
  });

  const blacks = withNotes
    .filter((entry) => BLACK_SET.has(entry.note % 12))
    .map((entry) => {
      const previousWhite = whitesIndex.get(entry.note - 1) ?? 0;
      const leftPercent = ((previousWhite + 0.65) / totalWhites) * 100;
      const widthPercent = (0.7 / totalWhites) * 100;
      return { control: entry.control, leftPercent, widthPercent };
    });

  return {
    whites,
    blacks,
    range: { first: noteName(firstNote), last: noteName(lastNote) },
  };
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteName(note: number) {
  return `${NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}
