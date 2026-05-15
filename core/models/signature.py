"""Assinatura MIDI canônica (kind:channel:code)."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class MidiKind(str, Enum):
    NOTE = "note"
    CC = "cc"
    PITCH = "pitch"
    PROGRAM = "program"
    AFTERTOUCH = "aftertouch"
    SYSEX = "sysex"


@dataclass(frozen=True)
class MidiSignature:
    kind: MidiKind
    channel: int
    code: int

    def key(self) -> str:
        return f"{self.kind.value}:{self.channel}:{self.code}"

    @classmethod
    def parse(cls, key: str) -> "MidiSignature":
        parts = key.split(":")
        if len(parts) != 3:
            raise ValueError(f"signature inválida: {key!r}")
        return cls(MidiKind(parts[0]), int(parts[1]), int(parts[2]))

    def to_dict(self) -> dict:
        return {"kind": self.kind.value, "channel": self.channel, "code": self.code}

    @classmethod
    def from_dict(cls, data: dict) -> "MidiSignature":
        return cls(MidiKind(data["kind"]), int(data["channel"]), int(data["code"]))
