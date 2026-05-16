import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Control } from '../../types/models';
import './SpecialControl.css';

export function SpecialControl({
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
  const isPitch = control.kind === 'pitch';
  return (
    <motion.button
      type="button"
      className={clsx(
        'special',
        `special--${control.kind}`,
        selected && 'special--selected',
        mapped && 'special--mapped',
      )}
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
    >
      <span className="special__bar">
        <span className="special__handle" />
      </span>
      <span className="special__label">{isPitch ? 'Pitch' : 'Sustain'}</span>
    </motion.button>
  );
}
