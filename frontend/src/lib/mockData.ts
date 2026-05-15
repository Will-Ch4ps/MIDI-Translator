import type { Bootstrap, Control } from "../types";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const keyName = (note: number) =>
  `${NOTE_NAMES[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`;

const pad = (bank: string, index: number, note: number): Control => ({
  id: `PAD_${bank}${index}`,
  label: `Pad ${bank}${index}`,
  group: "pads",
  type: "pad_bank",
  params: { bank, position: index - 1, note, channel: 10 },
  signature: `note:9:${note}`,
});

const key = (note: number): Control => ({
  id: `KEY_NOTE_${note}`,
  label: `Key ${keyName(note)}`,
  group: "keys",
  type: "keys_chromatic",
  params: { note, channel: 1, source: "KEYBOARD", virtual: true },
  signature: `note:0:${note}`,
});

export const mockBootstrap: Bootstrap = {
  layout: {
    name: "StarryKey 25",
    author: "Donner",
    controls: [
      ...Array.from({ length: 8 }, (_, i) => pad("A", i + 1, 36 + i)),
      ...Array.from({ length: 8 }, (_, i) => pad("B", i + 1, 44 + i)),
      ...Array.from({ length: 8 }, (_, i) => pad("C", i + 1, 52 + i)),

      ...[20, 21, 22, 23].map((cc, i): Control => ({
        id: `KNOB_${i + 1}`,
        label: `Knob ${i + 1}`,
        group: "knobs",
        type: "knob_absolute",
        params: { cc, channel: 2 },
        signature: `cc:1:${cc}`,
      })),

      ...["A", "B", "C", "D"].map((letter, i): Control => ({
        id: `BTN_${letter}`,
        label: `Button ${letter}`,
        group: "buttons",
        type: "button_toggle",
        params: { cc: 59 + i, channel: 3, mode: "toggle" },
        signature: `cc:2:${59 + i}`,
      })),

      {
        id: "PITCH",
        label: "Pitch Bend",
        group: "special",
        type: "pitch_bend",
        params: { channel: 4 },
        signature: "pitch:3:0",
      },

      {
        id: "MOD",
        label: "MOD",
        group: "knobs",
        type: "knob_absolute",
        params: { cc: 1, channel: 5 },
        signature: "cc:4:1",
      },

      {
        id: "SUSTAIN",
        label: "Sustain",
        group: "special",
        type: "sustain",
        params: { cc: 64, channel: 1, pressed: 127, released: 0 },
        signature: "cc:0:64",
      },

      {
        id: "KEYBOARD",
        label: "Keyboard MIDI",
        group: "keys",
        type: "keys_chromatic",
        params: {
          count: 25,
          start_note: 48,
          channel: 1,
          physical_range: [48, 72],
          mapping_range: [0, 127],
          range_only: true,
        },
        signature: null,
      },

      ...Array.from({ length: 128 }, (_, note) => key(note)),

      {
        id: "OCTAVE_UP",
        label: "Octave +",
        group: "buttons",
        type: "button_internal",
        params: {},
        signature: null,
      },
      {
        id: "OCTAVE_DOWN",
        label: "Octave -",
        group: "buttons",
        type: "button_internal",
        params: {},
        signature: null,
      },
      {
        id: "TRANSPOSE_UP",
        label: "Transpose +",
        group: "buttons",
        type: "button_internal",
        params: {},
        signature: null,
      },
      {
        id: "TRANSPOSE_DOWN",
        label: "Transpose -",
        group: "buttons",
        type: "button_internal",
        params: {},
        signature: null,
      },
      {
        id: "PAD_BANK_BTN",
        label: "Pad Bank",
        group: "buttons",
        type: "button_internal",
        params: {},
        signature: null,
      },
      {
        id: "FULL_LEVEL",
        label: "Full Level",
        group: "buttons",
        type: "button_internal",
        params: {},
        signature: null,
      },
    ],
  },
  profile: { name: "default", device_name: null, mappings: [] },
  layouts: ["starrykey25"],
  profiles: ["default"],
  midiPorts: [],
  preferredPort: "",
};
