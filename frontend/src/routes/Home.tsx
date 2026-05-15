import { ArrowUpRight, Cpu, Plug, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge, Button, Card, CardTitle, CardDescription } from '../design';
import { useApp, useActiveDevice } from '../state/store';
import './Home.css';

export function HomeRoute() {
  const device = useActiveDevice();
  const profile = useApp((s) => s.profile);
  const connectors = useApp((s) => s.connectors);
  const setRoute = useApp((s) => s.setRoute);
  const presetPacks = useApp((s) => s.presetPacks);
  const ready = connectors.filter((c) => c.status === 'ready').length;

  return (
    <div className="home">
      <section className="home__hero">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <Badge tone="accent" icon={<Sparkles />}>Novo · multi-device</Badge>
          <h1 className="home__title">
            {device ? `Conectado ao ${device.name}` : 'Conecte um controlador para começar'}
          </h1>
          <p className="home__sub">
            {profile
              ? `${profile.mappings.length} atalhos mapeados no perfil "${profile.name}".`
              : 'Crie um perfil e arraste ações pros pads, knobs e teclas.'}
            {' '}Você está usando {ready} de {connectors.length} conexões.
          </p>
          <div className="home__cta">
            <Button variant="primary" icon={<Cpu size={14} />} onClick={() => setRoute('editor')}>
              Abrir editor
            </Button>
            <Button variant="ghost" icon={<Plug size={14} />} onClick={() => setRoute('connections')}>
              Explorar conexões
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="home__grid">
        <Card glow padding="lg">
          <Badge tone="info" icon={<Zap />}>Sugestão</Badge>
          <CardTitle>Importar Preset Pack</CardTitle>
          <CardDescription>
            Pacotes prontos pra streaming, foto, áudio e mais — adicionados no seu perfil atual.
          </CardDescription>
          <div className="home__packs">
            {presetPacks.slice(0, 4).map((pack) => (
              <button
                key={pack.id}
                className="home__pack"
                onClick={() => setRoute('profiles')}
              >
                <span className="home__pack-name">{pack.name}</span>
                <span className="home__pack-desc">{pack.description}</span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <CardTitle>Conexões detectadas</CardTitle>
          <CardDescription>
            O app escaneia o sistema e ativa o que está disponível.
          </CardDescription>
          <ul className="home__conn-list">
            {connectors.slice(0, 6).map((c) => (
              <li key={c.id} className="home__conn">
                <span className={`dot ${statusDot(c.status)}`} />
                <span className="home__conn-name">{c.name}</span>
                <span className="home__conn-count">{c.action_count} ações</span>
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" onClick={() => setRoute('connections')}>
            Ver todas
          </Button>
        </Card>

        <Card padding="lg">
          <CardTitle>Demo: experimente isso</CardTitle>
          <CardDescription>
            Aperte um pad e veja a ação pulsar no canvas. Sem mapeamento, o app sugere algo.
          </CardDescription>
          <div className="home__demo">
            <DemoControl label="PAD A1" subtitle="Mute Spotify" />
            <DemoControl label="KNOB 1" subtitle="Volume master" />
            <DemoControl label="PAD A2" subtitle="Próxima música" />
          </div>
        </Card>
      </section>
    </div>
  );
}

function statusDot(status: string) {
  if (status === 'ready') return 'dot-green dot-pulse';
  if (status === 'installed') return 'dot-amber';
  if (status === 'error') return 'dot-red';
  return 'dot-muted';
}

function DemoControl({ label, subtitle }: { label: string; subtitle: string }) {
  return (
    <motion.div
      className="home__demo-ctrl"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="home__demo-label">{label}</span>
      <span className="home__demo-sub">{subtitle}</span>
    </motion.div>
  );
}
