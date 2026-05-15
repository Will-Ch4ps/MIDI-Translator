"""test_action / list_actions."""
from __future__ import annotations

import time
from typing import Any

from app.runtime import Runtime
from core.models import Action, MidiEvent, MidiKind, MidiSignature


def handle_test_action(runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    action_id = str(payload.get("action_id", "")).strip()
    if not action_id:
        raise ValueError("action_id obrigatório")
    params = dict(payload.get("params") or {})
    action = Action(id=action_id, params=params)
    fake_event = MidiEvent(
        signature=MidiSignature(MidiKind.NOTE, 0, 60),
        value=127,
        pressed=True,
        raw_type="note_on",
        timestamp_ms=time.monotonic() * 1000.0,
    )
    ran = runtime.runner.run(action, fake_event)
    return {"ran": bool(ran)}


def handle_list_actions(runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    connector_id = str(payload.get("connector_id", "")).strip()
    defs = runtime.actions.by_connector(connector_id) if connector_id else runtime.actions.all_defs()
    return {
        "actions": [d.to_dict() for d in defs],
        "available_ids": runtime.actions.available_ids(),
    }
