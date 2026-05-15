"""Connectors — pacotes que registram ações e recipes no app.

Cada connector vive em `connectors/<id>/` com:
- `manifest.py`  → ConnectionManifest (id, nome, ícone, status, deps)
- `actions.py`   → ActionDef list + handlers
- `recipes.py`   → Recipes pré-prontas (opcional)
- `setup.py`     → wizard de conexão (opcional)
"""
from .base import Connector
from .manifest import ConnectionManifest, ConnectionStatus
from .registry import ConnectorRegistry

__all__ = ["Connector", "ConnectionManifest", "ConnectionStatus", "ConnectorRegistry"]
