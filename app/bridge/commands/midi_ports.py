"""list_midi_ports: enumera portas MIDI de entrada/saída."""
from __future__ import annotations

from typing import Any

from app.runtime import Runtime


def handle_list_midi_ports(runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "inputs": runtime.midi_input_ports(),
        "outputs": runtime.midi_output_ports(),
    }
