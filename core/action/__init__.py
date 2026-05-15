"""Registry e runner de ações — agnóstico de plataforma."""
from .registry import ActionRegistry, Handler
from .runner import ActionRunner

__all__ = ["ActionRegistry", "ActionRunner", "Handler"]
