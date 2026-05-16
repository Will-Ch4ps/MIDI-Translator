import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Control } from '../../types/models';
import './KnobControl.css';

export function KnobControl({
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
  const cc = (control.params as { cc?: number })?.cc ?? 0;
  return (
    <motion.button
      type="button"
      className={clsx('knob', selected && 'knob--selected', mapped && 'knob--mapped')}
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
    >
      <span className="knob__cap">
        <svg viewBox="0 0 64 64" className="knob__gauge" aria-hidden>
          <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.06)" strokeWidth="3" fill="none" />
          <circle
            cx="32"
            cy="32"
            r="26"
            stroke={mapped ? 'var(--accent)' : 'var(--text-muted)'}
            strokeWidth="3"
            strokeDasharray={mapped ? '40 200' : '20 200'}
            strokeDashoffset="-90"
            strokeLinecap="round"
            fill="none"
            transform="rotate(-90 32 32)"
            className="knob__gauge-arc"
          />
        </svg>
        <span className="knob__dot" />
      </span>
      <span className="knob__label">{control.name}</span>
      <span className="knob__cc">CC {cc}</span>
    </motion.button>
  );
}
