import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, Lock } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Dialog, Badge, Input } from '../../design';
import { useApp } from '../../state/store';
import type { ActionDef } from '../../types/models';
import './ActionBrowser.css';

export function ActionBrowser({ open, onClose }: { open: boolean; onClose: () => void }) {
  const actions = useApp((s) => s.actions);
  const connectors = useApp((s) => s.connectors);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    actions.forEach((a) => a.category && set.add(a.category));
    return ['all', ...Array.from(set).sort()];
  }, [actions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return actions.filter((action) => {
      if (category !== 'all' && action.category !== category) return false;
      if (!q) return true;
      return (
        action.label.toLowerCase().includes(q) ||
        action.description.toLowerCase().includes(q) ||
        action.id.toLowerCase().includes(q) ||
        action.category.toLowerCase().includes(q)
      );
    });
  }, [actions, query, category]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !value && onClose()}
      title="Escolha uma ação"
      description="Pesquise por nome, app, capacidade. Comece a digitar."
      size="xl"
    >
      <div className="ab">
        <Input
          icon={<Search />}
          autoFocus
          placeholder="ex: volume, snap, mute, obs scene, lock…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="ab__cats">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`ab__cat ${cat === category ? 'ab__cat--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {cat === 'all' ? 'Tudo' : cat}
              <span className="ab__cat-count">
                {cat === 'all' ? actions.length : actions.filter((a) => a.category === cat).length}
              </span>
            </button>
          ))}
        </div>
        <div className="ab__grid">
          {filtered.length === 0 ? (
            <div className="ab__empty">
              <Sparkles size={20} />
              <p>Nenhuma ação encontrada para "{query}".</p>
            </div>
          ) : (
            filtered.map((action) => (
              <ActionCard key={action.id} action={action} connectorAvailable={isAvailable(action, connectors)} />
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
}

function ActionCard({ action, connectorAvailable }: { action: ActionDef; connectorAvailable: boolean }) {
  const Icon = resolveIcon(action.icon);
  return (
    <motion.button
      type="button"
      className={`ab__card ${!connectorAvailable ? 'ab__card--disabled' : ''}`}
      whileHover={connectorAvailable ? { y: -2 } : undefined}
      whileTap={connectorAvailable ? { scale: 0.98 } : undefined}
      disabled={!connectorAvailable}
    >
      <div className="ab__card-head">
        <span className="ab__card-icon">
          <Icon size={16} />
        </span>
        <div className="ab__card-cat">
          <Badge tone="neutral" size="sm">{action.category || action.connector_id}</Badge>
          {!connectorAvailable ? <Badge tone="warning" size="sm" icon={<Lock />}>config</Badge> : null}
        </div>
      </div>
      <div className="ab__card-body">
        <strong>{action.label}</strong>
        <p>{action.description || action.example}</p>
      </div>
      <code className="ab__card-id">{action.id}</code>
    </motion.button>
  );
}

function resolveIcon(name: string): LucideIcons.LucideIcon {
  const pascalName = (name || 'sparkles').split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  return ((LucideIcons as unknown) as Record<string, LucideIcons.LucideIcon>)[pascalName] ?? LucideIcons.Sparkles;
}

function isAvailable(action: ActionDef, connectors: Array<{ id: string; status: string }>): boolean {
  const connector = connectors.find((c) => c.id === action.connector_id);
  if (!connector) return true;
  return connector.status === 'ready' || connector.status === 'installed';
}
