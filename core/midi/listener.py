"""Background MIDI listener."""
from __future__ import annotations

import threading
from typing import Optional

import mido

from .events import MidiEvent, MidiKind, MidiSignature


class MidiListener:
    def __init__(self, bus) -> None:
        self._bus = bus
        self._thread: Optional[threading.Thread] = None
        self._stop = threading.Event()
        self._port_name: Optional[str] = None

    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self, port_name: str) -> None:
        self.stop()
        self._port_name = port_name
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, args=(port_name,), daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        self._thread = None
        self._port_name = None

    def _run(self, port_name: str) -> None:
        try:
            with mido.open_input(port_name) as port:
                self._bus.emit("midi.connected", port_name)
                while not self._stop.is_set():
                    for msg in port.iter_pending():
                        event = self._decode(msg)
                        if event:
                            self._bus.emit("midi.event", event)
                    self._stop.wait(0.002)
        except Exception as exc:  # noqa: BLE001
            self._bus.emit("midi.error", str(exc))
        finally:
            self._bus.emit("midi.disconnected", port_name)

    @staticmethod
    def _decode(msg) -> Optional[MidiEvent]:
        # NOTE ON com velocity > 0
        if msg.type == "note_on" and msg.velocity > 0:
            sig = MidiSignature(MidiKind.NOTE, msg.channel, msg.note)
            return MidiEvent(sig, msg.velocity, True, "note_on")

        # NOTE OFF explícito
        if msg.type == "note_off":
            sig = MidiSignature(MidiKind.NOTE, msg.channel, msg.note)
            return MidiEvent(sig, getattr(msg, 'velocity', 0), False, "note_off")
        
        # NOTE ON com velocity=0 (equivalente a note_off)
        if msg.type == "note_on" and msg.velocity == 0:
            sig = MidiSignature(MidiKind.NOTE, msg.channel, msg.note)
            return MidiEvent(sig, 0, False, "note_off")

        # CONTROL CHANGE
        if msg.type == "control_change":
            sig = MidiSignature(MidiKind.CC, msg.channel, msg.control)
            return MidiEvent(sig, msg.value, msg.value > 0, msg.type)

        # PITCH BEND
        if msg.type == "pitchwheel":
            sig = MidiSignature(MidiKind.PITCH, msg.channel, 0)
            return MidiEvent(sig, msg.pitch, msg.pitch != 0, msg.type)

        # PROGRAM CHANGE
        if msg.type == "program_change":
            sig = MidiSignature(MidiKind.PROGRAM, msg.channel, msg.program)
            return MidiEvent(sig, msg.program, True, msg.type)

        return None
