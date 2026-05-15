"""Avaliação de Condition (always | app_focus | layer | time_range | env)."""
from __future__ import annotations

import datetime as _dt
import os

from ..models import Condition


def evaluate_condition(condition: Condition, context: dict) -> bool:
    """Retorna True se a condition é satisfeita.

    context fornece sinais externos: foreground_app, layer_active, env vars.
    """
    if not condition or condition.type == "always":
        return True

    handler = _HANDLERS.get(condition.type)
    if not handler:
        return False
    return handler(condition.params, context)


def _eval_app_focus(params: dict, context: dict) -> bool:
    expected = str(params.get("app", "")).strip().lower()
    if not expected:
        return True
    current = str(context.get("foreground_app", "")).strip().lower()
    return expected in current


def _eval_layer(params: dict, context: dict) -> bool:
    expected = str(params.get("layer", "")).strip()
    if not expected:
        return True
    return str(context.get("layer_active", "default")) == expected


def _eval_time_range(params: dict, _context: dict) -> bool:
    start = str(params.get("start", "00:00"))
    end = str(params.get("end", "23:59"))
    try:
        now = _dt.datetime.now().time()
        s = _dt.time.fromisoformat(start)
        e = _dt.time.fromisoformat(end)
    except (ValueError, TypeError):
        return True
    if s <= e:
        return s <= now <= e
    return now >= s or now <= e


def _eval_env(params: dict, _context: dict) -> bool:
    name = str(params.get("name", "")).strip()
    if not name:
        return True
    expected = params.get("equals")
    actual = os.environ.get(name)
    if expected is None:
        return actual is not None
    return str(actual) == str(expected)


_HANDLERS = {
    "app_focus": _eval_app_focus,
    "layer": _eval_layer,
    "time_range": _eval_time_range,
    "env": _eval_env,
}
