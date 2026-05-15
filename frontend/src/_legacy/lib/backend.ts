import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { mockBootstrap } from "./mockData";
import type { Bootstrap, Mapping, MidiRuntimeEvent, Profile } from "../types";

type BackendCommand =
  | "bootstrap"
  | "save_mapping"
  | "delete_mapping"
  | "swap_mappings"
  | "list_audio_targets"
  | "list_running_programs"
  | "test_action"
  | "inspect_target";

const isTauri = () => "__TAURI_INTERNALS__" in window;
let browserProfile = mockBootstrap.profile;

function mappingTrigger(mapping: Mapping) {
  return (mapping.trigger || "press").toLowerCase();
}

export async function callBackend<T>(command: BackendCommand, payload = {}): Promise<T> {
  if (!isTauri()) {
    if (command === "bootstrap") return mockBootstrap as T;
    if (command === "save_mapping") {
      const mapping = (payload as { mapping: Mapping }).mapping;
      browserProfile = {
        ...browserProfile,
        mappings: [
          ...browserProfile.mappings.filter(
            (item) => !(item.control_id === mapping.control_id && mappingTrigger(item) === mappingTrigger(mapping)),
          ),
          mapping,
        ],
      };
      mockBootstrap.profile = browserProfile;
      return browserProfile as T;
    }
    if (command === "delete_mapping") {
      const { control_id: controlId, trigger } = payload as { control_id: string; trigger?: string };
      const triggerKey = String(trigger || "").toLowerCase();
      browserProfile = {
        ...browserProfile,
        mappings: browserProfile.mappings.filter((item) => {
          if (item.control_id !== controlId) return true;
          if (!triggerKey) return false;
          return mappingTrigger(item) !== triggerKey;
        }),
      };
      mockBootstrap.profile = browserProfile;
      return browserProfile as T;
    }
    if (command === "swap_mappings") {
      const { source_control_id: sourceId, target_control_id: targetId } = payload as { source_control_id: string; target_control_id: string };
      browserProfile = {
        ...browserProfile,
        mappings: browserProfile.mappings.map((item) => {
          if (item.control_id === sourceId) return { ...item, control_id: targetId };
          if (item.control_id === targetId) return { ...item, control_id: sourceId };
          return item;
        }),
      };
      mockBootstrap.profile = browserProfile;
      return browserProfile as T;
    }
    if (command === "list_audio_targets") return { targets: ["master", "browser", "lol", "youtube"] } as T;
    if (command === "list_running_programs") return { apps: [] } as T;
    if (command === "inspect_target") return { status: "info", exists: false, resolved: "", name: "", args: "", message: "" } as T;
    if (command === "test_action") return { tested: true } as T;
  }
  return invoke<T>("backend_call", { command, payload });
}

export function loadBootstrap(): Promise<Bootstrap> {
  return callBackend<Bootstrap>("bootstrap");
}

export function saveMapping(profile: string, mapping: Mapping): Promise<Profile> {
  return callBackend<Profile>("save_mapping", { profile, mapping });
}

export function deleteMapping(profile: string, control_id: string, trigger?: string): Promise<Profile> {
  return callBackend<Profile>("delete_mapping", { profile, control_id, trigger });
}

export function swapMappings(profile: string, source_control_id: string, target_control_id: string): Promise<Profile> {
  return callBackend<Profile>("swap_mappings", { profile, source_control_id, target_control_id });
}

export function testAction(action: { type: string; params: Record<string, unknown> }, is_continuous = false): Promise<{ tested: boolean }> {
  return callBackend<{ tested: boolean }>("test_action", { action, is_continuous });
}

export async function pickFile(kind?: "app_launch" | "script"): Promise<string> {
  if (!isTauri()) {
    return window.prompt("Informe o caminho do arquivo", "") || "";
  }
  return (await invoke<string | null>("pick_file", { kind })) || "";
}

export async function pickProgramShortcut(): Promise<string> {
  if (!isTauri()) {
    return window.prompt("Informe o atalho/programa", "") || "";
  }
  return (await invoke<string | null>("pick_program_shortcut")) || "";
}

export type ListenerStatus = {
  running: boolean;
  port: string | null;
  profile: string | null;
  layout: string | null;
  error: string | null;
};

export type LaunchContext = {
  autostart_launch: boolean;
};

export function getListenerStatus(): Promise<ListenerStatus> {
  if (!isTauri()) {
    return Promise.resolve({ running: false, port: null, profile: null, layout: null, error: null });
  }
  return invoke<ListenerStatus>("listener_status");
}

export function getLaunchContext(): Promise<LaunchContext> {
  if (!isTauri()) {
    return Promise.resolve({ autostart_launch: false });
  }
  return invoke<LaunchContext>("launch_context");
}

export function getAutostartEnabled(): Promise<boolean> {
  if (!isTauri()) {
    return Promise.resolve(false);
  }
  return invoke<boolean>("autostart_status");
}

export function setAutostartEnabled(enabled: boolean): Promise<boolean> {
  if (!isTauri()) {
    return Promise.resolve(enabled);
  }
  return invoke<boolean>("autostart_set_enabled", { enabled });
}

export function startListener(port: string, profile: string, layout: string): Promise<ListenerStatus> {
  if (!isTauri()) {
    return Promise.resolve({ running: true, port, profile, layout, error: null });
  }
  return invoke<ListenerStatus>("listener_start", { port, profile, layout });
}

export function stopListener(): Promise<ListenerStatus> {
  if (!isTauri()) {
    return Promise.resolve({ running: false, port: null, profile: null, layout: null, error: null });
  }
  return invoke<ListenerStatus>("listener_stop");
}

export async function subscribeMidiRuntime(
  handler: (event: MidiRuntimeEvent) => void,
): Promise<UnlistenFn> {
  if (!isTauri()) {
    return () => {};
  }
  return listen<MidiRuntimeEvent>("midi-runtime", (event) => handler(event.payload));
}
