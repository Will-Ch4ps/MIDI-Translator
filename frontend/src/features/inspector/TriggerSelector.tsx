import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Hand, Pointer, Timer, Repeat2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Mapping, TriggerMode } from '../../types/models';
import './TriggerSelector.css';

const TRIGGERS: Array<{ id: TriggerMode; label: string; icon: LucideIcon; hint: string }> = [
  { id: 'press', label: 'Pressionar', icon: Pointer, hint: 'ao tocar o controle' },
  { id: 'release', label: 'Soltar', icon: Hand, hint: 'ao soltar' },
  { id: 'hold', label: 'Segurar', icon: Timer, hint: '350ms+ pressionado' },
  { id: 'double', label: 'Duplo', icon: Repeat2, hint: 'duas batidas rápidas' },
];

export function TriggerSelector({
  activeTrigger,
  onChange,
  mappings,
}: {
  activeTrigger: TriggerMode;
  onChange: (trigger: TriggerMode) => void;
  mappings: Partial<Record<TriggerMode, Mapping>>;
}) {
  return (
    <div className="triggers">
      {TRIGGERS.map((trigger) => {
        const active = activeTrigger === trigger.id;
        const mapped = Boolean(mappings[trigger.id]);
        return (
          <button
            key={trigger.id}
            type="button"
            className={clsx('triggers__btn', active && 'triggers__btn--active', mapped && 'triggers__btn--mapped')}
            onClick={() => onChange(trigger.id)}
          >
            <trigger.icon size={14} strokeWidth={1.8} />
            <span className="triggers__label">{trigger.label}</span>
            <span className="triggers__hint">{trigger.hint}</span>
            {mapped ? <span className="triggers__dot" /> : null}
            {active ? <motion.span layoutId="trigger-active" className="triggers__active-bg" /> : null}
          </button>
        );
      })}
    </div>
  );
}
