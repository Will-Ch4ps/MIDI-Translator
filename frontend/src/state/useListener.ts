/** Liga/desliga o listener MIDI (processo Python gerenciado pelo Rust) e as opções de boot. */
import { useCallback, useEffect, useRef, useState, type Dispatch } from "react";
import { bridge, errorText } from "../lib/bridge";
import type { Bootstrap } from "../lib/types";
import type { MidiAction } from "./midi";

/** Mesma chave do app antigo, para a preferência sobreviver à troca de versão. */
const AUTO_LISTEN_KEY = "miditranslate:auto-listen-on-boot";
const LAYOUT = "starrykey25";

export function useListener(data: Bootstrap | null, dispatch: Dispatch<MidiAction>, onError: (msg: string) => void) {
  const [running, setRunning] = useState(false);
  const [port, setPort] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [autostart, setAutostartState] = useState(false);
  const [autoListen, setAutoListenState] = useState(() => localStorage.getItem(AUTO_LISTEN_KEY) === "1");
  const runningRef = useRef(false);
  runningRef.current = running;

  useEffect(() => {
    bridge.listenerStatus().then((s) => { setRunning(s.running); setPort(s.port); }).catch(() => {});
    bridge.autostartStatus().then(setAutostartState).catch(() => {});
    let alive = true;
    let off: (() => void) | undefined;
    void bridge.subscribeRuntime((event) => {
      if (event.type !== "status") return dispatch({ type: "event", event });
      if (event.status === "connected") { setRunning(true); setPort(event.port ?? null); }
      if (event.status === "disconnected" || event.status === "error") { setRunning(false); dispatch({ type: "reset" }); }
      if (event.status === "error") onError(`Listener: ${event.message ?? "falhou"}`);
    }).then((unlisten) => (alive ? (off = unlisten) : unlisten()));
    return () => { alive = false; off?.(); };
  }, [dispatch, onError]);

  const start = useCallback(async () => {
    if (!data) return;
    const wanted = data.preferredPort || data.midiPorts[0];
    if (!wanted) throw new Error("Nenhuma porta MIDI encontrada. O teclado está conectado?");
    const status = await bridge.listenerStart(wanted, data.profile.name, LAYOUT);
    setRunning(status.running);
    setPort(status.port);
    if (!status.running && status.error) throw new Error(status.error);
  }, [data]);

  const guard = useCallback(async (task: () => Promise<void>) => {
    setBusy(true);
    try { await task(); } catch (err) { onError(errorText(err)); } finally { setBusy(false); }
  }, [onError]);

  // Aberto pelo Windows no boot + opção ligada → já começa ouvindo.
  const triedBoot = useRef(false);
  useEffect(() => {
    if (!data || triedBoot.current) return;
    triedBoot.current = true;
    void bridge.launchContext().then((ctx) => {
      if (ctx.autostart_launch && autoListen && !runningRef.current) void guard(start);
    });
  }, [data, autoListen, guard, start]);

  const toggle = () => guard(async () => {
    if (!runningRef.current) return start();
    await bridge.listenerStop();
    setRunning(false);
    dispatch({ type: "reset" });
  });

  /** O listener lê o perfil só ao iniciar: reinicia para valer o que acabou de ser salvo. */
  const reloadIfRunning = () => runningRef.current
    ? guard(async () => { await bridge.listenerStop(); await start(); })
    : Promise.resolve();

  const setAutostart = (enabled: boolean) =>
    guard(async () => setAutostartState(await bridge.autostartSet(enabled)));

  const setAutoListen = (enabled: boolean) => {
    localStorage.setItem(AUTO_LISTEN_KEY, enabled ? "1" : "0");
    setAutoListenState(enabled);
  };

  return { running, port, busy, autostart, autoListen, toggle, reloadIfRunning, setAutostart, setAutoListen };
}

export type ListenerState = ReturnType<typeof useListener>;
