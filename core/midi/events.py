"""MIDI event models."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class MidiKind(str, Enum):
    NOTE = "note"
    CC = "cc"
    PITCH = "pitch"
    PROGRAM = "program"


@dataclass(frozen=True)
class MidiSignature:
    kind: MidiKind
    channel: int
    code: int

    def key(self) -> str:
        return f"{self.kind.value}:{self.channel}:{self.code}"


@dataclass(frozen=True)
class MidiEvent:
    signature: MidiSignature
    value: int
    pressed: bool
    raw_type: str

    @property
    def is_continuous(self) -> bool:
        return self.signature.kind in (MidiKind.CC, MidiKind.PITCH)
