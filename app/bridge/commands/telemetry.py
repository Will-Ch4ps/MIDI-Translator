"""telemetry_snapshot / log_snapshot."""
from __future__ import annotations

from typing import Any

from app.runtime import Runtime


def handle_telemetry_snapshot(runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    return runtime.telemetry.state.to_dict()


def handle_log_snapshot(runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    return {"entries": runtime.log.snapshot()}
