import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Disc3,
  Sliders,
  Music2,
  ToggleRight,
  ArrowLeft,
  ArrowRight,
  Save,
  Square,
  Plug,
} from 'lucide-react';
import { Dialog, Button, Input, Field, Badge } from '../../design';
import { backend, invokeBackend, isTauri } from '../../lib/backend';
import { useApp } from '../../state/store';
import './LearnWizard.css';

type Phase = 'setup' | 'pads' | 'knobs' | 'keys' | 'buttons' | 'special' | 'review';

type CapturedControl = {
  id: string;
  name: string;
  kind: string;
  signature: string | null;
  group: string;
};

const STEPS: { id: Phase; title: string; hint: string }[] = [
  { id: 'setup', title: 'Conectar', hint: 'Escolha a porta MIDI e dê um nome ao controlador' },
  { id: 'pads', title: 'Pads', hint: 'Bata em cada pad. Velocity variando = pad confirmado.' },
  { id: 'knobs', title: 'Knobs e faders', hint: 'Gire cada knob de ponta a ponta.' },
  { id: 'keys', title: 'Teclado', hint: 'Toque a tecla mais grave e a mais aguda.' },
  { id: 'buttons', title: 'Botões', hint: 'Aperte os botões físicos uma vez cada.' },
  { id: 'special', title: 'Pitch & Sustain', hint: 'Mexa o pitch bend e o pedal de sustain.' },
  { id: 'review', title: 'Revisão', hint: 'Confira tudo e salve o device.' },
];

export function LearnWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ports = useApp((s) => s.midiInputPorts);
  const bootstrap = useApp((s) => s.bootstrap);
  const [phase, setPhase] = useState<Phase>('setup');
  const [deviceName, setDeviceName] = useState('Meu controlador');
  const [deviceId, setDeviceId] = useState('meu-controlador');
  const [port, setPort] = useState<string>(ports[0] ?? '');
  const [captured, setCaptured] = useState<CapturedControl[]>([]);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    if (!open) {
      setPhase('setup');
      setCaptured([]);
      setListening(false);
    }
  }, [open]);

  useEffect(() => {
    if (!ports.length || port) return;
    setPort(ports[0]!);
  }, [ports, port]);

  useEffect(() => {
    if (!listening) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const snap = await invokeBackend<{ controls: CapturedControl[] }>('learn_snapshot');
        if (!cancelled) setCaptured(snap.controls);
      } catch (error) {
        console.warn('learn_snapshot falhou', error);
      }
    };
    const id = window.setInterval(tick, 700);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [listening]);

  const startListening = useCallback(async () => {
    if (!port && isTauri()) return;
    try {
      if (isTauri() && port) {
        await backend.startListener(port);
      }
      await invokeBackend('learn_start', { device_id: deviceId, device_name: deviceName });
      setListening(true);
      setPhase('pads');
    } catch (error) {
      console.error('learn start failed', error);
      setListening(false);
    }
  }, [port, deviceId, deviceName]);

  const stopListening = useCallback(async () => {
    try {
      await invokeBackend('learn_stop');
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const advance = useCallback(async () => {
    const idx = STEPS.findIndex((step) => step.id === phase);
    const next = STEPS[Math.min(idx + 1, STEPS.length - 1)];
    if (!next) return;
    if (listening) {
      try {
        await invokeBackend('learn_advance');
      } catch {
        /* ignore */
      }
    }
    setPhase(next.id);
  }, [phase, listening]);

  const finalize = useCallback(async () => {
    try {
      await invokeBackend('learn_finalize');
      await bootstrap();
      onClose();
    } catch (error) {
      console.error('learn finalize failed', error);
    }
  }, [bootstrap, onClose]);

  const progress = useMemo(() => {
    const idx = STEPS.findIndex((step) => step.id === phase);
    return ((idx + 1) / STEPS.length) * 100;
  }, [phase]);

  const counts = useMemo(() => bucketByKind(captured), [captured]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && listening) void stopListening();
        if (!value) onClose();
      }}
      title="Adicionar controlador MIDI"
      description="Aprenda automaticamente onde estão pads, knobs, teclas e botões"
      size="xl"
    >
      <div className="lw">
        <aside className="lw__steps">
          {STEPS.map((step, idx) => {
            const current = step.id === phase;
            const passed = STEPS.findIndex((s) => s.id === phase) > idx;
            return (
              <div
                key={step.id}
                className={`lw__step ${current ? 'lw__step--current' : ''} ${passed ? 'lw__step--passed' : ''}`}
              >
                <span className="lw__step-index">{idx + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <span>{step.hint}</span>
                </div>
              </div>
            );
          })}
        </aside>

        <main className="lw__main">
          <div className="lw__progress">
            <motion.div className="lw__progress-bar" animate={{ width: `${progress}%` }} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              className="lw__panel"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {phase === 'setup' ? (
                <SetupPanel
                  deviceName={deviceName}
                  setDeviceName={setDeviceName}
                  deviceId={deviceId}
                  setDeviceId={setDeviceId}
                  port={port}
                  setPort={setPort}
                  ports={ports}
                />
              ) : phase === 'review' ? (
                <ReviewPanel captured={captured} counts={counts} />
              ) : (
                <CapturePanel
                  phase={phase}
                  counts={counts}
                  captured={captured}
                  listening={listening}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <footer className="lw__footer">
            <Button variant="ghost" onClick={() => void stopListening().then(onClose)}>
              Cancelar
            </Button>
            <div className="lw__footer-actions">
              {phase === 'setup' ? (
                <Button variant="primary" icon={<Plug size={14} />} onClick={() => void startListening()}>
                  Começar captura
                </Button>
              ) : phase === 'review' ? (
                <Button variant="primary" icon={<Save size={14} />} onClick={() => void finalize()}>
                  Salvar device
                </Button>
              ) : (
                <Button variant="secondary" icon={<ArrowRight size={14} />} onClick={() => void advance()}>
                  Próximo
                </Button>
              )}
              {listening ? (
                <Button variant="danger" icon={<Square size={14} />} onClick={() => void stopListening()}>
                  Parar
                </Button>
              ) : null}
            </div>
          </footer>
        </main>
      </div>
    </Dialog>
  );
}

function SetupPanel({
  deviceName,
  setDeviceName,
  deviceId,
  setDeviceId,
  port,
  setPort,
  ports,
}: {
  deviceName: string;
  setDeviceName: (v: string) => void;
  deviceId: string;
  setDeviceId: (v: string) => void;
  port: string;
  setPort: (v: string) => void;
  ports: string[];
}) {
  return (
    <div className="lw__form">
      <Field label="Nome do controlador">
        <Input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} icon={<Cpu />} />
      </Field>
      <Field label="ID curto (slug)" hint="usado pra arquivo JSON e referência interna">
        <Input
          value={deviceId}
          onChange={(event) => setDeviceId(event.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-'))}
        />
      </Field>
      <Field label="Porta MIDI" hint={ports.length === 0 ? 'Nenhuma porta detectada — conecte o cabo USB.' : ''}>
        {ports.length > 0 ? (
          <div className="lw__ports">
            {ports.map((portName) => (
              <button
                key={portName}
                type="button"
                className={`lw__port ${port === portName ? 'lw__port--active' : ''}`}
                onClick={() => setPort(portName)}
              >
                {portName}
              </button>
            ))}
          </div>
        ) : (
          <span className="lw__muted">Sem portas disponíveis no momento.</span>
        )}
      </Field>
    </div>
  );
}

function CapturePanel({
  phase,
  counts,
  captured,
  listening,
}: {
  phase: Phase;
  counts: Record<string, number>;
  captured: CapturedControl[];
  listening: boolean;
}) {
  const step = STEPS.find((s) => s.id === phase);
  const filtered = captured.filter((c) => belongs(c.kind, phase));
  return (
    <div className="lw__capture">
      <div className="lw__capture-head">
        <Badge tone={listening ? 'success' : 'warning'} icon={listening ? <Plug /> : <Square />}>
          {listening ? 'Escutando' : 'Pausado'}
        </Badge>
        <h3>{step?.title}</h3>
        <p>{step?.hint}</p>
      </div>
      <div className="lw__capture-stats">
        <StatCard icon={<Disc3 size={14} />} label="Pads" value={counts.pad ?? 0} />
        <StatCard icon={<Sliders size={14} />} label="Knobs" value={(counts.knob_abs ?? 0) + (counts.knob_rel ?? 0)} />
        <StatCard icon={<Music2 size={14} />} label="Teclas" value={counts.key ?? 0} />
        <StatCard icon={<ToggleRight size={14} />} label="Botões" value={(counts.button_toggle ?? 0) + (counts.button_momentary ?? 0)} />
      </div>
      <div className="lw__capture-list">
        {filtered.length === 0 ? (
          <div className="lw__capture-empty">
            Esperando MIDI…
            {listening ? <span className="dot dot-green dot-pulse" /> : null}
          </div>
        ) : (
          filtered.map((control) => (
            <motion.div
              key={control.id}
              className="lw__capture-row"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="lw__capture-kind">{control.kind}</span>
              <span className="lw__capture-name">{control.name}</span>
              <code className="lw__capture-sig">{control.signature ?? '—'}</code>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function ReviewPanel({ captured, counts }: { captured: CapturedControl[]; counts: Record<string, number> }) {
  return (
    <div className="lw__review">
      <h3>Revisar device</h3>
      <p>Confira os controles detectados antes de salvar.</p>
      <div className="lw__capture-stats">
        <StatCard icon={<Disc3 size={14} />} label="Pads" value={counts.pad ?? 0} />
        <StatCard icon={<Sliders size={14} />} label="Knobs/Faders" value={(counts.knob_abs ?? 0) + (counts.knob_rel ?? 0) + (counts.fader ?? 0)} />
        <StatCard icon={<Music2 size={14} />} label="Teclas" value={counts.key ?? 0} />
        <StatCard icon={<ToggleRight size={14} />} label="Botões" value={(counts.button_toggle ?? 0) + (counts.button_momentary ?? 0)} />
      </div>
      <div className="lw__review-grid">
        {captured.map((control) => (
          <div key={control.id} className="lw__review-card">
            <span>{control.name}</span>
            <code>{control.signature}</code>
            <Badge tone="neutral" size="sm">{control.kind}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="lw__stat">
      <span className="lw__stat-icon">{icon}</span>
      <span className="lw__stat-value">{value}</span>
      <span className="lw__stat-label">{label}</span>
    </div>
  );
}

function bucketByKind(controls: CapturedControl[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const control of controls) {
    out[control.kind] = (out[control.kind] ?? 0) + 1;
  }
  return out;
}

function belongs(kind: string, phase: Phase): boolean {
  if (phase === 'pads') return kind === 'pad';
  if (phase === 'knobs') return kind === 'knob_abs' || kind === 'knob_rel' || kind === 'fader';
  if (phase === 'keys') return kind === 'key';
  if (phase === 'buttons') return kind === 'button_toggle' || kind === 'button_momentary' || kind === 'button_trigger';
  if (phase === 'special') return kind === 'pitch' || kind === 'sustain';
  return true;
}

export { ArrowLeft }; // silence unused import warning if needed
