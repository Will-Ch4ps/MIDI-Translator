"""Registry de capabilities ativas — agregado dos backends carregados."""
from __future__ import annotations

from ..models import Capability


class CapabilityRegistry:
    """Mantém o conjunto de Capability disponíveis na plataforma atual.

    Backends chamam `declare()` no carregamento; ações verificam com
    `has()` antes de aparecer no catálogo do frontend.
    """

    def __init__(self) -> None:
        self._capabilities: dict[str, Capability] = {}

    def declare(self, capability: Capability) -> None:
        self._capabilities[capability.id] = capability

    def declare_many(self, capabilities: list[Capability]) -> None:
        for capability in capabilities:
            self.declare(capability)

    def has(self, capability_id: str) -> bool:
        return capability_id in self._capabilities

    def has_all(self, ids: list[str]) -> bool:
        return all(self.has(cid) for cid in ids)

    def get(self, capability_id: str) -> Capability | None:
        return self._capabilities.get(capability_id)

    def all(self) -> list[Capability]:
        return list(self._capabilities.values())

    def ids(self) -> list[str]:
        return sorted(self._capabilities.keys())

    def remove(self, capability_id: str) -> None:
        self._capabilities.pop(capability_id, None)

    def clear(self) -> None:
        self._capabilities.clear()
