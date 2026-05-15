"""Infere ControlKind a partir de eventos MIDI capturados."""
from __future__ import annotations

from dataclasses import dataclass, field

from ...models import ControlKind, MidiEvent, MidiKind


@dataclass
class InferredControl:
    signature: str
    kind: ControlKind
    samples: int = 1
    min_value: int = 0
    max_value: int = 0
    has_variable_velocity: bool = False

    def merge(self, event: MidiEvent) -> None:
        self.samples += 1
        self.min_value = min(self.min_value, event.value)
        self.max_value = max(self.max_value, event.value)
        if event.signature.kind == MidiKind.NOTE and event.pressed and event.value not in (0, 127):
            self.has_variable_velocity = True


@dataclass
class _Bucket:
    """Acumula eventos por signature pra inferência mais robusta."""
    samples: list[MidiEvent] = field(default_factory=list)

    def add(self, event: MidiEvent) -> None:
        self.samples.append(event)


def infer_kind(events: list[MidiEvent]) -> ControlKind:
    """Decide o ControlKind a partir de uma sequência de eventos do mesmo signature."""
    if not events:
        return ControlKind.BUTTON_MOMENTARY

    first = events[0]
    kind = first.signature.kind

    if kind == MidiKind.PITCH:
        return ControlKind.PITCH

    if kind == MidiKind.NOTE:
        if _has_variable_velocity(events):
            return ControlKind.PAD
        return ControlKind.KEY

    if kind == MidiKind.CC:
        if first.signature.code == 64:
            return ControlKind.SUSTAIN
        return _infer_cc_kind(events)

    return ControlKind.BUTTON_MOMENTARY


def _has_variable_velocity(events: list[MidiEvent]) -> bool:
    velocities = {event.value for event in events if event.pressed}
    velocities.discard(0)
    velocities.discard(127)
    return len(velocities) >= 1


def _infer_cc_kind(events: list[MidiEvent]) -> ControlKind:
    values = [event.value for event in events]
    distinct = set(values)
    if distinct.issubset({0, 127}):
        return ControlKind.BUTTON_TOGGLE
    if len(distinct) >= 4 and (max(values) - min(values) >= 30):
        return ControlKind.KNOB_ABS
    if _looks_relative(values):
        return ControlKind.KNOB_REL
    return ControlKind.BUTTON_TOGGLE


def _looks_relative(values: list[int]) -> bool:
    """Knobs relativos costumam mandar valores em torno de 64 (signed)
    ou 1/127 (two's complement)."""
    if not values:
        return False
    centered = sum(1 for v in values if 60 <= v <= 68)
    return centered >= len(values) // 2
