"""Evento MIDI normalizado distribuído pelo EventBus."""
from __future__ import annotations

from dataclasses import dataclass, field
from .signature import MidiKind, MidiSignature


@dataclass(frozen=True)
class MidiEvent:
    signature: MidiSignature
    value: int
    pressed: bool
    raw_type: str
    timestamp_ms: float = 0.0
    port_id: str = ""

    @property
    def is_continuous(self) -> bool:
        return self.signature.kind in (MidiKind.CC, MidiKind.PITCH, MidiKind.AFTERTOUCH)

    def to_dict(self) -> dict:
        return {
            "signature": self.signature.to_dict(),
            "value": self.value,
            "pressed": self.pressed,
            "raw_type": self.raw_type,
            "timestamp_ms": self.timestamp_ms,
            "port_id": self.port_id,
        }
