"""Backend vazio pra plataformas sem suporte (ex.: macOS por enquanto)."""
from __future__ import annotations

from core.capability import CapabilityRegistry


def declare_capabilities(_registry: CapabilityRegistry) -> None:
    return


def services() -> dict:
    return {}
