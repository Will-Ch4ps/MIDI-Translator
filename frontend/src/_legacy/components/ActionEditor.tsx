import { useEffect, useMemo, useRef, useState } from "react";
import { pickFile, pickProgramShortcut, testAction } from "../lib/backend";
import type { Control, Mapping } from "../types";
import { ActionEditorFooter } from "./action-editor/ActionEditorFooter";
import { ActionTypeGroups } from "./action-editor/ActionTypeGroups";
import { ActionValueField } from "./action-editor/ActionValueField";
import { suggestActionLabel } from "./action-editor/actionMeta";
import { groupedOptionsFor, optionLabelFor, paramsFor, scriptArgsFrom, triggerFrom, triggerOptionsFor, type TriggerMode, valueFrom, volumeTargetFrom } from "./action-editor/actionUtils";
import { captureCombo } from "./action-editor/keyboardCapture";
import { TriggerModeField } from "./action-editor/TriggerModeField";
import { useAudioTargets } from "./action-editor/useAudioTargets";
import { useRunningPrograms } from "./action-editor/useRunningPrograms";
import { useTargetInspection } from "./action-editor/useTargetInspection";

type Props = { control: Control; mappings: Mapping[]; onDelete: (trigger: TriggerMode) => Promise<void>; onSave: (mapping: Mapping) => Promise<void> };
type SaveStatus = "idle" | "saving" | "saved" | "error";
type TestStatus = "idle" | "running" | "done" | "error";

export function ActionEditor({ control, mappings, onDelete, onSave }: Props) {
  const groups = useMemo(() => groupedOptionsFor(control.type), [control.type]);
  const options = useMemo(() => groups.flatMap((group) => group.items), [groups]);
  const triggerOptions = useMemo(() => triggerOptionsFor(control), [control]);
  const defaultTrigger = triggerOptions[0]?.value || "press";
  const [actionType, setActionType] = useState(options[0].type);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [scriptArgs, setScriptArgs] = useState("");
  const [volumeTarget, setVolumeTarget] = useState("master");
  const [trigger, setTrigger] = useState<TriggerMode>(defaultTrigger);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [capturing, setCapturing] = useState(false);
  const previousControlId = useRef(control.id);
  const isContinuous = control.type.includes("knob") || control.type === "pitch_bend" || control.type === "fader";
  const audioTargets = useAudioTargets(actionType.startsWith("volume"));
  const runningPrograms = useRunningPrograms(actionType === "app_launch");
  const inspection = useTargetInspection(actionType, value, volumeTarget);
  const byTrigger = useMemo(() => new Map(mappings.map((item) => [triggerFrom(item, control), item])), [mappings, control]);
  const current = byTrigger.get(trigger);

  useEffect(() => {
    if (previousControlId.current === control.id) return;
    previousControlId.current = control.id;
    const firstSaved = triggerOptions.find((item) => byTrigger.has(item.value))?.value;
    setTrigger(firstSaved || defaultTrigger);
  }, [control.id, byTrigger, defaultTrigger, triggerOptions]);

  useEffect(() => {
    if (!triggerOptions.some((item) => item.value === trigger)) {
      setTrigger(defaultTrigger);
    }
  }, [defaultTrigger, trigger, triggerOptions]);

  useEffect(() => {
    const nextType = current?.action.type ?? options[0].type;
    setActionType(options.some((item) => item.type === nextType) ? nextType : options[0].type);
    setLabel(current?.label ?? "");
    setValue(valueFrom(current));
    setScriptArgs(scriptArgsFrom(current));
    setVolumeTarget(volumeTargetFrom(current));
    setSaveStatus("idle");
    setTestStatus("idle");
    setErrorMsg("");
    setCapturing(false);
  }, [current, options, trigger]);

  useEffect(() => {
    if (!capturing) return;
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      const combo = captureCombo(event);
      if (combo) setValue(combo);
      setCapturing(false);
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [capturing]);

  async function handleSave() {
    setSaveStatus("saving");
    setErrorMsg("");
    try {
      const finalLabel = suggestActionLabel(actionType, value, label).trim();
      await onSave({ control_id: control.id, label: finalLabel, trigger, action: { type: actionType, params: paramsFor(actionType, value, control, { scriptArgs, volumeTarget }) } });
      if (finalLabel && !label.trim()) setLabel(finalLabel);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2200);
    } catch (err) { setSaveStatus("error"); setErrorMsg(String(err)); }
  }

  async function handleTest() {
    setTestStatus("running");
    setErrorMsg("");
    try {
      await testAction({ type: actionType, params: paramsFor(actionType, value, control, { scriptArgs, volumeTarget }) }, isContinuous);
      setTestStatus("done");
      setTimeout(() => setTestStatus("idle"), 1800);
    } catch (err) { setTestStatus("error"); setErrorMsg(String(err)); }
  }

  async function handleDelete() {
    setSaveStatus("saving");
    try { await onDelete(trigger); setSaveStatus("idle"); }
    catch (err) { setSaveStatus("error"); setErrorMsg(String(err)); }
  }

  async function choosePath() {
    const kind = actionType === "script" ? "script" : actionType === "app_launch" ? "app_launch" : undefined;
    const path = await pickFile(kind);
    if (!path) return;
    setValue(path);
    setLabel((text) => suggestActionLabel(actionType, path, text));
  }

  async function chooseProgramShortcutPath() {
    const path = await pickProgramShortcut();
    if (!path) return;
    setValue(path);
    setLabel((text) => suggestActionLabel("app_launch", path, text));
  }

  return (
    <div className="action-editor">
      <div className="ae-section-label">Configurar acao</div>
      <div className="ae-active-hint">Tipo atual: <strong>{optionLabelFor(actionType)}</strong></div>
      <div className="ae-active-hint">Gatilhos salvos: <strong>{triggerOptions.filter((item) => byTrigger.has(item.value)).map((item) => item.label).join(" • ") || "nenhum"}</strong></div>
      <TriggerModeField control={control} value={trigger} onChange={setTrigger} />
      <ActionTypeGroups groups={groups} actionType={actionType} onChange={setActionType} />
      <div className="field"><label>Nome curto (opcional)</label><input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Ex: Mute OBS, Abrir Discord, Cena gameplay" /></div>
      <ActionValueField actionType={actionType} value={value} scriptArgs={scriptArgs} volumeTarget={volumeTarget} volumeOptions={audioTargets.targets} volumeApps={audioTargets.apps} volumeLoading={audioTargets.loading} onRefreshVolumeApps={audioTargets.refresh} runningPrograms={runningPrograms.apps} runningProgramsLoading={runningPrograms.loading} onRefreshRunningPrograms={runningPrograms.refresh} inspection={inspection.inspection} inspectionLoading={inspection.loading} capturing={capturing} onValueChange={setValue} onScriptArgsChange={setScriptArgs} onVolumeTargetChange={setVolumeTarget} onCapturingChange={setCapturing} onChoosePath={choosePath} onChooseProgramShortcut={chooseProgramShortcutPath} />
      <ActionEditorFooter saveStatus={saveStatus} testStatus={testStatus} errorMsg={errorMsg} onTest={handleTest} onSave={handleSave} onDelete={handleDelete} />
    </div>
  );
}
