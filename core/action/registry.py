"""Registry de ActionDef + handlers vindos dos connectors."""
from __future__ import annotations

from typing import Callable, Protocol

from ..capability import CapabilityRegistry
from ..models import Action, ActionDef, MidiEvent


class Handler(Protocol):
    """Callable que executa uma ação concreta.

    Recebe (action, event). O event traz contexto (pressed, value, etc.);
    o handler decide se ignora ou usa.
    """

    def __call__(self, action: Action, event: MidiEvent) -> None: ...


class ActionRegistry:
    """Catálogo central de ações disponíveis no sistema.

    Cada connector chama `register(action_def, handler)` no carregamento.
    Ações que dependem de capabilities ausentes ficam visíveis mas marcadas
    como indisponíveis (frontend filtra por `available_ids`).
    """

    def __init__(self, capabilities: CapabilityRegistry) -> None:
        self._capabilities = capabilities
        self._defs: dict[str, ActionDef] = {}
        self._handlers: dict[str, Handler] = {}

    def register(self, definition: ActionDef, handler: Handler) -> None:
        self._defs[definition.id] = definition
        self._handlers[definition.id] = handler

    def unregister(self, action_id: str) -> None:
        self._defs.pop(action_id, None)
        self._handlers.pop(action_id, None)

    def get_def(self, action_id: str) -> ActionDef | None:
        return self._defs.get(action_id)

    def get_handler(self, action_id: str) -> Handler | None:
        return self._handlers.get(action_id)

    def all_defs(self) -> list[ActionDef]:
        return list(self._defs.values())

    def by_connector(self, connector_id: str) -> list[ActionDef]:
        return [d for d in self._defs.values() if d.connector_id == connector_id]

    def by_category(self, category: str) -> list[ActionDef]:
        return [d for d in self._defs.values() if d.category == category]

    def is_available(self, action_id: str) -> bool:
        definition = self._defs.get(action_id)
        if not definition:
            return False
        return self._capabilities.has_all(definition.capabilities)

    def available_ids(self) -> list[str]:
        return [d.id for d in self._defs.values() if self._capabilities.has_all(d.capabilities)]

    def unavailable_reasons(self, action_id: str) -> list[str]:
        definition = self._defs.get(action_id)
        if not definition:
            return ["action não registrada"]
        missing = [cid for cid in definition.capabilities if not self._capabilities.has(cid)]
        return [f"capability ausente: {cid}" for cid in missing]
