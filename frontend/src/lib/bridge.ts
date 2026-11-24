import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type {
  Action,
  AudioCatalog,
  Bootstrap,
  ListenerStatus,
  ProgramCatalog,
  Mapping,
  Profile,
  RuntimeEvent,
  TargetInspection,
} from "./types";

const inTauri = () => "__TAURI_INTERNALS__" in window;

/** Comando do Python. No Tauri via `backend_call`; no navegador via o proxy do Vite. */
async function call<T>(command: string, payload: object = {}): Promise<T> {
  if (inTauri()) return invoke<T>("backend_call", { command, payload });
  const res = await fetch("/__bridge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ command, payload }),
  });
  const body = await res.json();
  if (!body.ok) throw new Error(body.error || "erro no backend");
  return body.data as T;
}

/** Comando nativo do Rust (listener, autostart, diálogos). Fora do Tauri devolve `fallback`. */
function native<T>(command: string, args: Record<string, unknown>, fallback: T): Promise<T> {
  return inTauri() ? invoke<T>(command, args) : Promise.resolve(fallback);
}

const STOPPED: ListenerStatus = { running: false, port: null, profile: null, layout: null, error: null };

export const bridge = {
  bootstrap: () => call<Bootstrap>("bootstrap"),
  saveMapping: (profile: string, mapping: Mapping) => call<Profile>("save_mapping", { profile, mapping }),
  deleteMapping: (profile: string, control_id: string, trigger?: string) =>
    call<Profile>("delete_mapping", { profile, control_id, trigger }),
  testAction: (action: Action, is_continuous = false) => call("test_action", { action, is_continuous }),
  audioTargets: () => call<AudioCatalog>("list_audio_targets"),
  listPrograms: () => call<ProgramCatalog>("list_programs"),
  inspectTarget: (action_type: string, value: string) =>
    call<TargetInspection>("inspect_target", { action_type, value }),

  pickFile: (kind: "app_launch" | "script") => native<string | null>("pick_file", { kind }, null),
  pickProgram: () => native<string | null>("pick_program_shortcut", {}, null),

  listenerStatus: () => native("listener_status", {}, STOPPED),
  listenerStart: (port: string, profile: string, layout: string) =>
    native("listener_start", { port, profile, layout }, STOPPED),
  listenerStop: () => native("listener_stop", {}, STOPPED),

  autostartStatus: () => native("autostart_status", {}, false),
  autostartSet: (enabled: boolean) => native("autostart_set_enabled", { enabled }, enabled),
  launchContext: () => native("launch_context", {}, { autostart_launch: false }),

  async subscribeRuntime(handler: (event: RuntimeEvent) => void): Promise<() => void> {
    if (!inTauri()) {
      // Só em dev: permite simular eventos no console com window.__midi({...}).
      if (import.meta.env.DEV) (window as unknown as { __midi?: typeof handler }).__midi = handler;
      return () => {};
    }
    return listen<RuntimeEvent>("midi-runtime", (event) => handler(event.payload));
  },
};

export const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));
