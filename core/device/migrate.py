"""Migra layouts legacy v0.1 (ControlType) para o modelo v2 (ControlKind + Position).

Roda automaticamente no bootstrap quando encontra um JSON sem o marker
`_format: midi-studio.device.v2`. Posições visuais são derivadas pelo
`group`, `params.bank` e `params.position` ou `params.note`.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ..models import Control, ControlKind, Device, Position


_LEGACY_KIND_MAP = {
    "pad_bank": ControlKind.PAD,
    "pad_single": ControlKind.PAD,
    "knob_absolute": ControlKind.KNOB_ABS,
    "knob_relative": ControlKind.KNOB_REL,
    "fader": ControlKind.FADER,
    "pitch_bend": ControlKind.PITCH,
    "sustain": ControlKind.SUSTAIN,
    "button_momentary": ControlKind.BUTTON_MOMENTARY,
    "button_toggle": ControlKind.BUTTON_TOGGLE,
    "button_trigger": ControlKind.BUTTON_TRIGGER,
    "button_internal": ControlKind.BUTTON_MOMENTARY,
    "keys_chromatic": ControlKind.KEY,
    "keys_white": ControlKind.KEY,
}


def migrate_legacy_device(data: dict[str, Any], device_id: str) -> Device:
    """Converte um JSON legacy num Device do modelo novo."""
    controls: list[Control] = []
    for raw in data.get("controls", []):
        if not isinstance(raw, dict):
            continue
        legacy_type = str(raw.get("type", "")).lower()
        kind = _LEGACY_KIND_MAP.get(legacy_type, ControlKind.BUTTON_MOMENTARY)
        params = dict(raw.get("params") or {})

        if kind == ControlKind.KEY and "count" in params:
            controls.extend(_expand_keys(raw, params))
            continue
        if legacy_type == "button_internal":
            continue

        controls.append(Control(
            id=str(raw["id"]),
            name=str(raw.get("label", raw["id"])),
            kind=kind,
            signature=raw.get("signature"),
            position=_position_for(kind, raw, params),
            group=str(raw.get("group", "")),
            params=params,
        ))

    return Device(
        id=device_id,
        name=str(data.get("name", device_id)),
        author=str(data.get("author", "")),
        controls=controls,
    )


def _expand_keys(raw: dict[str, Any], params: dict[str, Any]) -> list[Control]:
    channel = int(params.get("channel", 1))
    start, end = _key_bounds(params)
    out: list[Control] = []
    for note in range(start, end + 1):
        out.append(Control(
            id=f"KEY_NOTE_{note}",
            name=_note_name(note),
            kind=ControlKind.KEY,
            signature=f"note:{channel - 1}:{note}",
            position=Position(x=float(note - start) * 0.55, y=8.0, w=0.5, h=2.4),
            group=str(raw.get("group", "keys")),
            params={"note": note, "channel": channel, "octave": note // 12 - 1},
        ))
    return out


def _key_bounds(params: dict[str, Any]) -> tuple[int, int]:
    mapping_range = params.get("mapping_range")
    if isinstance(mapping_range, (list, tuple)) and len(mapping_range) >= 2:
        return max(0, int(mapping_range[0])), min(127, int(mapping_range[1]))
    start = int(params.get("start_note", 0))
    count = int(params.get("count", 25))
    return start, min(127, start + count - 1)


_NOTE_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")


def _note_name(note: int) -> str:
    return f"{_NOTE_NAMES[note % 12]}{note // 12 - 1}"


def _position_for(kind: ControlKind, raw: dict, params: dict) -> Position:
    group = str(raw.get("group", ""))
    if kind == ControlKind.PAD:
        bank = str(params.get("bank", "A")).upper()
        bank_index = {"A": 0, "B": 1, "C": 2}.get(bank, 0)
        position = int(params.get("position", 0))
        col = position % 4
        row = position // 4
        return Position(x=4.0 + bank_index * 5.0 + col * 1.05, y=row * 1.05, w=1.0, h=1.0)
    if kind in (ControlKind.KNOB_ABS, ControlKind.KNOB_REL):
        idx = _knob_index(raw["id"])
        return Position(x=20.0 + idx * 1.35, y=0, w=1.2, h=1.2)
    if kind == ControlKind.FADER:
        idx = _knob_index(raw["id"])
        return Position(x=20.0 + idx * 1.2, y=2.0, w=0.9, h=2.4)
    if kind == ControlKind.PITCH:
        return Position(x=0, y=0, w=1.2, h=2.4)
    if kind == ControlKind.SUSTAIN:
        return Position(x=1.5, y=0, w=1.2, h=2.4)
    if group == "buttons":
        idx = _knob_index(raw["id"])
        return Position(x=20.0 + idx * 1.2, y=5.0, w=1.0, h=0.8)
    return Position(x=0, y=6, w=1, h=1)


def _knob_index(control_id: str) -> int:
    digits = "".join(ch for ch in control_id if ch.isdigit())
    return int(digits) - 1 if digits else 0


def autodiscover_legacy(root: Path) -> list[tuple[str, dict]]:
    """Lê devices/*.json e devolve [(id, data)] dos arquivos sem _format v2."""
    out: list[tuple[str, dict]] = []
    if not root.exists():
        return out
    for path in sorted(root.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if data.get("_format") == "midi-studio.device.v2":
            continue
        out.append((path.stem, data))
    return out
