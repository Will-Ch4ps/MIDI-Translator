"""MIDI listener callback-based (substitui o polling do legacy)."""
from __future__ import annotations

import time
from typing import Optional

import mido

from ..models import MidiEvent, MidiKind, MidiSignature


class MidiListener:
    """Abre uma porta MIDI e dispara `midi.event` no bus por callback.

    `mido.open_input(callback=…)` aciona o callback na thread interna do
    backend MIDI — sem polling. Cada msg decodificada vira `MidiEvent`
    com `timestamp_ms`.
    """

    def __init__(self, bus) -> None:
        self._bus = bus
        self._port = None
        self._port_name: Optional[str] = None

    @property
    def is_running(self) -> bool:
        return self._port is not None

    @property
    def port_name(self) -> Optional[str]:
        return self._port_name

    def start(self, port_name: str) -> None:
        self.stop()
        try:
            self._port = mido.open_input(port_name, callback=self._on_message)
            self._port_name = port_name
            self._bus.emit("midi.connected", port_name)
        except Exception as exc:  # noqa: BLE001
            self._bus.emit("midi.error", f"open {port_name}: {exc}")

    def stop(self) -> None:
        if not self._port:
            return
        try:
            self._port.close()
        except Exception:  # noqa: BLE001
            pass
        previous = self._port_name
        self._port = None
        self._port_name = None
        if previous:
            self._bus.emit("midi.disconnected", previous)

    def _on_message(self, msg) -> None:
        event = decode_message(msg, port_id=self._port_name or "")
        if event:
            self._bus.emit("midi.event", event)


def decode_message(msg, port_id: str = "") -> MidiEvent | None:
    """Converte uma mensagem `mido` em `MidiEvent`."""
    timestamp_ms = time.monotonic() * 1000.0

    if msg.type == "note_on" and msg.velocity > 0:
        sig = MidiSignature(MidiKind.NOTE, msg.channel, msg.note)
        return MidiEvent(sig, msg.velocity, True, "note_on", timestamp_ms, port_id)
    if msg.type == "note_off":
        sig = MidiSignature(MidiKind.NOTE, msg.channel, msg.note)
        return MidiEvent(sig, getattr(msg, "velocity", 0), False, "note_off", timestamp_ms, port_id)
    if msg.type == "note_on" and msg.velocity == 0:
        sig = MidiSignature(MidiKind.NOTE, msg.channel, msg.note)
        return MidiEvent(sig, 0, False, "note_off", timestamp_ms, port_id)
    if msg.type == "control_change":
        sig = MidiSignature(MidiKind.CC, msg.channel, msg.control)
        return MidiEvent(sig, msg.value, msg.value > 0, "control_change", timestamp_ms, port_id)
    if msg.type == "pitchwheel":
        sig = MidiSignature(MidiKind.PITCH, msg.channel, 0)
        return MidiEvent(sig, msg.pitch, msg.pitch != 0, "pitchwheel", timestamp_ms, port_id)
    if msg.type == "program_change":
        sig = MidiSignature(MidiKind.PROGRAM, msg.channel, msg.program)
        return MidiEvent(sig, msg.program, True, "program_change", timestamp_ms, port_id)
    if msg.type == "aftertouch":
        sig = MidiSignature(MidiKind.AFTERTOUCH, msg.channel, 0)
        return MidiEvent(sig, msg.value, msg.value > 0, "aftertouch", timestamp_ms, port_id)
    return None
