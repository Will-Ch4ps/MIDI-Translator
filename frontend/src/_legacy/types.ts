export type ControlGroup = "keys" | "pads" | "knobs" | "buttons" | "faders" | "special";

export type ControlType =
  | "keys_chromatic"
  | "keys_white"
  | "pad_bank"
  | "pad_single"
  | "knob_absolute"
  | "knob_relative"
  | "pitch_bend"
  | "fader"
  | "button_momentary"
  | "button_toggle"
  | "button_trigger"
  | "button_internal"
  | "sustain";

export type ControlParamPrimitive = string | number | boolean | null;
export type ControlParamValue = ControlParamPrimitive | ControlParamPrimitive[];

export type Control = {
  id: string;
  label: string;
  group: ControlGroup;
  type: ControlType;
  params: Record<string, ControlParamValue>;
  signature?: string | null;
};

export type DeviceLayout = {
  name: string;
  author: string;
  controls: Control[];
};

export type Mapping = {
  control_id: string;
  label: string;
  trigger?: "press" | "release" | "hold" | "double";
  action: {
    type: string;
    params: Record<string, unknown>;
  };
};

export type Profile = {
  name: string;
  device_name: string | null;
  mappings: Mapping[];
};

export type Bootstrap = {
  layout: DeviceLayout;
  profile: Profile;
  layouts: string[];
  profiles: string[];
  midiPorts: string[];
  preferredPort: string;
};

export type MidiRuntimeStateEvent = {
  type: "state";
  pad_bank: "A" | "B" | "C";
  octave: number;
  transpose: number;
  full_level: boolean;
  sustain_active: boolean;
  shift: number;
  timestamp_ms: number;
};

export type MidiRuntimeControlEvent = {
  type: "control";
  control_id: string;
  value: number;
  pressed: boolean;
  raw_type: string;
  signature: string;
  kind: "note" | "cc" | "pitch" | "program";
  channel: number;
  code: number;
  timestamp_ms: number;
};

export type MidiRuntimeMidiEvent = {
  type: "midi";
  kind: "note" | "cc" | "pitch" | "program";
  channel: number;
  code: number;
  value: number;
  pressed: boolean;
  raw_type: string;
  signature: string;
  key_id: string;
  shift: number;
  octave: number;
  transpose: number;
  timestamp_ms: number;
};

export type MidiRuntimeStatusEvent = {
  type: "status";
  status: "connected" | "disconnected" | "error" | "stderr";
  port?: string;
  message?: string;
};

export type MidiRuntimeEvent =
  | MidiRuntimeStateEvent
  | MidiRuntimeControlEvent
  | MidiRuntimeMidiEvent
  | MidiRuntimeStatusEvent;

/** Estado em tempo real do dispositivo MIDI (feedback visual) */
export type MidiState = {
  /** Valores dos knobs: id -> 0..127 */
  knobValues: Record<string, number>;
  /** Pads atualmente pressionados */
  activePads: Set<string>;
  /** Botões atualmente pressionados/ativos */
  activeButtons: Set<string>;
  /** Notas MIDI atualmente ativas */
  activeKeys: Set<string>;
  /** Octave offset atual (-4..4) */
  octave: number;
  /** Transpose offset atual (-12..12) */
  transpose: number;
  /** Pad bank atual */
  padBank: "A" | "B" | "C";
  /** Full level ativo */
  fullLevel: boolean;
  /** Sustain pressionado */
  sustainActive: boolean;
};

export function defaultMidiState(): MidiState {
  return {
    knobValues: {},
    activePads: new Set(),
    activeButtons: new Set(),
    activeKeys: new Set(),
    octave: 0,
    transpose: 0,
    padBank: "A",
    fullLevel: false,
    sustainActive: false,
  };
}
