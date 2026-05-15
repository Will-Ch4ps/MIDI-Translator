"""Ação noop — placeholder pra desativar mapping sem deletar."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent


def build(_services: dict[str, Any]) -> Iterable[tuple[ActionDef, Any]]:
    yield _noop_def(), _noop_handler


def _noop_def() -> ActionDef:
    return ActionDef(
        id="core.noop",
        connector_id="core",
        label="Não fazer nada",
        description="Placeholder — desativa o mapping sem removê-lo.",
        icon="circle-slash",
        category="Sistema",
        capabilities=[],
    )


def _noop_handler(_action: Action, _event: MidiEvent) -> None:
    return
