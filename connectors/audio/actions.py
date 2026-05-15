"""Agrega ActionDefs do connector audio."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import ActionDef

from . import volume_actions, media_actions, session_actions


def build(services: dict[str, Any]) -> Iterable[tuple[ActionDef, Any]]:
    yield from volume_actions.build(services)
    yield from media_actions.build(services)
    yield from session_actions.build(services)
