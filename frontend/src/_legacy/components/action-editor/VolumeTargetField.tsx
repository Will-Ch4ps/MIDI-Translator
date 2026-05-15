import type { AudioTargetApp } from "../../lib/audioBackend";
import { VOLUME_TARGETS } from "./actionMeta";

type Props = {
  actionType: string;
  volumeTarget: string;
  volumeOptions: string[];
  volumeApps: AudioTargetApp[];
  volumeLoading: boolean;
  onRefreshVolumeApps: () => Promise<void>;
  onVolumeTargetChange: (target: string) => void;
  onValueMirror: (value: string) => void;
};

export function VolumeTargetField(props: Props) {
  const { actionType, volumeTarget, volumeOptions, volumeApps, volumeLoading, onRefreshVolumeApps, onVolumeTargetChange, onValueMirror } = props;
  if (actionType !== "volume_set" && actionType !== "volume_up" && actionType !== "volume_down") return null;

  return (
    <div className="field">
      <label>Vinculo global</label>
      <select value={globalValue(volumeTarget)} onChange={(event) => update(event.target.value, actionType, onVolumeTargetChange, onValueMirror)}>
        <option value="">Selecione uma opcao</option>
        {VOLUME_TARGETS.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
        {volumeOptions.filter((target) => !VOLUME_TARGETS.some((item) => item.value === target)).slice(0, 10).map((target) => (
          <option key={target} value={target}>{target}</option>
        ))}
      </select>
      <small className="field-help">Escolha um vinculo global ou um processo detectado.</small>

      <input
        className="mono-input"
        value={volumeTarget}
        onChange={(event) => update(event.target.value, actionType, onVolumeTargetChange, onValueMirror)}
        placeholder="master, leagueclientuxrender.exe, obs64.exe"
      />

      <div className="capture-row">
        <button className="ghost-button fit" type="button" onClick={() => void onRefreshVolumeApps()}>
          {volumeLoading ? "Atualizando apps..." : "Atualizar apps abertos"}
        </button>
      </div>

      {volumeApps.length > 0 && (
        <>
          <label>Apps de audio abertos</label>
          <div className={`volume-app-grid ${actionType === "volume_set" ? "" : "compact"}`.trim()}>
            {volumeApps.slice(0, actionType === "volume_set" ? 10 : 8).map((app) => (
              <button
                className={`volume-app-chip ${volumeTarget.toLowerCase() === app.target.toLowerCase() ? "selected" : ""}`}
                key={`${app.name}-${app.pid}`}
                type="button"
                onClick={() => update(app.target, actionType, onVolumeTargetChange, onValueMirror)}
              >
                <strong>{app.display || app.name}</strong>
                <span>{app.name} - pid {app.pid}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function globalValue(value: string) {
  const raw = value.trim().toLowerCase();
  return VOLUME_TARGETS.some((item) => item.value === raw) ? raw : "";
}

function update(value: string, type: string, onVolumeTargetChange: (target: string) => void, onValueMirror: (value: string) => void) {
  onVolumeTargetChange(value);
  if (type === "volume_set") onValueMirror(value);
}
