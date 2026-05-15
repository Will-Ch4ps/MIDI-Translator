"""Contrato comum dos connectors."""
from __future__ import annotations

from typing import Any, Iterable, Protocol

from core.action import ActionRegistry
from core.models import ActionDef, Recipe

from .manifest import ConnectionManifest, ConnectionStatus


class Connector(Protocol):
    """Interface que um connector implementa.

    Estrutura mínima de um connector:
    1. `manifest`           — metadata expostos pra UI.
    2. `bind(services)`     — recebe os services do backend de plataforma.
    3. `actions()`          — retorna pares (ActionDef, handler) pra registrar.
    4. `recipes()`          — opcional, recipes pré-prontas.
    5. `status()`           — atual status (READY/INSTALLED/OFFLINE/ERROR/MISSING).
    """

    manifest: ConnectionManifest

    def bind(self, services: dict[str, Any]) -> None: ...

    def actions(self) -> Iterable[tuple[ActionDef, Any]]: ...

    def recipes(self) -> Iterable[Recipe]: ...

    def status(self) -> ConnectionStatus: ...


def register_connector(registry: ActionRegistry, connector: Connector) -> int:
    """Registra todas as actions de um connector. Retorna quantas foram aceitas."""
    count = 0
    for definition, handler in connector.actions():
        registry.register(definition, handler)
        count += 1
    return count
