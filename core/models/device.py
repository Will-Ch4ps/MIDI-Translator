"""Device e Control: estrutura física + visual do controlador."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ControlKind(str, Enum):
    """Ergonomia do controle (separado do sinal MIDI)."""
    PAD = "pad"
    KEY = "key"
    KNOB_ABS = "knob_abs"
    KNOB_REL = "knob_rel"
    FADER = "fader"
    BUTTON_TOGGLE = "button_toggle"
    BUTTON_MOMENTARY = "button_momentary"
    BUTTON_TRIGGER = "button_trigger"
    PITCH = "pitch"
    SUSTAIN = "sustain"


@dataclass
class Position:
    """Posição em unidades de grid abstratas (resiliente a zoom/DPI)."""
    x: float = 0.0
    y: float = 0.0
    w: float = 1.0
    h: float = 1.0

    def to_dict(self) -> dict:
        return {"x": self.x, "y": self.y, "w": self.w, "h": self.h}

    @classmethod
    def from_dict(cls, data: dict | None) -> "Position":
        data = data or {}
        return cls(
            x=float(data.get("x", 0.0)),
            y=float(data.get("y", 0.0)),
            w=float(data.get("w", 1.0)),
            h=float(data.get("h", 1.0)),
        )


@dataclass
class Control:
    id: str
    name: str = ""
    kind: ControlKind = ControlKind.BUTTON_MOMENTARY
    signature: str | None = None
    position: Position = field(default_factory=Position)
    group: str = ""
    params: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "kind": self.kind.value,
            "signature": self.signature,
            "position": self.position.to_dict(),
            "group": self.group,
            "params": self.params,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Control":
        try:
            kind = ControlKind(data.get("kind", ControlKind.BUTTON_MOMENTARY.value))
        except ValueError:
            kind = ControlKind.BUTTON_MOMENTARY
        return cls(
            id=str(data["id"]),
            name=str(data.get("name", data["id"])),
            kind=kind,
            signature=data.get("signature"),
            position=Position.from_dict(data.get("position")),
            group=str(data.get("group", "")),
            params=dict(data.get("params") or {}),
        )


@dataclass
class Device:
    id: str
    name: str
    author: str = ""
    controls: list[Control] = field(default_factory=list)
    state_machine: dict[str, Any] = field(default_factory=dict)
    description: str = ""

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "author": self.author,
            "description": self.description,
            "controls": [c.to_dict() for c in self.controls],
            "state_machine": self.state_machine,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Device":
        return cls(
            id=str(data["id"]),
            name=str(data.get("name", data["id"])),
            author=str(data.get("author", "")),
            description=str(data.get("description", "")),
            controls=[Control.from_dict(c) for c in data.get("controls", []) if isinstance(c, dict)],
            state_machine=dict(data.get("state_machine") or {}),
        )

    def find(self, control_id: str) -> Control | None:
        for control in self.controls:
            if control.id == control_id:
                return control
        return None

    def find_by_signature(self, signature: str) -> list[Control]:
        return [c for c in self.controls if c.signature == signature]
