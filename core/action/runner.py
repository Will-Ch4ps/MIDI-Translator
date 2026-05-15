"""Despacha Action.id pro handler registrado."""
from __future__ import annotations

import sys

from ..models import Action, MidiEvent
from .registry import ActionRegistry


class ActionRunner:
    def __init__(self, registry: ActionRegistry) -> None:
        self._registry = registry

    def run(self, action: Action, event: MidiEvent) -> bool:
        """Executa a ação. Retorna True se houve handler que rodou."""
        if not self._registry.is_available(action.id):
            self._log_unavailable(action)
            return False

        handler = self._registry.get_handler(action.id)
        if not handler:
            print(f"[action] handler não registrado para {action.id}", file=sys.stderr, flush=True)
            return False

        try:
            handler(action, event)
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[action] {action.id} falhou: {exc}", file=sys.stderr, flush=True)
            return False

    def _log_unavailable(self, action: Action) -> None:
        reasons = self._registry.unavailable_reasons(action.id)
        joined = "; ".join(reasons) if reasons else "indisponível"
        print(f"[action] {action.id} ignorada ({joined})", file=sys.stderr, flush=True)
