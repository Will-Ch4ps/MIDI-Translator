"""Simple thread-safe event bus."""
from __future__ import annotations

import sys
import threading
from collections import defaultdict
from typing import Any, Callable, DefaultDict

Listener = Callable[[Any], None]


class EventBus:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._listeners: DefaultDict[str, list[Listener]] = defaultdict(list)

    def on(self, event: str, listener: Listener) -> Callable[[], None]:
        with self._lock:
            self._listeners[event].append(listener)

        def off() -> None:
            with self._lock:
                if listener in self._listeners[event]:
                    self._listeners[event].remove(listener)

        return off

    def emit(self, event: str, payload: Any = None) -> None:
        with self._lock:
            listeners = list(self._listeners[event])

        for listener in listeners:
            try:
                listener(payload)
            except Exception as exc:  # noqa: BLE001
                print(
                    f"[bus] listener failed for {event}: {exc}",
                    file=sys.stderr,
                    flush=True,
                )


bus = EventBus()
