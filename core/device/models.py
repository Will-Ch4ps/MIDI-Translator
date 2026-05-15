"""Device layout data models."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ControlGroup(str, Enum):
    KEYS = "keys"
    PADS = "pads"
    KNOBS = "knobs"
    BUTTONS = "buttons"
    FADERS = "faders"
    SPECIAL = "special"


class ControlType(str, Enum):
    KEYS_CHROMATIC = "keys_chromatic"
    KEYS_WHITE = "keys_white"
    PAD_BANK = "pad_bank"
    PAD_SINGLE = "pad_single"
    KNOB_ABSOLUTE = "knob_absolute"
    KNOB_RELATIVE = "knob_relative"
    PITCH_BEND = "pitch_bend"
    FADER = "fader"
    BUTTON_MOMENTARY = "button_momentary"
    BUTTON_TOGGLE = "button_toggle"
    BUTTON_TRIGGER = "button_trigger"
    BUTTON_INTERNAL = "button_internal"
    SUSTAIN = "sustain"


@dataclass
class Control:
    id: str
    label: str = ""
    group: str = ""
    type: ControlType = ControlType.BUTTON_TRIGGER
    params: dict[str, Any] = field(default_factory=dict)
    signature: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Control":
        raw_type = data.get("type", ControlType.BUTTON_TRIGGER.value)

        try:
            control_type = ControlType(raw_type)
        except ValueError:
            control_type = ControlType.BUTTON_TRIGGER

        return cls(
            id=str(data.get("id", "")),
            label=str(data.get("label", data.get("id", ""))),
            group=str(data.get("group", "")),
            type=control_type,
            params=dict(data.get("params") or {}),
            signature=data.get("signature"),
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "group": self.group,
            "type": self.type.value,
            "params": self.params,
            "signature": self.signature,
        }


@dataclass
class DeviceLayout:
    name: str
    author: str = ""
    controls: list[Control] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "DeviceLayout":
        return cls(
            name=str(data.get("name", "")),
            author=str(data.get("author", "")),
            controls=[
                Control.from_dict(item)
                for item in data.get("controls", [])
                if isinstance(item, dict)
            ],
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "author": self.author,
            "controls": [control.to_dict() for control in self.controls],
        }

    def find_by_id(self, control_id: str) -> Control | None:
        for control in self.controls:
            if control.id == control_id:
                return control

        return None

    def find_all_by_signature(self, signature: str) -> list[Control]:
        """Return all controls that share a MIDI signature.

        Alguns controladores podem enviar pads e teclas como NOTE no mesmo canal.
        Nesses casos, o router precisa enxergar todos os candidatos e decidir
        com base em mappings existentes, tipo do controle e prioridade.
        """
        return [
            control
            for control in self.controls
            if control.signature == signature
        ]

    def find_by_signature(self, signature: str) -> Control | None:
        """Find the preferred control for a MIDI signature."""
        matches = self.find_all_by_signature(signature)

        if not matches:
            return None

        return sorted(matches, key=control_priority)[0]


def control_priority(control: Control) -> tuple[int, int, str]:
    """Lower tuple wins.

    Prioridade padrão:
    - pads físicos antes de teclas virtuais;
    - controles físicos antes de virtuais;
    - internos por último.

    O Router ainda pode sobrescrever isso quando existir mapping explícito.
    """
    explicit = control.params.get("priority")

    if explicit is not None:
        try:
            base = int(explicit)
        except (TypeError, ValueError):
            base = 50
    elif control.type in (ControlType.PAD_BANK, ControlType.PAD_SINGLE):
        base = 10
    elif control.type == ControlType.SUSTAIN:
        base = 20
    elif control.type in (
        ControlType.KNOB_ABSOLUTE,
        ControlType.KNOB_RELATIVE,
        ControlType.PITCH_BEND,
        ControlType.FADER,
        ControlType.BUTTON_MOMENTARY,
        ControlType.BUTTON_TOGGLE,
        ControlType.BUTTON_TRIGGER,
    ):
        base = 30
    elif control.type in (ControlType.KEYS_CHROMATIC, ControlType.KEYS_WHITE):
        base = 80
    elif control.type == ControlType.BUTTON_INTERNAL:
        base = 100
    else:
        base = 90

    virtual_penalty = 1 if control.params.get("virtual") else 0

    return (base, virtual_penalty, control.id)
