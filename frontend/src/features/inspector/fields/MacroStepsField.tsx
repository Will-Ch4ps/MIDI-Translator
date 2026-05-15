import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, Type, Timer, Keyboard as KeyIcon } from 'lucide-react';
import { Button } from '../../../design';
import './MacroStepsField.css';

type Step = { kind: 'key' | 'text' | 'delay'; combo?: string; text?: string; delay_ms?: number };

export function MacroStepsField({
  value,
  onChange,
}: {
  value: unknown[];
  onChange: (value: Step[]) => void;
}) {
  const steps = (value as Step[]) || [];
  const [, setRerender] = useState(0);

  const update = (next: Step[]) => {
    onChange(next);
    setRerender((n) => n + 1);
  };

  return (
    <div className="macro">
      <AnimatePresence>
        {steps.length === 0 ? (
          <motion.p
            className="macro__empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Nenhum passo. Adicione tecla, texto ou delay.
          </motion.p>
        ) : null}
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            className="macro__row"
            layout
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            <span className="macro__handle">
              <GripVertical size={12} />
            </span>
            <span className="macro__icon">
              {step.kind === 'key' ? <KeyIcon size={14} /> : step.kind === 'text' ? <Type size={14} /> : <Timer size={14} />}
            </span>
            <input
              className="macro__input"
              value={step.kind === 'key' ? step.combo ?? '' : step.kind === 'text' ? step.text ?? '' : String(step.delay_ms ?? 0)}
              onChange={(event) => {
                const next = [...steps];
                if (step.kind === 'key') next[idx] = { ...step, combo: event.target.value };
                else if (step.kind === 'text') next[idx] = { ...step, text: event.target.value };
                else next[idx] = { ...step, delay_ms: parseInt(event.target.value || '0', 10) };
                update(next);
              }}
              placeholder={step.kind === 'key' ? 'ctrl+s' : step.kind === 'text' ? 'texto…' : 'ms'}
            />
            <button
              type="button"
              className="macro__remove"
              onClick={() => update(steps.filter((_, i) => i !== idx))}
              aria-label="Remover"
            >
              <Trash2 size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="macro__add">
        <Button size="sm" variant="ghost" icon={<KeyIcon size={12} />} onClick={() => update([...steps, { kind: 'key', combo: '' }])}>
          Tecla
        </Button>
        <Button size="sm" variant="ghost" icon={<Type size={12} />} onClick={() => update([...steps, { kind: 'text', text: '' }])}>
          Texto
        </Button>
        <Button size="sm" variant="ghost" icon={<Timer size={12} />} onClick={() => update([...steps, { kind: 'delay', delay_ms: 100 }])}>
          Delay
        </Button>
      </div>
    </div>
  );
}
