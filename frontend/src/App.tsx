import { useMemo, useState } from "react";
import { Activity } from "lucide-react";
import { DeviceMap } from "./components/DeviceMap";
import { Inspector } from "./components/Inspector";
import { TopBar } from "./components/TopBar";
import { useRuntimeController } from "./hooks/useRuntimeController";
import type { Control } from "./types";

export function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const {
    data,
    error,
    listenerBusy,
    listenerRunning,
    listenerStatus,
    midiState,
    autostartBusy,
    autostartEnabled,
    autoListenOnBoot,
    setAutoListenOnBoot,
    handleToggleListener,
    handleToggleAutostart,
    handleSaveMapping,
    handleDeleteMapping,
    handleSwapMappings,
  } = useRuntimeController();

  const selected = useMemo<Control | null>(() => {
    if (!data || !selectedId) return null;
    return data.layout.controls.find((control) => control.id === selectedId) ?? null;
  }, [data, selectedId]);

  if (error) return <div className="boot-state danger">{error}</div>;
  if (!data) return <div className="boot-state">Carregando MIDITranslate...</div>;

  return (
    <main className="app-shell">
      <TopBar
        data={data}
        busy={listenerBusy}
        autostartBusy={autostartBusy}
        autostartEnabled={autostartEnabled}
        autoListenOnBoot={autoListenOnBoot}
        listenerRunning={listenerRunning}
        listenerStatus={listenerStatus}
        midiState={midiState}
        onToggleListener={handleToggleListener}
        onToggleAutostart={handleToggleAutostart}
        onToggleAutoListenOnBoot={() => setAutoListenOnBoot((value) => !value)}
      />

      <section className="workspace">
        <div className="stage">
          <div className="stage-title">
            <div>
              <span className="eyebrow">Layout ativo</span>
              <h1>{data.layout.name}</h1>
            </div>
            <div className="activity-pill">
              <Activity size={15} />
              <span>{data.profile.mappings.length} mappings</span>
            </div>
          </div>
          <DeviceMap
            layout={data.layout}
            mappings={data.profile.mappings}
            selectedId={selectedId}
            midiState={midiState}
            onSelect={setSelectedId}
            onSwapControls={handleSwapMappings}
          />
        </div>

        <Inspector
          control={selected}
          mappings={data.profile.mappings}
          midiState={midiState}
          onDeleteMapping={handleDeleteMapping}
          onSaveMapping={handleSaveMapping}
        />
      </section>
    </main>
  );
}
