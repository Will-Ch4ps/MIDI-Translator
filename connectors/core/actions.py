"""Agrega ActionDefs do connector core (delegando a sub-módulos)."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import ActionDef

from . import keyboard_actions, mouse_actions, clipboard_actions, noop_actions


def build(services: dict[str, Any]) -> Iterable[tuple[ActionDef, Any]]:
    yield from keyboard_actions.build(services)
    yield from mouse_actions.build(services)
    yield from clipboard_actions.build(services)
    yield from noop_actions.build(services)
