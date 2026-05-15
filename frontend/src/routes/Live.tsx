import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Gauge, Zap, Layers as LayersIcon } from 'lucide-react';
import { Card, CardTitle, CardDescription, Badge } from '../design';
import { useApp, useActiveDevice } from '../state/store';
import { useLiveTelemetry } from '../features/live-monitor/useLiveTelemetry';
import { LiveLog } from '../features/live-monitor/LiveLog';
import './Live.css';

export function LiveRoute() {
  const device = useActiveDevice();
  const profile = useApp((s) => s.profile);
  const activeLayer = profile?.layers.find((l) => l.id === profile.active_layer);
  const { entries, latency } = useLiveTelemetry();

  const recentControls = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) {
      if (entry.control) map.set(entry.control, (map.get(entry.control) ?? 0) + 1);
    }
    return map;
  }, [entries]);

  const fired = entries.filter((entry) => entry.kind === 'fired').length;
  const unmapped = entries.filter((entry) => entry.kind === 'unmapped').length;

  return (
    <div className="live">
      <header className="live__head">
        <div>
          <Badge tone="success" icon={<Activity />}>Tempo real</Badge>
          <h2>Live Monitor</h2>
          <p>{profile?.name ?? '—'} · device {device?.name ?? '—'} · layer {activeLayer?.name ?? 'default'}</p>
        </div>
      </header>

      <div className="live__metrics">
        <Card variant="elevated" padding="lg" glow>
          <span className="live__metric-label">
            <Gauge size={14} /> Latência
          </span>
          <motion.span
            key={latency.last}
            className="live__metric-value"
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
          >
            {latency.last}<span>ms</span>
          </motion.span>
          <span className="live__metric-sub">P50 {latency.p50}ms · P95 {latency.p95}ms</span>
        </Card>
        <Card variant="elevated" padding="lg">
          <span className="live__metric-label">
            <Zap size={14} /> Disparos
          </span>
          <span className="live__metric-value">{fired}<span>/{entries.length}</span></span>
          <span className="live__metric-sub">{unmapped} sem mapping</span>
        </Card>
        <Card variant="elevated" padding="lg">
          <span className="live__metric-label">
            <LayersIcon size={14} /> Layer ativa
          </span>
          <span className="live__metric-value live__metric-value--text">{activeLayer?.name ?? 'default'}</span>
          <span className="live__metric-sub">{profile?.mappings.length ?? 0} mappings carregados</span>
        </Card>
      </div>

      <div className="live__cols">
        <Card variant="surface" padding="md" className="live__map">
          <CardTitle>Mapa do device</CardTitle>
          <CardDescription>Heat por uso recente — controles tocados nos últimos 60s.</CardDescription>
          <div className="live__map-grid">
            {device?.controls.map((control) => {
              const count = recentControls.get(control.id) ?? 0;
              const intensity = Math.min(1, count / 6);
              return (
                <div
                  key={control.id}
                  className="live__map-cell"
                  style={{
                    background: count
                      ? `linear-gradient(140deg, rgba(124,92,255,${0.15 + intensity * 0.45}), rgba(124,92,255,${0.05 + intensity * 0.15}))`
                      : 'var(--elevated)',
                    borderColor: count ? 'rgba(124,92,255,0.45)' : 'var(--border)',
                  }}
                >
                  <span className="live__map-name">{control.name}</span>
                  <span className="live__map-count font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card variant="surface" padding="md" className="live__log-card">
          <CardTitle>Log de eventos</CardTitle>
          <CardDescription>Últimos 80 eventos MIDI / disparos / mappings sem destino.</CardDescription>
          <div className="live__log-scroll">
            <LiveLog entries={entries} />
          </div>
        </Card>
      </div>
    </div>
  );
}
