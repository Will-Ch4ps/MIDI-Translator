"""start_listener / stop_listener."""
from __future__ import annotations

from typing import Any

from app.runtime import Runtime


def handle_start_listener(runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    port = str(payload.get("port", "")).strip()
    if not port:
        ports = runtime.midi_input_ports()
        if not ports:
            raise RuntimeError("nenhuma porta MIDI disponível")
        port = ports[0]
    runtime.listener.start(port)
    return {"port": port, "running": runtime.listener.is_running}


def handle_stop_listener(runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    runtime.listener.stop()
    return {"running": runtime.listener.is_running}
