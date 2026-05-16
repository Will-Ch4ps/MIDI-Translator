/** Cliente do bridge Tauri ↔ Python.
 *
 * No browser (dev sem Tauri), expõe mock pra os screens carregarem.
 * Em produção, invoca o comando `backend_call` registrado em src-tauri/.
 */
import type {
  ActionDef,
  ConnectionManifest,
  ConnectionStatus,
  Device,
  PresetPack,
  Profile,
} from '../types/models';

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function invokeBackend<T>(
  command: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  if (!isTauri()) {
    return mock<T>(command, payload);
  }
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
  // O Rust deserializa `payload` como `serde_json::Value` e faz `.to_string()`.
  // Se eu mandasse JSON.stringify(payload), o Rust receberia uma string e o
  // Python tentaria parsear `"\"{...}\""`. Mandando objeto direto, o Tauri
  // serializa pra JSON e o Rust passa exatamente `{"key":"value"}` pro Python.
  const result = await tauriInvoke<Result<T>>('backend_call', {
    command,
    payload: payload ?? {},
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

export type Bootstrap = {
  platform: { os: string; display_server: string; desktop: string };
  devices: Device[];
  active_device_id: string | null;
  profile: Profile | null;
  connectors: Array<ConnectionManifest & { status: ConnectionStatus; action_count: number }>;
  actions: ActionDef[];
  available_action_ids: string[];
  preset_packs: PresetPack[];
  midi_input_ports: string[];
  midi_output_ports: string[];
  active_layer: string;
};

export const backend = {
  bootstrap: () => invokeBackend<Bootstrap>('bootstrap'),
  listMidiPorts: () => invokeBackend<{ inputs: string[]; outputs: string[] }>('list_midi_ports'),
  startListener: (port: string) => invokeBackend<{ port: string }>('start_listener', { port }),
  stopListener: () => invokeBackend<void>('stop_listener'),
  saveDevice: (device: Device) => invokeBackend<Device>('save_device', { device }),
  loadDevice: (deviceId: string) => invokeBackend<Device>('load_device', { device_id: deviceId }),
  saveProfile: (profile: Profile) => invokeBackend<Profile>('save_profile', { profile }),
  applyPresetPack: (packId: string, controlIds: string[], layer: string) =>
    invokeBackend<Profile>('apply_preset_pack', { pack_id: packId, control_ids: controlIds, layer }),
  undoPresetPack: (packId: string) => invokeBackend<Profile>('undo_preset_pack', { pack_id: packId }),
  testAction: (actionId: string, params: Record<string, unknown>) =>
    invokeBackend<{ ran: boolean }>('test_action', { action_id: actionId, params }),
  setLayer: (layerId: string) => invokeBackend<{ layer: string }>('set_layer', { layer: layerId }),
};

/* ────────────────────────────  mock data  ───────────────────────────── */
import { mockBootstrap } from './mockBackend';

async function mock<T>(command: string, payload: Record<string, unknown>): Promise<T> {
  const responses: Record<string, () => unknown> = {
    bootstrap: () => mockBootstrap,
    list_midi_ports: () => ({ inputs: mockBootstrap.midi_input_ports, outputs: mockBootstrap.midi_output_ports }),
    start_listener: () => payload,
    stop_listener: () => null,
    save_device: () => (payload as { device: Device }).device,
    load_device: () => mockBootstrap.devices[0],
    save_profile: () => (payload as { profile: Profile }).profile,
    apply_preset_pack: () => mockBootstrap.profile,
    undo_preset_pack: () => mockBootstrap.profile,
    test_action: () => ({ ran: true }),
    set_layer: () => ({ layer: (payload as { layer: string }).layer }),
    learn_start: () => ({ status: 'listening', phase: 'pads' }),
    learn_stop: () => ({ status: 'stopped' }),
    learn_snapshot: () => ({ controls: [], phase: 'pads' }),
    learn_advance: () => ({ phase: 'knobs' }),
    learn_finalize: () => mockBootstrap.devices[0],
  };
  const handler = responses[command];
  if (!handler) throw new Error(`mock: comando ${command} não mapeado`);
  return handler() as T;
}
