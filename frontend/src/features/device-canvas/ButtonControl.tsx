import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Control } from '../../types/models';
import './ButtonControl.css';

export function ButtonControl({
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
  return (
    <motion.button
      type="button"
      className={clsx('mbtn', selected && 'mbtn--selected', mapped && 'mbtn--mapped')}
      onClick={onSelect}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.96 }}
    >
      <span className="mbtn__led" />
      <span>{control.name}</span>
    </motion.button>
  );
}
