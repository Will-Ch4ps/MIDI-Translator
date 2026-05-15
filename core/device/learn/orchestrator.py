"""Orquestra o fluxo do Learn Wizard.

O frontend chama `start()`, depois `advance_phase()` entre etapas (pads,
knobs, teclado, botões, pitch). Cada evento MIDI passa por `consume_event`.
No fim, `finalize()` devolve um Device pronto pra salvar.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from ...models import Control, ControlKind, Device, MidiEvent
from .autolayout import auto_layout
from .inference import infer_kind


class LearnPhase(str, Enum):
    PADS = "pads"
    KNOBS = "knobs"
    KEYS = "keys"
    BUTTONS = "buttons"
    SPECIAL = "special"
    DONE = "done"


_PHASE_ORDER: list[LearnPhase] = [
    LearnPhase.PADS,
    LearnPhase.KNOBS,
    LearnPhase.KEYS,
    LearnPhase.BUTTONS,
    LearnPhase.SPECIAL,
    LearnPhase.DONE,
]


@dataclass
class LearnOrchestrator:
    device_id: str
    device_name: str
    author: str = ""
    phase: LearnPhase = LearnPhase.PADS
    samples: dict[str, list[MidiEvent]] = field(default_factory=dict)
    overrides: dict[str, ControlKind] = field(default_factory=dict)

    def start(self) -> None:
        self.phase = LearnPhase.PADS
        self.samples.clear()
        self.overrides.clear()

    def consume_event(self, event: MidiEvent) -> str:
        """Acumula evento e retorna a signature recém-atualizada."""
        signature = event.signature.key()
        self.samples.setdefault(signature, []).append(event)
        return signature

    def advance_phase(self) -> LearnPhase:
        index = _PHASE_ORDER.index(self.phase)
        next_index = min(index + 1, len(_PHASE_ORDER) - 1)
        self.phase = _PHASE_ORDER[next_index]
        return self.phase

    def override_kind(self, signature: str, kind: ControlKind) -> None:
        self.overrides[signature] = kind

    def preview(self) -> list[Control]:
        controls: list[Control] = []
        for index, (signature, events) in enumerate(self.samples.items()):
            kind = self.overrides.get(signature) or infer_kind(events)
            controls.append(Control(
                id=_synthesize_id(kind, index, signature),
                name=_label_for(kind, signature),
                kind=kind,
                signature=signature,
                group=_group_for(kind),
                params=_params_for(kind, events),
            ))
        return controls

    def finalize(self) -> Device:
        controls = auto_layout(self.preview())
        return Device(id=self.device_id, name=self.device_name, author=self.author, controls=controls)


def _synthesize_id(kind: ControlKind, index: int, signature: str) -> str:
    prefix = {
        ControlKind.PAD: "PAD",
        ControlKind.KEY: "KEY",
        ControlKind.KNOB_ABS: "KNOB",
        ControlKind.KNOB_REL: "KNOB",
        ControlKind.FADER: "FADER",
        ControlKind.BUTTON_TOGGLE: "BTN",
        ControlKind.BUTTON_MOMENTARY: "BTN",
        ControlKind.BUTTON_TRIGGER: "BTN",
        ControlKind.PITCH: "PITCH",
        ControlKind.SUSTAIN: "SUSTAIN",
    }.get(kind, "CTRL")
    return f"{prefix}_{index + 1}"


def _label_for(kind: ControlKind, signature: str) -> str:
    parts = signature.split(":")
    if len(parts) == 3:
        return f"{kind.value} {parts[2]}"
    return kind.value


def _group_for(kind: ControlKind) -> str:
    return {
        ControlKind.PAD: "pads",
        ControlKind.KEY: "keys",
        ControlKind.KNOB_ABS: "knobs",
        ControlKind.KNOB_REL: "knobs",
        ControlKind.FADER: "faders",
        ControlKind.BUTTON_TOGGLE: "buttons",
        ControlKind.BUTTON_MOMENTARY: "buttons",
        ControlKind.BUTTON_TRIGGER: "buttons",
        ControlKind.PITCH: "special",
        ControlKind.SUSTAIN: "special",
    }.get(kind, "other")


def _params_for(kind: ControlKind, events: list[MidiEvent]) -> dict:
    if not events:
        return {}
    first = events[0]
    params: dict = {"channel": first.signature.channel + 1}
    if kind in (ControlKind.PAD, ControlKind.KEY):
        params["note"] = first.signature.code
    elif kind in (ControlKind.KNOB_ABS, ControlKind.KNOB_REL, ControlKind.SUSTAIN,
                  ControlKind.BUTTON_TOGGLE, ControlKind.BUTTON_MOMENTARY, ControlKind.BUTTON_TRIGGER):
        params["cc"] = first.signature.code
    return params
