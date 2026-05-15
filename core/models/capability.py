"""Capability: contrato abstrato entre ações e backends de plataforma."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Capability:
    """Chave abstrata que um backend declara suportar.

    Ex: 'window.move', 'audio.per_app', 'system.lock'.
    Ações declaram quais capabilities exigem; backends declaram quais
    capabilities implementam. A interseção define o catálogo disponível
    naquela plataforma.
    """
    id: str
    label: str = ""
    description: str = ""

    def to_dict(self) -> dict:
        return {"id": self.id, "label": self.label, "description": self.description}
