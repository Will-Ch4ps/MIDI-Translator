"""Ações de teclas de mídia (play/pause/next/prev)."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent


def build(services: dict[str, Any]) -> Iterable[tuple[ActionDef, Any]]:
    keyboard = services.get("keyboard")
    yield _def("audio.media.play", "Play / Pause", "play"), _make(keyboard, "play/pause media")
    yield _def("audio.media.next", "Próxima", "skip-forward"), _make(keyboard, "next track")
    yield _def("audio.media.previous", "Anterior", "skip-back"), _make(keyboard, "previous track")


def _def(action_id: str, label: str, icon: str) -> ActionDef:
    return ActionDef(
        id=action_id,
        connector_id="audio",
        label=label,
        icon=icon,
        category="Mídia",
        capabilities=["keyboard.combo"],
    )


def _make(keyboard, combo: str):
    def handler(_action: Action, event: MidiEvent) -> None:
        if not keyboard or not event.pressed:
            return
        keyboard.press_combo(combo)
    return handler
