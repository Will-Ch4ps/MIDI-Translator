"""Connector core — ações universais que existem em qualquer plataforma."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import ActionDef, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus
from . import actions as actions_module


class CoreConnector:
    manifest = ConnectionManifest(
        id="core",
        name="Atalhos & Teclado",
        description="Combos de teclado, digitar texto, macros, mouse e clipboard.",
        icon="keyboard",
        category="Sistema",
        requires_setup=False,
        auto_detect=True,
        keywords=["teclado", "atalho", "mouse", "clipboard", "macro", "texto"],
    )

    def __init__(self) -> None:
        self._services: dict[str, Any] = {}

    def bind(self, services: dict[str, Any]) -> None:
        self._services = services

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        yield from actions_module.build(self._services)

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        keyboard = self._services.get("keyboard")
        if keyboard and getattr(keyboard, "available", False):
            return ConnectionStatus.READY
        return ConnectionStatus.OFFLINE
