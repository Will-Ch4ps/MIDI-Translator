import { useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Plus, Package, Layers, Sparkles } from 'lucide-react';
import { Button, Card, CardTitle, CardDescription, Badge } from '../design';
import { useApp } from '../state/store';
import type { PresetPack } from '../types/models';
import './Profiles.css';

export function ProfilesRoute() {
  const profile = useApp((s) => s.profile);
  const packs = useApp((s) => s.presetPacks);
  const setActiveLayer = useApp((s) => s.setActiveLayer);

  const tagCounts = useMemo(() => {
    if (!profile) return new Map<string, number>();
    const map = new Map<string, number>();
    for (const mapping of profile.mappings) {
      for (const tag of mapping.tags) {
        map.set(tag, (map.get(tag) ?? 0) + 1);
      }
    }
    return map;
  }, [profile]);

  if (!profile) {
    return <div className="profiles__empty">Crie um device em Controladores pra ver seu perfil.</div>;
  }

  return (
    <div className="profiles">
      <Card variant="glass" padding="lg" glow>
        <div className="profiles__head">
          <div>
            <Badge tone="accent" icon={<Sparkles />}>Perfil ativo</Badge>
            <h2>{profile.name}</h2>
            <p>{profile.mappings.length} atalhos · {profile.layers.length} layers</p>
          </div>
          <div className="profiles__head-actions">
            <Button variant="ghost" icon={<Plus size={14} />}>Nova layer</Button>
            <Button variant="primary">Salvar perfil</Button>
          </div>
        </div>
      </Card>

      <section className="profiles__section">
        <h3>Layers</h3>
        <div className="profiles__layers">
          {profile.layers.map((layer) => {
            const count = profile.mappings.filter((m) => m.layer === layer.id).length;
            const active = profile.active_layer === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                className={`profiles__layer ${active ? 'profiles__layer--active' : ''}`}
                onClick={() => setActiveLayer(layer.id)}
              >
                <span
                  className="profiles__layer-dot"
                  style={{ background: layer.color || 'var(--accent)' }}
                />
                <div>
                  <strong>{layer.name}</strong>
                  <span>{count} mapeamentos</span>
                </div>
                {active ? <Badge tone="success" size="sm">ativa</Badge> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="profiles__section">
        <header className="profiles__sec-head">
          <h3>Preset Packs</h3>
          <p>Importe pacotes prontos pro seu perfil. O app sugere onde aterrissar.</p>
        </header>
        <div className="profiles__packs">
          {packs.map((pack) => (
            <PackCard key={pack.id} pack={pack} appliedCount={tagCounts.get(pack.id) ?? 0} />
          ))}
        </div>
      </section>

      {tagCounts.size > 0 ? (
        <section className="profiles__section">
          <header className="profiles__sec-head">
            <h3>Tags em uso</h3>
            <p>Mapeamentos importados de Preset Packs ficam taggeados — você pode remover por aqui.</p>
          </header>
          <div className="profiles__tags">
            {[...tagCounts.entries()].map(([tag, count]) => (
              <span key={tag} className="profiles__tag">
                <span>{tag}</span>
                <span className="profiles__tag-count">{count}</span>
              </span>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function PackCard({ pack, appliedCount }: { pack: PresetPack; appliedCount: number }) {
  const Icon = resolveIcon(pack.icon);
  return (
    <Card variant="elevated" padding="lg" interactive>
      <div className="profiles__pack-head">
        <span className="profiles__pack-icon">
          <Icon size={18} />
        </span>
        <Badge tone="neutral">{pack.category}</Badge>
        {appliedCount > 0 ? <Badge tone="success">{appliedCount} aplicado</Badge> : null}
      </div>
      <CardTitle>{pack.name}</CardTitle>
      <CardDescription>{pack.description}</CardDescription>
      <div className="profiles__pack-targets">
        <Package size={12} />
        <span>
          {pack.suggested_targets.map((t) => `${t.count}× ${t.role}`).join(' · ') || 'flexível'}
        </span>
      </div>
      <footer className="profiles__pack-foot">
        {appliedCount > 0 ? (
          <Button size="sm" variant="ghost">Remover</Button>
        ) : null}
        <Button size="sm" variant="primary" icon={<Layers size={12} />}>
          {appliedCount > 0 ? 'Re-aplicar' : 'Importar'}
        </Button>
      </footer>
    </Card>
  );
}

function resolveIcon(name: string): LucideIcons.LucideIcon {
  const pascal = (name || 'package').split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  return ((LucideIcons as unknown) as Record<string, LucideIcons.LucideIcon>)[pascal] ?? LucideIcons.Package;
}
