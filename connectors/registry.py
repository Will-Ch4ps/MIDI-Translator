"""Agrega connectors, expõe metadata + status pra UI."""
from __future__ import annotations

from typing import Any, Iterable

from core.action import ActionRegistry
from core.models import Recipe

from .base import Connector, register_connector
from .manifest import ConnectionManifest, ConnectionStatus


class ConnectorRegistry:
    def __init__(self, action_registry: ActionRegistry) -> None:
        self._action_registry = action_registry
        self._connectors: dict[str, Connector] = {}
        self._recipes: list[Recipe] = []
        self._action_counts: dict[str, int] = {}

    def add(self, connector: Connector, services: dict[str, Any]) -> None:
        connector.bind(services)
        cid = connector.manifest.id
        self._connectors[cid] = connector
        self._action_counts[cid] = register_connector(self._action_registry, connector)
        for recipe in connector.recipes():
            self._recipes.append(recipe)

    def add_many(self, connectors: Iterable[Connector], services: dict[str, Any]) -> None:
        for connector in connectors:
            self.add(connector, services)

    def all(self) -> list[Connector]:
        return list(self._connectors.values())

    def get(self, connector_id: str) -> Connector | None:
        return self._connectors.get(connector_id)

    def manifests(self) -> list[dict]:
        return [conn.manifest.to_dict() for conn in self._connectors.values()]

    def status_of(self, connector_id: str) -> ConnectionStatus:
        connector = self._connectors.get(connector_id)
        return connector.status() if connector else ConnectionStatus.MISSING

    def status_snapshot(self) -> dict[str, str]:
        return {cid: connector.status().value for cid, connector in self._connectors.items()}

    def action_count(self, connector_id: str) -> int:
        return self._action_counts.get(connector_id, 0)

    def recipes(self) -> list[Recipe]:
        return list(self._recipes)
