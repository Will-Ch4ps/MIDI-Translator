import { Card, CardTitle, CardDescription } from '../design';
import './Settings.css';

export function SettingsRoute() {
  return (
    <div className="settings">
      <div className="settings__head">
        <h2>Configurações</h2>
        <p>Autostart, atalhos globais, tema, telemetria.</p>
      </div>
      <div className="settings__grid">
        <Card variant="surface" padding="lg">
          <CardTitle>Autostart</CardTitle>
          <CardDescription>Iniciar com o sistema e abrir minimizado na bandeja.</CardDescription>
        </Card>
        <Card variant="surface" padding="lg">
          <CardTitle>Listener ao abrir</CardTitle>
          <CardDescription>Ligar o ouvinte MIDI automaticamente no boot do app.</CardDescription>
        </Card>
        <Card variant="surface" padding="lg">
          <CardTitle>Tema</CardTitle>
          <CardDescription>Dark · Cores e densidade na próxima fase.</CardDescription>
        </Card>
        <Card variant="surface" padding="lg">
          <CardTitle>Atalho global</CardTitle>
          <CardDescription>Ctrl+Alt+M abre o painel rápido (fase 6).</CardDescription>
        </Card>
      </div>
    </div>
  );
}
