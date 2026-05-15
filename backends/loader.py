"""Carrega o backend certo pra plataforma detectada."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol

from core.capability import CapabilityRegistry, Platform, detect_platform


class BackendModule(Protocol):
    def declare_capabilities(self, registry: CapabilityRegistry) -> None: ...
    def services(self) -> dict[str, Any]: ...


@dataclass
class BackendBundle:
    platform: Platform
    module: BackendModule
    services: dict[str, Any]

    def get(self, name: str) -> Any:
        return self.services.get(name)


def load_backend(capabilities: CapabilityRegistry, platform: Platform | None = None) -> BackendBundle:
    platform = platform or detect_platform()
    if platform.os == "windows":
        from . import windows as module
    elif platform.os == "linux":
        from . import linux as module
    else:
        from . import noop as module  # type: ignore
    module.declare_capabilities(capabilities)
    return BackendBundle(platform=platform, module=module, services=module.services())
