"""Manifest de uma conexão (metadados expostos pra UI)."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class ConnectionStatus(str, Enum):
    READY = "ready"          # tudo ok
    INSTALLED = "installed"  # detectado, mas precisa de setup
    OFFLINE = "offline"      # configurado, mas indisponível agora (ex: OBS fechado)
    ERROR = "error"          # erro permanente
    MISSING = "missing"      # nem instalado


@dataclass
class ConnectionManifest:
    id: str                   # ex: "obs", "audio", "core"
    name: str                 # display name
    description: str = ""
    icon: str = ""            # nome lucide ou path svg
    category: str = ""        # Streaming | Áudio | Sistema | ...
    requires_setup: bool = False
    auto_detect: bool = True
    docs_url: str = ""
    platforms: list[str] = field(default_factory=lambda: ["windows", "linux"])
    keywords: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "category": self.category,
            "requires_setup": self.requires_setup,
            "auto_detect": self.auto_detect,
            "docs_url": self.docs_url,
            "platforms": self.platforms,
            "keywords": self.keywords,
        }
