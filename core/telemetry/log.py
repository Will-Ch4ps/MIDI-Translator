"""Log circular dos últimos N eventos visível no Live Monitor."""
from __future__ import annotations

from collections import deque
from dataclasses import dataclass, field
from typing import Any

from ..models import MidiEvent


@dataclass
class LogEntry:
    timestamp_ms: float
    kind: str  # midi | mapped | fired | unmapped | error | info
    payload: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {"timestamp_ms": self.timestamp_ms, "kind": self.kind, "payload": self.payload}


class EventLog:
    def __init__(self, bus, capacity: int = 100) -> None:
        self._bus = bus
        self._entries: deque[LogEntry] = deque(maxlen=capacity)

    def attach(self) -> None:
        self._bus.on("midi.event", self._on_midi)
        self._bus.on("router.no_mapping", self._on_unmapped)
        self._bus.on("router.fired", self._on_fired)
        self._bus.on("midi.error", self._on_error)
        self._bus.on("midi.connected", lambda port: self._info(f"connected:{port}"))
        self._bus.on("midi.disconnected", lambda port: self._info(f"disconnected:{port}"))

    def snapshot(self) -> list[dict[str, Any]]:
        return [entry.to_dict() for entry in self._entries]

    def _push(self, entry: LogEntry) -> None:
        self._entries.append(entry)
        self._bus.emit("telemetry.log", entry.to_dict())

    def _on_midi(self, event: MidiEvent) -> None:
        self._push(LogEntry(event.timestamp_ms, "midi", {
            "signature": event.signature.key(),
            "value": event.value,
            "pressed": event.pressed,
        }))

    def _on_unmapped(self, payload) -> None:
        control_id, event = payload
        self._push(LogEntry(event.timestamp_ms, "unmapped", {
            "control_id": control_id,
            "signature": event.signature.key(),
        }))

    def _on_fired(self, payload) -> None:
        mapping, event, ok = payload
        self._push(LogEntry(event.timestamp_ms, "fired", {
            "control_id": getattr(mapping, "control_id", "?"),
            "action": getattr(getattr(mapping, "action", None), "id", "?"),
            "ok": bool(ok),
        }))

    def _on_error(self, message: str) -> None:
        self._push(LogEntry(0.0, "error", {"message": str(message)}))

    def _info(self, message: str) -> None:
        self._push(LogEntry(0.0, "info", {"message": message}))
