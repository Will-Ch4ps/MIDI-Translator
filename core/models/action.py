"""Action: id lógico estável + metadata rica + instância com params."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ParamField:
    """Descrição de um parâmetro aceito por uma ação."""
    name: str
    type: str = "string"  # string, int, float, bool, choice, key_combo, path, target
    label: str = ""
    description: str = ""
    default: Any = None
    required: bool = False
    choices: list[Any] = field(default_factory=list)
    min: float | None = None
    max: float | None = None

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "type": self.type,
            "label": self.label,
            "description": self.description,
            "default": self.default,
            "required": self.required,
            "choices": self.choices,
            "min": self.min,
            "max": self.max,
        }


@dataclass
class ParamsSchema:
    fields: list[ParamField] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {"fields": [f.to_dict() for f in self.fields]}


@dataclass
class ActionDef:
    """Define uma ação disponível. Vive no manifest do Connection."""
    id: str  # ex: "audio.volume.step"
    connector_id: str = ""
    label: str = ""
    description: str = ""
    icon: str = ""
    category: str = ""
    capabilities: list[str] = field(default_factory=list)
    platforms: list[str] = field(default_factory=lambda: ["windows", "linux"])
    params_schema: ParamsSchema = field(default_factory=ParamsSchema)
    example: str = ""
    continuous: bool = False  # aceita valor contínuo (knob/fader/pitch)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "connector_id": self.connector_id,
            "label": self.label,
            "description": self.description,
            "icon": self.icon,
            "category": self.category,
            "capabilities": self.capabilities,
            "platforms": self.platforms,
            "params_schema": self.params_schema.to_dict(),
            "example": self.example,
            "continuous": self.continuous,
        }


@dataclass
class Action:
    """Instância concreta de uma ação atrelada a um mapping."""
    id: str  # referencia ActionDef.id
    params: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {"id": self.id, "params": self.params}

    @classmethod
    def from_dict(cls, data: dict) -> "Action":
        return cls(id=str(data.get("id", "noop")), params=dict(data.get("params") or {}))
