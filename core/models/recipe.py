"""Recipe e Preset Pack — macros nomeadas e pacotes temáticos."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class RecipeStep:
    """Passo dentro de uma recipe (macro complexa)."""
    kind: str  # action | delay | text | branch | loop | wait_event | sub_recipe
    params: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {"kind": self.kind, "params": self.params}

    @classmethod
    def from_dict(cls, data: dict) -> "RecipeStep":
        return cls(kind=str(data.get("kind", "action")), params=dict(data.get("params") or {}))


@dataclass
class Recipe:
    id: str
    name: str
    description: str = ""
    icon: str = ""
    steps: list[RecipeStep] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "steps": [step.to_dict() for step in self.steps],
        }


@dataclass
class PresetPackTarget:
    """Tipo de controle que um Preset Pack precisa pra aterrissar."""
    role: str  # pads | knobs | button | key | fader | any
    count: int = 1
    hint: str = ""

    def to_dict(self) -> dict:
        return {"role": self.role, "count": self.count, "hint": self.hint}


@dataclass
class PresetPackMapping:
    """Mapping declarado num Preset Pack — referenciado por role_index."""
    role_index: int
    trigger: str = "press"
    action_id: str = ""
    params: dict[str, Any] = field(default_factory=dict)
    label: str = ""

    def to_dict(self) -> dict:
        return {
            "role_index": self.role_index,
            "trigger": self.trigger,
            "action_id": self.action_id,
            "params": self.params,
            "label": self.label,
        }


@dataclass
class PresetPack:
    id: str
    name: str
    description: str = ""
    icon: str = ""
    category: str = ""
    requires_connections: list[str] = field(default_factory=list)
    suggested_targets: list[PresetPackTarget] = field(default_factory=list)
    mappings: list[PresetPackMapping] = field(default_factory=list)
    recipes: list[Recipe] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "category": self.category,
            "requires_connections": list(self.requires_connections),
            "suggested_targets": [t.to_dict() for t in self.suggested_targets],
            "mappings": [m.to_dict() for m in self.mappings],
            "recipes": [r.to_dict() for r in self.recipes],
        }
