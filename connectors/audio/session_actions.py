"""Descoberta de sessões de áudio (debug)."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent


def build(services: dict[str, Any]) -> Iterable[tuple[ActionDef, Any]]:
    volume = services.get("volume")
    yield _list_def(), _make_list(volume)


def _list_def() -> ActionDef:
    return ActionDef(
        id="audio.sessions.list",
        connector_id="audio",
        label="Listar sessões (debug)",
        description="Imprime no log de eventos as sessões de áudio ativas.",
        icon="list",
        category="Áudio",
        capabilities=["audio.discovery"],
    )


def _make_list(volume):
    def handler(_action: Action, event: MidiEvent) -> None:
        if not volume or not event.pressed:
            return
        sessions = volume.list_sessions()
        names = ", ".join(s.get("name", "?") for s in sessions) or "(nenhuma sessão)"
        print(f"[audio] sessions: {names}")
    return handler
