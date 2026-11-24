import { useState } from "react";
import { useApp } from "./state/useApp";
import { Header, type View } from "./ui/Header";
import { ErrorBar } from "./ui/ErrorBar";
import { MapView } from "./ui/map/MapView";
import { SettingsView } from "./ui/settings/SettingsView";
import "./ui/app.css";

export function App() {
  const app = useApp();
  const [view, setView] = useState<View>("map");

  if (!app.data) {
    return app.error
      ? <div className="boot boot--error" role="alert">Não consegui carregar o backend.{"\n\n"}{app.error}</div>
      : <div className="boot">Carregando MIDITranslate…</div>;
  }

  return (
    <div className="app">
      <Header view={view} onView={setView} listener={app.listener} />
      {app.error && <ErrorBar message={app.error} onClose={app.clearError} />}
      {view === "map" ? <MapView app={app} data={app.data} /> : <SettingsView app={app} data={app.data} />}
    </div>
  );
}
