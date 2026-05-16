import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Control } from '../../types/models';
import './PadControl.css';

export function PadControl({
  control,
  selected,
  mapped,
  onSelect,
}: {
  control: Control;
  selected: boolean;
  mapped: boolean;
  onSelect: () => void;
}) {
  const note = (control.params as { note?: number })?.note;
  return (
    <motion.button
      type="button"
      className={clsx('pad', selected && 'pad--selected', mapped && 'pad--mapped')}
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
    >
      <span className="pad__top">
        <span className="pad__id">{control.name}</span>
        {mapped ? <span className="pad__dot" /> : null}
      </span>
      <span className="pad__note">{note != null ? noteName(note) : ''}</span>
      <span className="pad__glow" />
    </motion.button>
  );
}

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function noteName(note: number) {
  return `${NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}
