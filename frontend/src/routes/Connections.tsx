import { useMemo, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search } from 'lucide-react';
import { Badge, Card, CardTitle, CardDescription, Input, Button } from '../design';
import { useApp } from '../state/store';
import type { ConnectionStatus } from '../types/models';
import './Connections.css';

const STATUS_LABEL: Record<ConnectionStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
  ready: { label: 'Pronto', tone: 'success' },
  installed: { label: 'Configurar', tone: 'warning' },
  offline: { label: 'Offline', tone: 'warning' },
  error: { label: 'Erro', tone: 'danger' },
  missing: { label: 'Indisponível', tone: 'neutral' },
};

export function ConnectionsRoute() {
  const connectors = useApp((s) => s.connectors);
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    connectors.forEach((c) => c.category && set.add(c.category));
    return Array.from(set).sort();
  }, [connectors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return connectors;
    return connectors.filter((c) =>
      [c.name, c.description, c.category, ...c.keywords].some((field) => String(field).toLowerCase().includes(q)),
    );
  }, [connectors, query]);

  return (
    <div className="conn">
      <header className="conn__head">
        <div>
          <h2>Conexões</h2>
          <p>Apps e serviços que o MIDI Studio pode controlar. Ative o que quiser usar.</p>
        </div>
        <Input
          icon={<Search />}
          placeholder="OBS, áudio, atalhos…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>
      {categories.map((cat) => {
        const cards = filtered.filter((c) => c.category === cat);
        if (cards.length === 0) return null;
        return (
          <section key={cat} className="conn__section">
            <h3 className="conn__cat-title">{cat}</h3>
            <div className="conn__grid">
              {cards.map((connector) => {
                const Icon = resolveIcon(connector.icon);
                const status = STATUS_LABEL[connector.status];
                return (
                  <Card key={connector.id} variant="elevated" padding="lg" interactive>
                    <div className="conn__card-head">
                      <span className="conn__icon">
                        <Icon size={18} />
                      </span>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                    <CardTitle>{connector.name}</CardTitle>
                    <CardDescription>{connector.description}</CardDescription>
                    <footer className="conn__card-foot">
                      <span className="conn__count font-mono">{connector.action_count} ações</span>
                      {connector.status === 'installed' ? (
                        <Button size="sm" variant="primary">Configurar</Button>
                      ) : connector.status === 'ready' ? (
                        <Button size="sm" variant="ghost">Ver ações</Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled>Indisponível</Button>
                      )}
                    </footer>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function resolveIcon(name: string): LucideIcons.LucideIcon {
  const pascal = (name || 'plug').split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  return ((LucideIcons as unknown) as Record<string, LucideIcons.LucideIcon>)[pascal] ?? LucideIcons.Plug;
}
