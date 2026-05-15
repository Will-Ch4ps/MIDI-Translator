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

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function invoke<T>(command: string, payload: unknown = {}): Promise<T> {
  if (!isTauri) {
    return mock<T>(command, payload);
  }
  const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
  const result = await tauriInvoke<Result<T>>('backend_call', {
    command,
    payload: JSON.stringify(payload),
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
  preset_packs: PresetPack[];
  midi_input_ports: string[];
  midi_output_ports: string[];
};

export const backend = {
  bootstrap: () => invoke<Bootstrap>('bootstrap'),
  listMidiPorts: () => invoke<{ inputs: string[]; outputs: string[] }>('list_midi_ports'),
  startListener: (port: string) => invoke<{ port: string }>('start_listener', { port }),
  stopListener: () => invoke<void>('stop_listener'),
  saveDevice: (device: Device) => invoke<Device>('save_device', { device }),
  loadDevice: (deviceId: string) => invoke<Device>('load_device', { device_id: deviceId }),
  saveProfile: (profile: Profile) => invoke<Profile>('save_profile', { profile }),
  applyPresetPack: (packId: string, controlIds: string[], layer: string) =>
    invoke<Profile>('apply_preset_pack', { pack_id: packId, control_ids: controlIds, layer }),
  undoPresetPack: (packId: string) => invoke<Profile>('undo_preset_pack', { pack_id: packId }),
  testAction: (actionId: string, params: Record<string, unknown>) =>
    invoke<{ ran: boolean }>('test_action', { action_id: actionId, params }),
  setLayer: (layerId: string) => invoke<{ layer: string }>('set_layer', { layer: layerId }),
};

export { isTauri };

/* ────────────────────────────  mock data  ───────────────────────────── */
import { mockBootstrap } from './mockBackend';

async function mock<T>(command: string, payload: unknown): Promise<T> {
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
  };
  const handler = responses[command];
  if (!handler) throw new Error(`mock: comando ${command} não mapeado`);
  return handler() as T;
}
