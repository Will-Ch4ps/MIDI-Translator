import { useEffect, useReducer, useRef, useState } from "react";
import {
  deleteMapping,
  getAutostartEnabled,
  getLaunchContext,
  getListenerStatus,
  loadBootstrap,
  saveMapping,
  setAutostartEnabled,
  startListener,
  stopListener,
  swapMappings,
  subscribeMidiRuntime,
} from "../lib/backend";
import { defaultMidiState, type Bootstrap, type Mapping } from "../types";
import { applyRuntimeEvent, midiReducer, type MidiAction } from "../state/midiRuntime";

const AUTO_LISTEN_BOOT_KEY = "miditranslate:auto-listen-on-boot";

export function useRuntimeController() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listenerBusy, setListenerBusy] = useState(false);
  const [listenerRunning, setListenerRunning] = useState(false);
  const [listenerStatus, setListenerStatus] = useState("backend python vinculado");
  const [midiState, dispatchMidi] = useReducer(midiReducer, defaultMidiState());
  const [autostartBusy, setAutostartBusy] = useState(false);
  const [autostartEnabled, setAutostartState] = useState(false);
  const [autoListenOnBoot, setAutoListenOnBoot] = useState(readAutoListenFlag);
  const [autostartLaunch, setAutostartLaunch] = useState(false);
  const triedAutoStartRef = useRef(false);

  useEffect(() => {
    loadBootstrap().then(setData).catch((err) => setError(String(err)));
    getListenerStatus().then((status) => {
      setListenerRunning(status.running);
      setListenerStatus(status.running ? `escutando: ${status.port || "porta"}` : "listener parado");
    }).catch((err) => setListenerStatus(`erro: ${String(err)}`));
    getAutostartEnabled().then(setAutostartState).catch(() => setAutostartState(false));
    getLaunchContext().then((ctx) => setAutostartLaunch(ctx.autostart_launch)).catch(() => setAutostartLaunch(false));
  }, []);

  useEffect(() => {
    let mounted = true;
    let unlisten: (() => void) | null = null;
    subscribeMidiRuntime((event) => {
      if (!mounted) return;
      applyRuntimeEvent(event, { setListenerRunning, setListenerStatus, dispatchMidi });
    }).then((off) => { unlisten = off; });
    return () => { mounted = false; unlisten?.(); };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(AUTO_LISTEN_BOOT_KEY, autoListenOnBoot ? "1" : "0");
  }, [autoListenOnBoot]);

  useEffect(() => {
    if (!data || !autostartLaunch || !autoListenOnBoot || listenerRunning || listenerBusy) return;
    if (triedAutoStartRef.current) return;
    triedAutoStartRef.current = true;
    void startListenerNow(data, setListenerRunning, setListenerStatus);
  }, [autoListenOnBoot, autostartLaunch, data, listenerBusy, listenerRunning]);

  useEffect(() => {
    if ("__TAURI_INTERNALS__" in window) return;
    let value = 0;
    let direction = 1;
    const timer = window.setInterval(() => {
      value = Math.max(0, Math.min(127, value + direction * 4));
      if (value >= 127 || value <= 0) direction *= -1;
      dispatchMidi({ type: "KNOB_CHANGE", id: "KNOB_1", value });
    }, 80);
    return () => window.clearInterval(timer);
  }, []);

  async function handleToggleListener() {
    if (!data || listenerBusy) return;
    setListenerBusy(true);
    try {
      if (listenerRunning) {
        await stopListener();
        setListenerRunning(false);
        setListenerStatus("listener parado");
        dispatchMidi({ type: "RESET" });
      } else {
        await startListenerNow(data, setListenerRunning, setListenerStatus);
      }
    } catch (err) {
      setListenerStatus(`erro: ${String(err)}`);
    } finally {
      setListenerBusy(false);
    }
  }

  async function handleToggleAutostart() {
    if (autostartBusy) return;
    setAutostartBusy(true);
    try {
      setAutostartState(await setAutostartEnabled(!autostartEnabled));
    } catch (err) {
      setListenerStatus(`erro autostart: ${String(err)}`);
    } finally {
      setAutostartBusy(false);
    }
  }

  async function handleSaveMapping(mapping: Mapping) {
    if (!data) return;
    const profile = await saveMapping(data.profile.name, mapping);
    setData((current) => current ? { ...current, profile } : current);
  }

  async function handleDeleteMapping(controlId: string, trigger?: string) {
    if (!data) return;
    const profile = await deleteMapping(data.profile.name, controlId, trigger);
    setData((current) => current ? { ...current, profile } : current);
  }

  async function handleSwapMappings(sourceControlId: string, targetControlId: string) {
    if (!data) return;
    if (!sourceControlId || !targetControlId || sourceControlId === targetControlId) return;
    const profile = await swapMappings(data.profile.name, sourceControlId, targetControlId);
    setData((current) => current ? { ...current, profile } : current);
  }

  return {
    data, error, listenerBusy, listenerRunning, listenerStatus, midiState,
    autostartBusy, autostartEnabled, autoListenOnBoot,
    setAutoListenOnBoot, handleToggleListener, handleToggleAutostart,
    handleSaveMapping, handleDeleteMapping, handleSwapMappings,
  };
}

async function startListenerNow(
  data: Bootstrap,
  setListenerRunning: (running: boolean) => void,
  setListenerStatus: (status: string) => void,
) {
  const port = data.preferredPort || data.midiPorts[0] || "";
  if (!port) {
    setListenerStatus("nenhuma porta MIDI disponivel");
    return;
  }
  const status = await startListener(port, data.profile.name, data.layouts[0] || "starrykey25");
  setListenerRunning(status.running);
  setListenerStatus(status.running ? `escutando: ${status.port || port}` : status.error || "falha ao iniciar");
}

function readAutoListenFlag() {
  return window.localStorage.getItem(AUTO_LISTEN_BOOT_KEY) === "1";
}
