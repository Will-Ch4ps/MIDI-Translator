"""Profile, Layer, Mapping e Condition."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from .action import Action


class TriggerMode(str, Enum):
    PRESS = "press"
    RELEASE = "release"
    HOLD = "hold"
    DOUBLE = "double"


@dataclass
class Condition:
    """Predicado opcional que precisa ser verdade pro mapping disparar."""
    type: str = "always"  # always | app_focus | layer | time_range | env
    params: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {"type": self.type, "params": self.params}

    @classmethod
    def from_dict(cls, data: dict | None) -> "Condition":
        data = data or {}
        return cls(type=str(data.get("type", "always")), params=dict(data.get("params") or {}))


@dataclass
class Layer:
    id: str
    name: str = ""
    color: str = ""
    description: str = ""

    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name, "color": self.color, "description": self.description}

    @classmethod
    def from_dict(cls, data: dict) -> "Layer":
        return cls(
            id=str(data["id"]),
            name=str(data.get("name", data["id"])),
            color=str(data.get("color", "")),
            description=str(data.get("description", "")),
        )


@dataclass
class Mapping:
    control_id: str
    action: Action
    trigger: TriggerMode = TriggerMode.PRESS
    label: str = ""
    layer: str = "default"
    condition: Condition = field(default_factory=Condition)
    tags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "control_id": self.control_id,
            "action": self.action.to_dict(),
            "trigger": self.trigger.value,
            "label": self.label,
            "layer": self.layer,
            "condition": self.condition.to_dict(),
            "tags": list(self.tags),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Mapping":
        try:
            trigger = TriggerMode(str(data.get("trigger", "press")))
        except ValueError:
            trigger = TriggerMode.PRESS
        return cls(
            control_id=str(data.get("control_id", "")),
            action=Action.from_dict(data.get("action") or {}),
            trigger=trigger,
            label=str(data.get("label", "")),
            layer=str(data.get("layer", "default")),
            condition=Condition.from_dict(data.get("condition")),
            tags=list(data.get("tags") or []),
        )


@dataclass
class Profile:
    name: str
    device_id: str = ""
    layers: list[Layer] = field(default_factory=lambda: [Layer(id="default", name="Default")])
    mappings: list[Mapping] = field(default_factory=list)
    active_layer: str = "default"
    requires_connections: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "device_id": self.device_id,
            "layers": [layer.to_dict() for layer in self.layers],
            "mappings": [m.to_dict() for m in self.mappings],
            "active_layer": self.active_layer,
            "requires_connections": list(self.requires_connections),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Profile":
        layers_raw = data.get("layers") or []
        layers = [Layer.from_dict(layer) for layer in layers_raw if isinstance(layer, dict)]
        if not layers:
            layers = [Layer(id="default", name="Default")]
        return cls(
            name=str(data.get("name", "default")),
            device_id=str(data.get("device_id", "")),
            layers=layers,
            mappings=[Mapping.from_dict(m) for m in data.get("mappings", []) if isinstance(m, dict)],
            active_layer=str(data.get("active_layer", "default")),
            requires_connections=list(data.get("requires_connections") or []),
        )
