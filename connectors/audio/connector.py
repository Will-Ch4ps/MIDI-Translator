"""Connector audio — volume, mute, mídia."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import ActionDef, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus
from . import actions as actions_module


class AudioConnector:
    manifest = ConnectionManifest(
        id="audio",
        name="Áudio",
        description="Volume master, volume por aplicação, mute e teclas de mídia.",
        icon="volume-2",
        category="Áudio",
        requires_setup=False,
        auto_detect=True,
        keywords=["volume", "mute", "música", "spotify", "discord", "som"],
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
        volume = self._services.get("volume")
        if volume and getattr(volume, "available", False):
            return ConnectionStatus.READY
        return ConnectionStatus.OFFLINE
