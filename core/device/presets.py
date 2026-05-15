"""Built-in device presets with configurable channels."""
from __future__ import annotations

from .models import Control, ControlGroup, ControlType, DeviceLayout


def starrykey25(config: dict | None = None) -> DeviceLayout:
    """Generate StarryKey 25 layout from configuration.

    O teclado físico do StarryKey 25 tem 25 teclas, mas o mapeamento por nota
    MIDI real precisa cobrir o range completo 0..127. Isso permite que notas
    emitidas após octave/transpose do hardware continuem sendo selecionáveis e
    mapeáveis no frontend/backend.
    """
    if config is None:
        config = _default_starrykey_config()

    controls: list[Control] = []

    # ─── PADS ───
    pads_config = config.get("pads", {})
    pad_channel = int(pads_config.get("channel", 10))
    for bank_name, notes in pads_config.get("banks", {}).items():
        for i, note in enumerate(notes):
            note_num = int(note)
            controls.append(Control(
                id=f"PAD_{bank_name}{i + 1}",
                label=f"Pad {bank_name}{i + 1}",
                group=ControlGroup.PADS,
                type=ControlType.PAD_BANK,
                params={
                    "bank": bank_name,
                    "position": i,
                    "note": note_num,
                    "channel": pad_channel,
                },
                signature=f"note:{pad_channel - 1}:{note_num}",
            ))

    # ─── KNOBS ───
    knobs_config = config.get("knobs", {})
    knob_channel = int(knobs_config.get("channel", 2))
    for i, cc in enumerate(knobs_config.get("cc_numbers", [])):
        cc_num = int(cc)
        controls.append(Control(
            id=f"KNOB_{i + 1}",
            label=f"KNOB {i + 1}",
            group=ControlGroup.KNOBS,
            type=ControlType.KNOB_ABSOLUTE,
            params={"cc": cc_num, "channel": knob_channel},
            signature=f"cc:{knob_channel - 1}:{cc_num}",
        ))

    # ─── BUTTONS ───
    buttons_config = config.get("buttons", {})
    btn_channel = int(buttons_config.get("channel", 3))
    for i, cc in enumerate(buttons_config.get("cc_numbers", [])):
        cc_num = int(cc)
        letter = chr(65 + i)  # A, B, C, D
        controls.append(Control(
            id=f"BTN_{letter}",
            label=f"Button {letter}",
            group=ControlGroup.BUTTONS,
            type=ControlType.BUTTON_TOGGLE,
            params={
                "cc": cc_num,
                "channel": btn_channel,
                "mode": buttons_config.get("mode", "toggle"),
            },
            signature=f"cc:{btn_channel - 1}:{cc_num}",
        ))

    # ─── PITCH BEND ───
    pitch_config = config.get("pitch_bend", {})
    pitch_channel = int(pitch_config.get("channel", 4))
    controls.append(Control(
        id="PITCH",
        label="Pitch Bend",
        group=ControlGroup.SPECIAL,
        type=ControlType.PITCH_BEND,
        params={"channel": pitch_channel},
        signature=f"pitch:{pitch_channel - 1}:0",
    ))

    # ─── MODULATION ───
    mod_config = config.get("modulation", {})
    mod_channel = int(mod_config.get("channel", 5))
    mod_cc = int(mod_config.get("cc_number", 1))
    controls.append(Control(
        id="MOD",
        label="MOD",
        group=ControlGroup.KNOBS,
        type=ControlType.KNOB_ABSOLUTE,
        params={"cc": mod_cc, "channel": mod_channel},
        signature=f"cc:{mod_channel - 1}:{mod_cc}",
    ))

    # ─── SUSTAIN ───
    sustain_config = config.get("sustain", {})
    sustain_channel = int(sustain_config.get("channel", 1))
    sustain_cc = int(sustain_config.get("cc_number", 64))
    controls.append(Control(
        id="SUSTAIN",
        label="Sustain",
        group=ControlGroup.SPECIAL,
        type=ControlType.SUSTAIN,
        params={
            "channel": sustain_channel,
            "cc": sustain_cc,
            "pressed": 127,
            "released": 0,
        },
        signature=f"cc:{sustain_channel - 1}:{sustain_cc}",
    ))

    # ─── KEYBOARD ───
    keyboard_config = config.get("keyboard", {})
    kbd_channel = int(keyboard_config.get("channel", 1))
    kbd_start, kbd_end = keyboard_config.get("note_range", [48, 72])
    map_start, map_end = keyboard_config.get("mapping_range", [0, 127])

    controls.append(Control(
        id="KEYBOARD",
        label="Keyboard MIDI",
        group=ControlGroup.KEYS,
        type=ControlType.KEYS_CHROMATIC,
        params={
            "count": int(kbd_end) - int(kbd_start) + 1,
            "start_note": int(kbd_start),
            "channel": kbd_channel,
            "physical_range": [int(kbd_start), int(kbd_end)],
            "mapping_range": [int(map_start), int(map_end)],
        },
    ))

    # ─── INTERNAL BUTTONS ───
    for cid, label in [
        ("OCTAVE_UP", "Octave +"),
        ("OCTAVE_DOWN", "Octave -"),
        ("TRANSPOSE_UP", "Transpose +"),
        ("TRANSPOSE_DOWN", "Transpose -"),
        ("PAD_BANK_BTN", "Pad Bank"),
        ("FULL_LEVEL", "Full Level"),
    ]:
        controls.append(Control(
            id=cid,
            label=label,
            group=ControlGroup.BUTTONS,
            type=ControlType.BUTTON_INTERNAL,
            params={},
        ))

    return DeviceLayout(name="StarryKey 25", author="Donner", controls=controls)


def _default_starrykey_config() -> dict:
    """Default factory configuration."""
    return {
        "keyboard": {
            "channel": 1,
            "note_range": [48, 72],
            "mapping_range": [0, 127],
        },
        "pads": {
            "channel": 10,
            "banks": {
                "A": [36, 37, 38, 39, 40, 41, 42, 43],
                "B": [44, 45, 46, 47, 48, 49, 50, 51],
                "C": [52, 53, 54, 55, 56, 57, 58, 59],
            },
        },
        "knobs": {"channel": 2, "cc_numbers": [20, 21, 22, 23]},
        "buttons": {"channel": 3, "cc_numbers": [59, 60, 61, 62], "mode": "toggle"},
        "pitch_bend": {"channel": 4},
        "modulation": {"channel": 5, "cc_number": 1},
        "sustain": {"channel": 1, "cc_number": 64},
    }


PRESETS = {}
