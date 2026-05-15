/** Store central com Zustand — feature stores compostas. */
import { create } from 'zustand';
import type {
  ActionDef,
  ConnectionManifest,
  ConnectionStatus,
  Device,
  PresetPack,
  Profile,
} from '../types/models';
import { backend } from '../lib/backend';

export type Route =
  | 'home'
  | 'devices'
  | 'editor'
  | 'connections'
  | 'profiles'
  | 'macros'
  | 'live'
  | 'settings';

type AppState = {
  route: Route;
  setRoute: (route: Route) => void;

  loaded: boolean;
  loadError: string | null;
  platform: { os: string; display_server: string; desktop: string };
  devices: Device[];
  activeDeviceId: string | null;
  profile: Profile | null;
  connectors: Array<ConnectionManifest & { status: ConnectionStatus; action_count: number }>;
  actions: ActionDef[];
  presetPacks: PresetPack[];
  midiInputPorts: string[];
  midiOutputPorts: string[];

  selectedControlId: string | null;
  selectControl: (id: string | null) => void;
  setActiveLayer: (layerId: string) => void;

  bootstrap: () => Promise<void>;
};

export const useApp = create<AppState>((set, get) => ({
  route: 'home',
  setRoute: (route) => set({ route }),

  loaded: false,
  loadError: null,
  platform: { os: '', display_server: '', desktop: '' },
  devices: [],
  activeDeviceId: null,
  profile: null,
  connectors: [],
  actions: [],
  presetPacks: [],
  midiInputPorts: [],
  midiOutputPorts: [],

  selectedControlId: null,
  selectControl: (id) => set({ selectedControlId: id }),
  setActiveLayer: (layerId) => {
    const profile = get().profile;
    if (!profile) return;
    set({ profile: { ...profile, active_layer: layerId } });
    backend.setLayer(layerId).catch(() => undefined);
  },

  bootstrap: async () => {
    try {
      const data = await backend.bootstrap();
      set({
        loaded: true,
        loadError: null,
        platform: data.platform,
        devices: data.devices,
        activeDeviceId: data.active_device_id,
        profile: data.profile,
        connectors: data.connectors,
        actions: data.actions,
        presetPacks: data.preset_packs,
        midiInputPorts: data.midi_input_ports,
        midiOutputPorts: data.midi_output_ports,
      });
    } catch (error) {
      set({ loaded: true, loadError: error instanceof Error ? error.message : String(error) });
    }
  },
}));

export function useActiveDevice() {
  return useApp((state) => state.devices.find((d) => d.id === state.activeDeviceId) ?? null);
}

export function useSelectedControl() {
  return useApp((state) => {
    const device = state.devices.find((d) => d.id === state.activeDeviceId);
    if (!device) return null;
    return device.controls.find((c) => c.id === state.selectedControlId) ?? null;
  });
}
