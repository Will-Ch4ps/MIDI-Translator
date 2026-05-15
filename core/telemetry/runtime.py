"""Estado em tempo real exibido no canvas e Live Monitor."""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

from ..models import Mapping, MidiEvent


@dataclass
class RuntimeState:
    active_controls: set[str] = field(default_factory=set)
    knob_values: dict[str, int] = field(default_factory=dict)
    active_layer: str = "default"
    last_event_ms: float = 0.0
    last_fired_ms: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "active_controls": sorted(self.active_controls),
            "knob_values": dict(self.knob_values),
            "active_layer": self.active_layer,
            "last_event_ms": self.last_event_ms,
            "last_fired_ms": self.last_fired_ms,
        }


class RuntimeTelemetry:
    """Mantém RuntimeState observando o EventBus.

    Substitui o `runtime_telemetry.py` legacy: nada de campos hardcoded
    do StarryKey — apenas conceitos genéricos (controles ativos, valores
    de knob, layer ativa).
    """

    def __init__(self, bus, layer_lookup=None) -> None:
        self._bus = bus
        self._layer_lookup = layer_lookup or (lambda: "default")
        self.state = RuntimeState()

    def attach(self) -> None:
        self._bus.on("router.control_active", self._on_control)
        self._bus.on("router.fired", self._on_fired)
        self._bus.on("midi.connected", self._on_connected)
        self._bus.on("midi.disconnected", self._on_disconnected)

    def _on_control(self, payload) -> None:
        control_id, event = payload
        self.state.last_event_ms = event.timestamp_ms or time.monotonic() * 1000.0
        self.state.active_layer = self._layer_lookup()
        if event.is_continuous:
            self.state.knob_values[control_id] = int(event.value)
            self.state.active_controls.discard(control_id)
        elif event.pressed:
            self.state.active_controls.add(control_id)
        else:
            self.state.active_controls.discard(control_id)
        self._bus.emit("telemetry.state", self.state.to_dict())

    def _on_fired(self, payload) -> None:
        mapping, event, _ok = payload
        self.state.last_fired_ms = event.timestamp_ms or time.monotonic() * 1000.0
        self._bus.emit("telemetry.fired", {
            "mapping": mapping.to_dict() if isinstance(mapping, Mapping) else None,
            "event": event.to_dict() if isinstance(event, MidiEvent) else None,
        })

    def _on_connected(self, port_name: str) -> None:
        self._bus.emit("telemetry.connection", {"status": "connected", "port": port_name})

    def _on_disconnected(self, port_name: str) -> None:
        self._bus.emit("telemetry.connection", {"status": "disconnected", "port": port_name})
