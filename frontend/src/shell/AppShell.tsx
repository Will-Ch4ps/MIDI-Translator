import { useEffect } from 'react';
import { TooltipProvider } from '../design';
import { useApp } from '../state/store';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { LiveBar } from '../features/live-monitor/LiveBar';
import { HomeRoute } from '../routes/Home';
import { DevicesRoute } from '../routes/Devices';
import { EditorRoute } from '../routes/Editor';
import { ConnectionsRoute } from '../routes/Connections';
import { ProfilesRoute } from '../routes/Profiles';
import { MacrosRoute } from '../routes/Macros';
import { LiveRoute } from '../routes/Live';
import { SettingsRoute } from '../routes/Settings';
import './AppShell.css';

export function AppShell() {
  const route = useApp((s) => s.route);
  const loaded = useApp((s) => s.loaded);
  const loadError = useApp((s) => s.loadError);
  const bootstrap = useApp((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!loaded) {
    return <div className="boot-state">Carregando MIDI Studio…</div>;
  }
  if (loadError) {
    return (
      <div className="boot-state boot-state--error">
        <strong>Falha ao iniciar</strong>
        <span>{loadError}</span>
      </div>
    );
  }
  return (
    <TooltipProvider>
      <div className="app">
        <Sidebar />
        <div className="app__main">
          <Topbar />
          <div className="app__content">{renderRoute(route)}</div>
          <LiveBar />
        </div>
      </div>
    </TooltipProvider>
  );
}

function renderRoute(route: string) {
  switch (route) {
    case 'home':
      return <HomeRoute />;
    case 'devices':
      return <DevicesRoute />;
    case 'editor':
      return <EditorRoute />;
    case 'connections':
      return <ConnectionsRoute />;
    case 'profiles':
      return <ProfilesRoute />;
    case 'macros':
      return <MacrosRoute />;
    case 'live':
      return <LiveRoute />;
    case 'settings':
      return <SettingsRoute />;
    default:
      return <HomeRoute />;
  }
}
