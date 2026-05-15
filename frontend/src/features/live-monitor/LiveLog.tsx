import { motion } from 'framer-motion';
import type { LiveEntry } from './useLiveTelemetry';

export function LiveLog({ entries }: { entries: LiveEntry[] }) {
  if (entries.length === 0) {
    return <div className="livebar__empty">Toque um controle. Os eventos aparecem aqui em tempo real.</div>;
  }
  return (
    <div className="livebar__rows">
      {entries.map((entry) => (
        <motion.div
          key={entry.id}
          className={`livebar__row livebar__row--${entry.kind}`}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
        >
          <span className="livebar__time">{new Date(entry.ts).toLocaleTimeString()}</span>
          <span className="livebar__sig font-mono">{entry.signature}</span>
          <span className="livebar__ctrl">{entry.control ?? '—'}</span>
          <span className="livebar__action font-mono">{entry.action ?? entry.message ?? ''}</span>
          <span className="livebar__kind">{entry.kind}</span>
        </motion.div>
      ))}
    </div>
  );
}
