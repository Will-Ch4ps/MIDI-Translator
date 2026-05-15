/** Tipos espelhando os models do core Python (core/models/*).
 *
 * Bridge JSON envia tudo via `to_dict()` — esses tipos descrevem o
 * shape recebido.
 */

export type MidiKind = 'note' | 'cc' | 'pitch' | 'program' | 'aftertouch' | 'sysex';

export type MidiSignature = {
  kind: MidiKind;
  channel: number;
  code: number;
};

export type MidiEvent = {
  signature: MidiSignature;
  value: number;
  pressed: boolean;
  raw_type: string;
  timestamp_ms: number;
  port_id: string;
};

export type ControlKind =
  | 'pad'
  | 'key'
  | 'knob_abs'
  | 'knob_rel'
  | 'fader'
  | 'button_toggle'
  | 'button_momentary'
  | 'button_trigger'
  | 'pitch'
  | 'sustain';

export type Position = { x: number; y: number; w: number; h: number };

export type Control = {
  id: string;
  name: string;
  kind: ControlKind;
  signature: string | null;
  position: Position;
  group: string;
  params: Record<string, unknown>;
};

export type Device = {
  id: string;
  name: string;
  author: string;
  description: string;
  controls: Control[];
  state_machine: Record<string, unknown>;
};

export type TriggerMode = 'press' | 'release' | 'hold' | 'double';

export type Condition = {
  type: 'always' | 'app_focus' | 'layer' | 'time_range' | 'env';
  params: Record<string, unknown>;
};

export type Action = { id: string; params: Record<string, unknown> };

export type Mapping = {
  control_id: string;
  action: Action;
  trigger: TriggerMode;
  label: string;
  layer: string;
  condition: Condition;
  tags: string[];
};

export type Layer = { id: string; name: string; color: string; description: string };

export type Profile = {
  name: string;
  device_id: string;
  layers: Layer[];
  mappings: Mapping[];
  active_layer: string;
  requires_connections: string[];
};

export type ParamFieldType =
  | 'string'
  | 'int'
  | 'float'
  | 'bool'
  | 'choice'
  | 'key_combo'
  | 'path'
  | 'audio_target'
  | 'macro_steps'
  | 'kv'
  | 'text';

export type ParamField = {
  name: string;
  type: ParamFieldType;
  label: string;
  description: string;
  default: unknown;
  required: boolean;
  choices: unknown[];
  min: number | null;
  max: number | null;
};

export type ActionDef = {
  id: string;
  connector_id: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  capabilities: string[];
  platforms: string[];
  params_schema: { fields: ParamField[] };
  example: string;
  continuous: boolean;
};

export type ConnectionStatus = 'ready' | 'installed' | 'offline' | 'error' | 'missing';

export type ConnectionManifest = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requires_setup: boolean;
  auto_detect: boolean;
  docs_url: string;
  platforms: string[];
  keywords: string[];
};

export type PresetPackTarget = { role: string; count: number; hint: string };

export type PresetPack = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requires_connections: string[];
  suggested_targets: PresetPackTarget[];
};
