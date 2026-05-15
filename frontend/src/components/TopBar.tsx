import { Cable, Circle, Layers, Play, Rocket, Square, UserRound } from "lucide-react";
import type { Bootstrap, MidiState } from "../types";

type Props = {
  data: Bootstrap;
  busy: boolean;
  autostartBusy: boolean;
  autostartEnabled: boolean;
  autoListenOnBoot: boolean;
  listenerRunning: boolean;
  listenerStatus: string;
  midiState: MidiState;
  onToggleListener: () => void;
  onToggleAutostart: () => void;
  onToggleAutoListenOnBoot: () => void;
};

export function TopBar({
  data,
  busy,
  autostartBusy,
  autostartEnabled,
  autoListenOnBoot,
  listenerRunning,
  listenerStatus,
  midiState,
  onToggleListener,
  onToggleAutostart,
  onToggleAutoListenOnBoot,
}: Props) {
  const port = data.preferredPort || data.midiPorts[0] || "sem porta";
  const { octave, transpose, padBank, fullLevel } = midiState;

  return (
    <header className="topbar">
      <div className="brand-mark">M</div>
      <strong className="brand-name">MIDITranslate</strong>
      <div className="desktop-tag">Tauri</div>
      <div className="topbar-divider" />

      <div className="top-group">
        <Cable size={13} />
        <span>{port}</span>
      </div>
      <div className="top-group">
        <Layers size={13} />
        <span>{data.layout.name}</span>
      </div>
      <div className="top-group">
        <UserRound size={13} />
        <span>{data.profile.name}</span>
      </div>
      <div className="topbar-divider" />

      <div className="midi-state-bar">
        <div className={`midi-chip ${octave !== 0 ? "active" : ""}`}>
          <span className="midi-chip-label">OCT</span>
          <span className="midi-chip-value">{octave > 0 ? `+${octave}` : octave}</span>
        </div>
        <div className={`midi-chip ${transpose !== 0 ? "active" : ""}`}>
          <span className="midi-chip-label">TRANS</span>
          <span className="midi-chip-value">{transpose > 0 ? `+${transpose}` : transpose}</span>
        </div>
        <div className="midi-chip active-always">
          <span className="midi-chip-label">BANK</span>
          <span className="midi-chip-value">{padBank}</span>
        </div>
        {fullLevel && (
          <div className="midi-chip warn">
            <span className="midi-chip-label">FULL</span>
            <span className="midi-chip-value">LVL</span>
          </div>
        )}
      </div>

      <div className="top-spacer" />

      <div className={`status-pill ${listenerRunning ? "online" : "offline"}`}>
        <Circle size={8} fill="currentColor" />
        <span>{listenerStatus}</span>
      </div>

      <button
        className={`ghost-pill ${autostartEnabled ? "active" : ""}`}
        disabled={autostartBusy}
        type="button"
        onClick={onToggleAutostart}
      >
        <Rocket size={12} />
        {autostartEnabled ? "Inicia no Windows" : "Nao inicia no Windows"}
      </button>

      <button
        className={`ghost-pill ${autoListenOnBoot ? "active" : ""}`}
        type="button"
        onClick={onToggleAutoListenOnBoot}
      >
        {autoListenOnBoot ? "Listener auto boot" : "Listener manual boot"}
      </button>

      <button
        className={`primary-button ${listenerRunning ? "danger" : ""}`}
        disabled={busy}
        type="button"
        onClick={onToggleListener}
      >
        {listenerRunning ? (
          <>
            <Square size={13} fill="currentColor" />
            Parar
          </>
        ) : (
          <>
            <Play size={13} fill="currentColor" />
            Iniciar
          </>
        )}
      </button>
    </header>
  );
}
