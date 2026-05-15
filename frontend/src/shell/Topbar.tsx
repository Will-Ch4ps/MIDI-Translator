import { Search, Plug, Power } from 'lucide-react';
import { Button, Badge, Tooltip } from '../design';
import { useApp } from '../state/store';
import './Topbar.css';

const ROUTE_TITLES: Record<string, { title: string; subtitle: string }> = {
  home: { title: 'Início', subtitle: 'Status do controlador, ações sugeridas e demos' },
  devices: { title: 'Controladores', subtitle: 'Adicione, aprenda e organize seus dispositivos MIDI' },
  editor: { title: 'Editor', subtitle: 'Atalhos e mapeamentos do controlador atual' },
  connections: { title: 'Conexões', subtitle: 'Apps e serviços que você pode controlar' },
  profiles: { title: 'Perfil & Camadas', subtitle: 'Layers, Preset Packs e gerenciamento do perfil' },
  macros: { title: 'Macros & Recipes', subtitle: 'Biblioteca de macros e fluxos prontos' },
  live: { title: 'Live Monitor', subtitle: 'Eventos em tempo real, latência e camada ativa' },
  settings: { title: 'Configurações', subtitle: 'Autostart, atalhos globais, tema, integrações' },
};

export function Topbar() {
  const route = useApp((s) => s.route);
  const connectors = useApp((s) => s.connectors);
  const ready = connectors.filter((c) => c.status === 'ready').length;
  const info = ROUTE_TITLES[route] ?? ROUTE_TITLES.home;
  return (
    <header className="topbar glass">
      <div className="topbar__title">
        <h1>{info.title}</h1>
        <p>{info.subtitle}</p>
      </div>
      <div className="topbar__search">
        <Search size={14} />
        <input placeholder="Buscar ação, conexão, atalho…" />
        <kbd className="kbd">⌘ K</kbd>
      </div>
      <div className="topbar__actions">
        <Tooltip content={`${ready} conexões prontas de ${connectors.length}`}>
          <Badge tone="success" icon={<Plug />}>
            {ready}/{connectors.length} conexões
          </Badge>
        </Tooltip>
        <Button variant="subtle" size="sm" icon={<Power size={14} />}>
          Listener ligado
        </Button>
      </div>
    </header>
  );
}
