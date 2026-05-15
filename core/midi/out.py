"""MIDI out — envia mensagens e dá feedback de LED em controladores."""
from __future__ import annotations

from typing import Optional

import mido

from ..models import MidiKind, MidiSignature


class MidiOut:
    """Wrapper sobre porta MIDI de saída.

    Uso típico:
        out = MidiOut()
        out.open("MPK Mini 3")
        out.send_note(channel=9, note=36, velocity=127)  # acende pad

    A maioria dos controladores acende LEDs respondendo às próprias
    mensagens (note_on/cc) que mandaria ao tocar — basta ecoar.
    """

    def __init__(self) -> None:
        self._port = None
        self._port_name: Optional[str] = None

    @property
    def is_open(self) -> bool:
        return self._port is not None

    @property
    def port_name(self) -> Optional[str]:
        return self._port_name

    def open(self, port_name: str) -> None:
        self.close()
        self._port = mido.open_output(port_name)
        self._port_name = port_name

    def close(self) -> None:
        if not self._port:
            return
        try:
            self._port.close()
        except Exception:  # noqa: BLE001
            pass
        self._port = None
        self._port_name = None

    def send_note(self, channel: int, note: int, velocity: int) -> None:
        if not self._port:
            return
        msg_type = "note_on" if velocity > 0 else "note_off"
        self._port.send(mido.Message(msg_type, channel=channel, note=note, velocity=max(0, min(127, velocity))))

    def send_cc(self, channel: int, cc: int, value: int) -> None:
        if not self._port:
            return
        self._port.send(mido.Message("control_change", channel=channel, control=cc, value=max(0, min(127, value))))

    def send_signature(self, signature: MidiSignature, value: int) -> None:
        if signature.kind == MidiKind.NOTE:
            self.send_note(signature.channel, signature.code, value)
        elif signature.kind == MidiKind.CC:
            self.send_cc(signature.channel, signature.code, value)


def list_output_ports() -> list[str]:
    try:
        return list(mido.get_output_names())
    except Exception:  # noqa: BLE001
        return []
