"""MIDI input device discovery."""
from __future__ import annotations

import sys
from typing import Optional

import mido

_HINTS = ("starrykey", "starry key", "donner", "m-vave", "mvave")


def list_input_devices() -> list[str]:
    try:
        return list(mido.get_input_names())
    except Exception as exc:  # noqa: BLE001
        print(f"[midi] list error: {exc}", file=sys.stderr, flush=True)
        return []


def find_starrykey(devices: Optional[list[str]] = None) -> Optional[str]:
    names = devices if devices is not None else list_input_devices()

    for name in names:
        low = name.lower()
        if any(h in low for h in _HINTS):
            return name

    return None
