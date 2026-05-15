import { useEffect, useRef, useState } from 'react';
import { backend, isTauri } from '../../lib/backend';

export type LiveEntry = {
  id: number;
  kind: 'midi' | 'fired' | 'unmapped' | 'info' | 'error';
  signature: string;
  control?: string;
  action?: string;
  message?: string;
  ts: number;
};

export type Latency = { p50: number; p95: number; last: number };

const MAX_ENTRIES = 80;

export function useLiveTelemetry() {
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [latency, setLatency] = useState<Latency>({ p50: 0, p95: 0, last: 0 });
  const counter = useRef(0);
  const samples = useRef<number[]>([]);

  useEffect(() => {
    if (!isTauri) {
      const stop = startMockTelemetry((entry) => push(entry, samples.current, setEntries, counter, setLatency));
      return stop;
    }
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const { listen } = await import('@tauri-apps/api/event');
        unsubscribe = await listen<LiveEntry>('midi-runtime', (event) => {
          if (cancelled) return;
          push(event.payload, samples.current, setEntries, counter, setLatency);
        });
      } catch {
        const stop = startMockTelemetry((entry) =>
          push(entry, samples.current, setEntries, counter, setLatency),
        );
        unsubscribe = stop;
      }
      await backend.bootstrap().catch(() => undefined);
    })();
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { entries, latency };
}

function push(
  entry: LiveEntry,
  samples: number[],
  setEntries: (next: (cur: LiveEntry[]) => LiveEntry[]) => void,
  counter: { current: number },
  setLatency: (next: Latency) => void,
) {
  counter.current += 1;
  const stamped = { ...entry, id: counter.current, ts: entry.ts ?? Date.now() };
  setEntries((cur) => [stamped, ...cur].slice(0, MAX_ENTRIES));
  if (typeof entry.ts === 'number' && entry.ts > 0 && samples.length < 200) {
    const delta = Date.now() - entry.ts;
    if (Number.isFinite(delta) && delta >= 0 && delta < 5000) {
      samples.push(delta);
      if (samples.length > 200) samples.shift();
      setLatency(stats(samples));
    }
  }
}

function stats(values: number[]): Latency {
  if (values.length === 0) return { p50: 0, p95: 0, last: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    p50: sorted[Math.floor(sorted.length / 2)] ?? 0,
    p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0,
    last: values[values.length - 1] ?? 0,
  };
}

function startMockTelemetry(push: (entry: LiveEntry) => void): () => void {
  const signatures = ['note:9:36', 'note:9:37', 'cc:1:20', 'cc:1:21', 'note:9:38'];
  const controls = ['PAD_A1', 'PAD_A2', 'KNOB_1', 'KNOB_2', 'PAD_A3'];
  const actions = ['audio.volume.mute_toggle', 'audio.volume.set', 'core.key.combo', 'obs.scene.set'];

  const handle = window.setInterval(() => {
    const i = Math.floor(Math.random() * signatures.length);
    const kind = Math.random() < 0.55 ? 'midi' : Math.random() < 0.8 ? 'fired' : 'unmapped';
    push({
      id: 0,
      kind,
      signature: signatures[i] ?? 'note:0:60',
      control: controls[i] ?? '',
      action: kind === 'fired' ? actions[Math.floor(Math.random() * actions.length)] : undefined,
      ts: Date.now(),
    });
  }, 1200);
  return () => window.clearInterval(handle);
}
