import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ChevronUp, Layers, Cpu, Gauge } from 'lucide-react';
import { Badge } from '../../design';
import { useApp } from '../../state/store';
import { useLiveTelemetry } from './useLiveTelemetry';
import { LiveLog } from './LiveLog';
import './LiveBar.css';

export function LiveBar() {
  const profile = useApp((s) => s.profile);
  const activeLayer = profile?.layers.find((l) => l.id === profile.active_layer);
  const [open, setOpen] = useState(false);
  const { entries, latency } = useLiveTelemetry();

  return (
    <motion.aside
      className={`livebar ${open ? 'livebar--open' : ''}`}
      animate={{ height: open ? 260 : 44 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <button type="button" className="livebar__head" onClick={() => setOpen(!open)}>
        <Badge tone="success" icon={<Activity />}>Live</Badge>
        <span className="livebar__layer">
          <Layers size={12} />
          {activeLayer ? activeLayer.name : 'default'}
        </span>
        <span className="livebar__metric">
          <Gauge size={12} /> {latency.last}ms · P95 {latency.p95}ms
        </span>
        <span className="livebar__metric">
          <Cpu size={12} /> {entries.length} eventos
        </span>
        <ChevronUp
          size={14}
          style={{
            marginLeft: 'auto',
            transition: 'transform 200ms',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="livebar__body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LiveLog entries={entries} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.aside>
  );
}
