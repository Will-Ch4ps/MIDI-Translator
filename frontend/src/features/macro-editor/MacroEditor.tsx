import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GripVertical,
  Keyboard as KeyIcon,
  Type,
  Timer,
  Trash2,
  Plus,
  Repeat,
  GitBranch,
  Play,
} from 'lucide-react';
import { Button, Card, Badge } from '../../design';
import './MacroEditor.css';

type StepKind = 'key' | 'text' | 'delay' | 'loop' | 'branch';
type Step = {
  id: string;
  kind: StepKind;
  combo?: string;
  text?: string;
  delay_ms?: number;
  repeat?: number;
  condition?: string;
};

const KIND_META: Record<StepKind, { label: string; icon: typeof KeyIcon; color: string }> = {
  key: { label: 'Tecla', icon: KeyIcon, color: 'var(--accent)' },
  text: { label: 'Texto', icon: Type, color: 'var(--cyan)' },
  delay: { label: 'Delay', icon: Timer, color: 'var(--amber)' },
  loop: { label: 'Loop', icon: Repeat, color: 'var(--green)' },
  branch: { label: 'Condição', icon: GitBranch, color: 'var(--red)' },
};

export function MacroEditor({ name = 'Nova macro' }: { name?: string }) {
  const [steps, setSteps] = useState<Step[]>([
    { id: '1', kind: 'key', combo: 'ctrl+s' },
    { id: '2', kind: 'delay', delay_ms: 300 },
    { id: '3', kind: 'text', text: 'Salvo!' },
  ]);

  const update = (id: string, patch: Partial<Step>) =>
    setSteps((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const remove = (id: string) => setSteps((all) => all.filter((s) => s.id !== id));

  const add = (kind: StepKind) => {
    setSteps((all) => [
      ...all,
      { id: String(Date.now()), kind, ...defaultsFor(kind) },
    ]);
  };

  return (
    <Card variant="elevated" padding="lg" className="macroeditor">
      <header className="macroeditor__head">
        <div>
          <Badge tone="accent">Macro</Badge>
          <h3>{name}</h3>
          <p>{steps.length} passos · arraste pra reordenar (em breve)</p>
        </div>
        <Button variant="primary" icon={<Play size={14} />}>Testar</Button>
      </header>

      <div className="macroeditor__timeline">
        <AnimatePresence>
          {steps.length === 0 ? (
            <motion.div key="empty" className="macroeditor__empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Macro vazia. Comece adicionando um passo abaixo.
            </motion.div>
          ) : (
            steps.map((step, idx) => (
              <motion.div
                key={step.id}
                layout
                className="macroeditor__step"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
              >
                <div className="macroeditor__rail">
                  <span className="macroeditor__rail-dot" style={{ background: KIND_META[step.kind].color }} />
                  {idx < steps.length - 1 ? <span className="macroeditor__rail-line" /> : null}
                </div>
                <StepCard step={step} onChange={(patch) => update(step.id, patch)} onRemove={() => remove(step.id)} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="macroeditor__add">
        <span>Adicionar passo:</span>
        {(Object.keys(KIND_META) as StepKind[]).map((kind) => {
          const Icon = KIND_META[kind].icon;
          return (
            <Button key={kind} size="sm" variant="ghost" icon={<Icon size={12} />} onClick={() => add(kind)}>
              {KIND_META[kind].label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}

function StepCard({
  step,
  onChange,
  onRemove,
}: {
  step: Step;
  onChange: (patch: Partial<Step>) => void;
  onRemove: () => void;
}) {
  const Icon = KIND_META[step.kind].icon;
  return (
    <div className="macroeditor__card">
      <button type="button" className="macroeditor__grip" aria-label="Arrastar">
        <GripVertical size={14} />
      </button>
      <span className="macroeditor__icon" style={{ background: `${KIND_META[step.kind].color}24`, color: KIND_META[step.kind].color }}>
        <Icon size={14} />
      </span>
      <div className="macroeditor__card-body">
        <span className="macroeditor__kind">{KIND_META[step.kind].label}</span>
        {step.kind === 'key' && (
          <input
            value={step.combo ?? ''}
            placeholder="ctrl+s, alt+tab…"
            onChange={(event) => onChange({ combo: event.target.value })}
          />
        )}
        {step.kind === 'text' && (
          <input
            value={step.text ?? ''}
            placeholder="texto literal"
            onChange={(event) => onChange({ text: event.target.value })}
          />
        )}
        {step.kind === 'delay' && (
          <input
            type="number"
            value={step.delay_ms ?? 0}
            min={0}
            max={60000}
            onChange={(event) => onChange({ delay_ms: parseInt(event.target.value || '0', 10) })}
          />
        )}
        {step.kind === 'loop' && (
          <input
            type="number"
            value={step.repeat ?? 2}
            min={1}
            max={100}
            onChange={(event) => onChange({ repeat: parseInt(event.target.value || '1', 10) })}
          />
        )}
        {step.kind === 'branch' && (
          <input
            value={step.condition ?? ''}
            placeholder="app=Photoshop"
            onChange={(event) => onChange({ condition: event.target.value })}
          />
        )}
      </div>
      <button type="button" className="macroeditor__remove" onClick={onRemove} aria-label="Remover">
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function defaultsFor(kind: StepKind): Partial<Step> {
  switch (kind) {
    case 'key':
      return { combo: '' };
    case 'text':
      return { text: '' };
    case 'delay':
      return { delay_ms: 200 };
    case 'loop':
      return { repeat: 2 };
    case 'branch':
      return { condition: '' };
  }
}
