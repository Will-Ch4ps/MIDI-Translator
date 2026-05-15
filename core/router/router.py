"""Roteador novo: device + profile + layers + conditions + gestos."""
from __future__ import annotations

import sys
import time
from threading import Timer
from typing import Callable

from ..action import ActionRunner
from ..models import Control, Device, MidiEvent, Mapping, Profile, TriggerMode
from .conditions import evaluate_condition
from .layers import LayerState


class Router:
    def __init__(self, runner: ActionRunner, bus, context_provider: Callable[[], dict] | None = None) -> None:
        self._runner = runner
        self._bus = bus
        self._device: Device | None = None
        self._profile: Profile | None = None
        self._layer_state = LayerState()
        self._context_provider = context_provider or (lambda: {})
        self._mappings: dict[tuple[str, str], dict[TriggerMode, Mapping]] = {}
        self._learn_mode = False
        self._hold_timers: dict[str, Timer] = {}
        self._tap_timers: dict[str, Timer] = {}
        self._press_events: dict[str, MidiEvent] = {}
        self._hold_fired: set[str] = set()
        self._ignore_next_release: set[str] = set()
        self._pad_last: dict[str, float] = {}
        self._debounce_ms = 70.0
        self._default_hold_ms = 350
        self._double_ms = 220

    def attach(self) -> None:
        self._bus.on("midi.event", self._on_event)

    def set_device(self, device: Device | None) -> None:
        self._device = device

    def load_profile(self, profile: Profile | None) -> None:
        self._profile = profile
        self._layer_state.reset()
        self._rebuild_index()

    def set_learn(self, enabled: bool) -> None:
        self._learn_mode = enabled

    @property
    def layer_state(self) -> LayerState:
        return self._layer_state

    def _rebuild_index(self) -> None:
        index: dict[tuple[str, str], dict[TriggerMode, Mapping]] = {}
        if self._profile:
            for mapping in self._profile.mappings:
                key = (mapping.layer, mapping.control_id)
                index.setdefault(key, {})[mapping.trigger] = mapping
        self._mappings = index

    def _on_event(self, event: MidiEvent) -> None:
        try:
            if self._learn_mode:
                self._bus.emit("router.captured", event)
                return
            if not self._device or not self._profile:
                return
            for control in self._device.find_by_signature(event.signature.key()):
                self._handle_control(control, event)
        except Exception as exc:  # noqa: BLE001
            print(f"[router] erro: {exc}", file=sys.stderr, flush=True)

    def _handle_control(self, control: Control, event: MidiEvent) -> None:
        scoped = self._mappings.get((self._layer_state.current, control.id)) or self._mappings.get(("default", control.id))
        self._bus.emit("router.control_active", (control.id, event))
        if not scoped:
            self._bus.emit("router.no_mapping", (control.id, event))
            return
        if not self._condition_ok(scoped):
            return
        if event.is_continuous:
            mapping = scoped.get(TriggerMode.PRESS) or scoped.get(TriggerMode.HOLD)
            if mapping:
                self._fire(mapping, event)
            return
        if event.pressed:
            self._on_press(control.id, scoped, event)
        else:
            self._on_release(control.id, scoped, event)

    def _condition_ok(self, scoped: dict[TriggerMode, Mapping]) -> bool:
        sample = next(iter(scoped.values()))
        context = self._context_provider() or {}
        context.setdefault("layer_active", self._layer_state.current)
        return evaluate_condition(sample.condition, context)

    def _on_press(self, control_id: str, scoped: dict[TriggerMode, Mapping], event: MidiEvent) -> None:
        if self._is_debounced_pad(control_id, event):
            return
        self._press_events[control_id] = event
        hold = scoped.get(TriggerMode.HOLD)
        press = scoped.get(TriggerMode.PRESS)
        if hold:
            self._schedule_hold(control_id, hold, event)
        elif press:
            self._fire(press, event)

    def _on_release(self, control_id: str, scoped: dict[TriggerMode, Mapping], event: MidiEvent) -> None:
        self._cancel(self._hold_timers, control_id)
        held = control_id in self._hold_fired
        self._hold_fired.discard(control_id)
        if control_id in self._ignore_next_release:
            self._ignore_next_release.discard(control_id)
            return
        release_mapping = scoped.get(TriggerMode.RELEASE)
        if release_mapping:
            self._fire(release_mapping, event)
        if held:
            self._press_events.pop(control_id, None)
            return
        if scoped.get(TriggerMode.HOLD) and scoped.get(TriggerMode.PRESS):
            press_event = self._press_events.pop(control_id, event)
            self._fire(scoped[TriggerMode.PRESS], press_event)

    def _schedule_hold(self, control_id: str, mapping: Mapping, event: MidiEvent) -> None:
        self._cancel(self._hold_timers, control_id)
        hold_ms = int(mapping.action.params.get("hold_ms", self._default_hold_ms) or self._default_hold_ms)
        hold_ms = max(120, min(8000, hold_ms))
        timer = Timer(hold_ms / 1000.0, self._fire_hold, args=(control_id, mapping, event))
        timer.daemon = True
        self._hold_timers[control_id] = timer
        timer.start()

    def _fire_hold(self, control_id: str, mapping: Mapping, event: MidiEvent) -> None:
        self._hold_timers.pop(control_id, None)
        self._hold_fired.add(control_id)
        self._fire(mapping, event)

    def _fire(self, mapping: Mapping, event: MidiEvent) -> None:
        ok = self._runner.run(mapping.action, event)
        self._bus.emit("router.fired", (mapping, event, ok))

    @staticmethod
    def _cancel(timers: dict[str, Timer], control_id: str) -> None:
        timer = timers.pop(control_id, None)
        if timer:
            timer.cancel()

    def _is_debounced_pad(self, control_id: str, event: MidiEvent) -> bool:
        if not event.pressed:
            return False
        now = time.monotonic() * 1000.0
        last = self._pad_last.get(control_id, 0.0)
        if now - last < self._debounce_ms:
            return True
        self._pad_last[control_id] = now
        return False
