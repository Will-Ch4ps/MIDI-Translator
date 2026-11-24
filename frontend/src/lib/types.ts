/** Contrato com o backend Python (backend/bridge.py) e o Rust (src-tauri). */

export type Control = {
  id: string;
  label: string;
  group: "keys" | "pads" | "knobs" | "buttons" | "faders" | "special";
  type: string;
  params: Record<string, unknown>;
  signature?: string | null;
};

export type Trigger = "press" | "release" | "hold" | "double";

export type Action = { type: string; params: Record<string, unknown> };

export type Mapping = {
  control_id: string;
  label: string;
  trigger?: Trigger;
  action: Action;
};

export type Profile = { name: string; device_name: string | null; mappings: Mapping[] };

export type Bootstrap = {
  layout: { name: string; author: string; controls: Control[] };
  profile: Profile;
  layouts: string[];
  profiles: string[];
  midiPorts: string[];
  preferredPort: string;
};

export type ListenerStatus = {
  running: boolean;
  port: string | null;
  profile: string | null;
  layout: string | null;
  error: string | null;
};

export type AudioCatalog = {
  targets: string[];
  apps: { name: string; display: string; target: string }[];
};

export type TargetInspection = {
  status: "ok" | "warn" | "error" | "info";
  message: string;
};

/** Eventos emitidos pelo listener (backend/service.py → Rust → "midi-runtime"). */
export type RuntimeEvent =
  | { type: "status"; status: "connected" | "disconnected" | "error" | "stderr"; port?: string; message?: string }
  | { type: "state"; pad_bank: "A" | "B" | "C"; octave: number; transpose: number; sustain_active: boolean }
  | { type: "control"; control_id: string; value: number; pressed: boolean }
  | { type: "midi"; key_id: string; pressed: boolean };
