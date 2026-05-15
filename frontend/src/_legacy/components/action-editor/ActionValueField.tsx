import type { AudioTargetApp, TargetInspection } from "../../lib/audioBackend";
import type { RunningProgram } from "../../lib/programBackend";
import { friendlyProgramName } from "./actionMeta";
import { ProgramLaunchField } from "./ProgramLaunchField";
import { ShortcutKeyboard } from "./ShortcutKeyboard";
import { actionExamples, actionHelp, needsValue, placeholderFor, valueLabel } from "./actionUtils";
import { VolumeTargetField } from "./VolumeTargetField";

type Props = {
  actionType: string;
  value: string;
  scriptArgs: string;
  volumeTarget: string;
  volumeOptions: string[];
  volumeApps: AudioTargetApp[];
  volumeLoading: boolean;
  onRefreshVolumeApps: () => Promise<void>;
  runningPrograms: RunningProgram[];
  runningProgramsLoading: boolean;
  onRefreshRunningPrograms: () => Promise<void>;
  inspection: TargetInspection | null;
  inspectionLoading: boolean;
  capturing: boolean;
  onValueChange: (value: string) => void;
  onScriptArgsChange: (args: string) => void;
  onVolumeTargetChange: (target: string) => void;
  onCapturingChange: (capturing: boolean) => void;
  onChoosePath: () => void;
  onChooseProgramShortcut: () => void;
};

export function ActionValueField(props: Props) {
  const {
    actionType, value, scriptArgs, volumeTarget, volumeOptions, volumeApps, volumeLoading, onRefreshVolumeApps, runningPrograms,
    runningProgramsLoading, onRefreshRunningPrograms, inspection, inspectionLoading, capturing, onValueChange, onScriptArgsChange,
    onVolumeTargetChange, onCapturingChange, onChoosePath, onChooseProgramShortcut,
  } = props;
  if (!needsValue(actionType)) return null;

  const examples = actionExamples(actionType);
  const isPathField = actionType === "app_launch" || actionType === "script";
  const singleLine = actionType === "key" || actionType === "app_launch" || actionType === "script" || actionType.startsWith("volume");
  const hidePrimaryInput = actionType === "volume_set" || actionType === "volume_up" || actionType === "volume_down";
  const programName = isPathField ? friendlyProgramName(value) : "";

  return (
    <div className="field">
      <label>{valueLabel(actionType)}</label>
      {!hidePrimaryInput && singleLine ? (
        <input className={actionType === "key" ? "mono-input" : ""} value={value} onChange={(event) => onValueChange(event.target.value)} placeholder={placeholderFor(actionType)} />
      ) : !hidePrimaryInput ? (
        <textarea className={actionType === "macro" || actionType === "command" ? "mono-input" : ""} value={value} onChange={(event) => onValueChange(event.target.value)} placeholder={placeholderFor(actionType)} rows={actionType === "macro" ? 4 : 3} />
      ) : null}
      <small className="field-help">{actionHelp(actionType)}</small>
      {programName && <small className="field-meta">Programa detectado: <strong>{programName}</strong></small>}
      {inspectionLoading && <small className="field-help">Validando alvo...</small>}
      {!inspectionLoading && inspection?.message && <small className={`field-help target-${inspection.status}`}>{inspection.message}</small>}

      {examples.length > 0 && (
        <div className="example-row">
          {examples.map((example) => (
            <button className="example-chip" key={example.label} type="button" onClick={() => { onValueChange(example.value); if (actionType === "script") onScriptArgsChange(example.args || ""); }}>
              {example.label}
            </button>
          ))}
        </div>
      )}

      <VolumeTargetField
        actionType={actionType}
        volumeTarget={volumeTarget}
        volumeOptions={volumeOptions}
        volumeApps={volumeApps}
        volumeLoading={volumeLoading}
        onRefreshVolumeApps={onRefreshVolumeApps}
        onVolumeTargetChange={onVolumeTargetChange}
        onValueMirror={onValueChange}
      />

      <ProgramLaunchField
        actionType={actionType}
        value={value}
        runningApps={runningPrograms}
        loading={runningProgramsLoading}
        onRefresh={onRefreshRunningPrograms}
        onValueChange={onValueChange}
      />

      {isPathField && (
        <div className="path-actions">
          <button className="ghost-button fit" type="button" onClick={onChoosePath}>Escolher arquivo</button>
          {actionType === "app_launch" && <button className="ghost-button fit" type="button" onClick={onChooseProgramShortcut}>Escolher atalho</button>}
        </div>
      )}

      {actionType === "script" && (
        <div className="field">
          <label>Argumentos (opcional)</label>
          <input className="mono-input" value={scriptArgs} onChange={(event) => onScriptArgsChange(event.target.value)} placeholder="--scene gameplay --profile default" />
        </div>
      )}

      {actionType === "key" && (
        <>
          <div className="capture-row">
            <button className={`ghost-button ${capturing ? "active" : ""}`} type="button" onClick={() => onCapturingChange(!capturing)}>{capturing ? "Pressione uma combinacao..." : "Capturar teclado"}</button>
            <button className="ghost-button" type="button" onClick={() => onValueChange("")}>Limpar atalho</button>
          </div>
          <ShortcutKeyboard value={value} onChange={onValueChange} />
        </>
      )}
    </div>
  );
}
