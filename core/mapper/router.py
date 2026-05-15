"""Route MIDI events to mapped actions."""
from __future__ import annotations

import sys
import time
from threading import Timer
from typing import Any

from ..device.models import Control, ControlType, control_priority
from ..midi.events import MidiEvent
from .models import Mapping, TriggerMode


class Router:
    def __init__(self, runner, bus) -> None:
        self._runner = runner
        self._bus = bus
        self._layout = None
        self._mappings: dict[str, dict[TriggerMode, Mapping]] = {}
        self._learn_mode = False
        self._pad_last: dict[str, float] = {}
        self._hold_timers: dict[str, Timer] = {}
        self._tap_timers: dict[str, Timer] = {}
        self._hold_tap: dict[str, tuple[Mapping, MidiEvent]] = {}
        self._press_events: dict[str, MidiEvent] = {}
        self._hold_fired: set[str] = set()
        self._double_consumed_release: set[str] = set()
        self._double_release_at: dict[str, float] = {}
        self._ignore_next_release: set[str] = set()
        self._debounce_ms = 70.0
        self._default_hold_ms = 350
        self._double_ms = 220
        self._double_min_gap_ms = 110

    def attach(self) -> None:
        self._bus.on("midi.event", self._on_event)

    def set_layout(self, layout) -> None:
        self._layout = layout

    def load_mappings(self, mappings: list[Mapping]) -> None:
        table: dict[str, dict[TriggerMode, Mapping]] = {}
        for mapping in mappings:
            table.setdefault(mapping.control_id, {})[mapping.trigger] = mapping
        self._mappings = table

    def upsert(self, mapping: Mapping) -> None:
        self._mappings.setdefault(mapping.control_id, {})[mapping.trigger] = mapping

    def remove(self, control_id: str, trigger: TriggerMode | None = None) -> None:
        if trigger is None:
            self._mappings.pop(control_id, None)
        else:
            scoped = self._mappings.get(control_id, {})
            scoped.pop(trigger, None)
            if not scoped and control_id in self._mappings:
                self._mappings.pop(control_id, None)
        self._clear_gesture_state(control_id)

    def set_learn(self, enabled: bool) -> None:
        self._learn_mode = enabled

    def _on_event(self, event: MidiEvent) -> None:
        try:
            if self._learn_mode:
                self._bus.emit("router.captured", event)
                return
            if not self._layout:
                return

            candidates = self._resolve_controls(event)
            if not candidates:
                return

            active_candidates = self._emit_active_controls(candidates, event)
            if not active_candidates:
                return

            control, scoped = self._resolve_mapped_control(active_candidates)
            if control and scoped:
                self._dispatch(control, scoped, event)

        except Exception as exc:  # noqa: BLE001
            print(f"[router] Erro ao processar evento: {exc}", file=sys.stderr, flush=True)

    def _resolve_controls(self, event: MidiEvent) -> list[Control]:
        signature = event.signature.key()
        if hasattr(self._layout, "find_all_by_signature"):
            matches = self._layout.find_all_by_signature(signature)
        else:
            matches = [
                control
                for control in getattr(self._layout, "controls", [])
                if getattr(control, "signature", None) == signature
            ]
        return sorted(matches, key=control_priority)

    def _emit_active_controls(self, controls: list[Control], event: MidiEvent) -> list[Control]:
        active: list[Control] = []
        for control in controls:
            if self._is_debounced_pad(control, event):
                continue
            self._bus.emit("router.control_active", (control.id, event))
            active.append(control)
        return active

    def _resolve_mapped_control(
        self,
        controls: list[Control],
    ) -> tuple[Control | None, dict[TriggerMode, Mapping] | None]:
        mapped = [control for control in controls if self._mappings.get(control.id)]
        if not mapped:
            return None, None
        mapped.sort(key=self._action_priority)
        control = mapped[0]
        return control, self._mappings[control.id]

    def _dispatch(self, control: Control, scoped: dict[TriggerMode, Mapping], event: MidiEvent) -> None:
        if event.is_continuous:
            self._dispatch_continuous(scoped, event)
            return

        if event.pressed:
            self._on_press(control.id, scoped, event)
            return
        self._on_release(control.id, scoped, event)

    def _dispatch_continuous(self, scoped: dict[TriggerMode, Mapping], event: MidiEvent) -> None:
        mapping = scoped.get(TriggerMode.PRESS) or scoped.get(TriggerMode.HOLD)
        if mapping:
            self._fire(mapping, event)

    def _on_press(self, control_id: str, scoped: dict[TriggerMode, Mapping], event: MidiEvent) -> None:
        hold_mapping = scoped.get(TriggerMode.HOLD)
        press_mapping = scoped.get(TriggerMode.PRESS)
        has_double = bool(scoped.get(TriggerMode.DOUBLE))

        if has_double and self._is_fast_double_repeat(control_id):
            self._ignore_next_release.add(control_id)
            return

        self._press_events[control_id] = event
        if hold_mapping:
            self._schedule_hold(control_id, hold_mapping, event)
            if press_mapping and not has_double:
                self._hold_tap[control_id] = (press_mapping, event)
            else:
                self._hold_tap.pop(control_id, None)
        else:
            self._cancel_hold(control_id)
            self._hold_tap.pop(control_id, None)

        if has_double:
            self._handle_double_press(control_id, scoped, event)
            return

        if press_mapping and not hold_mapping:
            self._fire(press_mapping, event)

    def _on_release(self, control_id: str, scoped: dict[TriggerMode, Mapping], event: MidiEvent) -> None:
        self._cancel_hold(control_id)
        hold_fired = control_id in self._hold_fired
        self._hold_fired.discard(control_id)
        if hold_fired:
            self._cancel_tap(control_id)
            self._hold_tap.pop(control_id, None)

        if control_id in self._ignore_next_release:
            self._ignore_next_release.discard(control_id)
            return

        release_mapping = scoped.get(TriggerMode.RELEASE)
        if release_mapping:
            self._fire(release_mapping, event)

        if hold_fired:
            self._press_events.pop(control_id, None)
            return

        if control_id in self._double_consumed_release:
            self._double_consumed_release.discard(control_id)
            self._press_events.pop(control_id, None)
            return

        press_mapping = scoped.get(TriggerMode.PRESS)
        if scoped.get(TriggerMode.DOUBLE) and press_mapping:
            press_event = self._press_events.get(control_id, event)
            self._double_release_at[control_id] = time.monotonic() * 1000.0
            self._schedule_tap_fallback(control_id, press_mapping, press_event)
            self._press_events.pop(control_id, None)
            return

        pending = self._hold_tap.pop(control_id, None)
        if pending:
            press_mapping, press_event = pending
            self._fire(press_mapping, press_event)
        self._press_events.pop(control_id, None)

    def _handle_double_press(self, control_id: str, scoped: dict[TriggerMode, Mapping], event: MidiEvent) -> None:
        double_mapping = scoped.get(TriggerMode.DOUBLE)
        if not double_mapping:
            return

        previous = self._tap_timers.pop(control_id, None)
        if previous:
            previous.cancel()
            self._double_consumed_release.add(control_id)
            self._double_release_at.pop(control_id, None)
            self._fire(double_mapping, event)
            self._press_events.pop(control_id, None)

    def _fire_tap(self, control_id: str, mapping: Mapping, event: MidiEvent) -> None:
        self._tap_timers.pop(control_id, None)
        self._double_release_at.pop(control_id, None)
        if control_id in self._hold_fired:
            return
        self._fire(mapping, event)

    def _schedule_tap_fallback(self, control_id: str, mapping: Mapping, event: MidiEvent) -> None:
        self._cancel_tap(control_id)
        timer = Timer(self._double_ms / 1000.0, self._fire_tap, args=(control_id, mapping, event))
        timer.daemon = True
        self._tap_timers[control_id] = timer
        timer.start()

    def _schedule_hold(self, control_id: str, mapping: Mapping, event: MidiEvent) -> None:
        self._cancel_hold(control_id)
        hold_ms = int(mapping.action.params.get("hold_ms", self._default_hold_ms) or self._default_hold_ms)
        hold_ms = max(120, min(8000, hold_ms))
        timer = Timer(hold_ms / 1000.0, self._fire_hold, args=(control_id, mapping, event))
        timer.daemon = True
        self._hold_timers[control_id] = timer
        timer.start()

    def _fire_hold(self, control_id: str, mapping: Mapping, event: MidiEvent) -> None:
        self._hold_timers.pop(control_id, None)
        self._hold_fired.add(control_id)
        self._cancel_tap(control_id)
        self._hold_tap.pop(control_id, None)
        self._fire(mapping, event)

    def _fire(self, mapping: Mapping, event: MidiEvent) -> None:
        self._runner.run(mapping.action, event)
        self._bus.emit("router.fired", (mapping, event))

    def _cancel_hold(self, control_id: str) -> None:
        timer = self._hold_timers.pop(control_id, None)
        if timer:
            timer.cancel()

    def _cancel_tap(self, control_id: str) -> None:
        timer = self._tap_timers.pop(control_id, None)
        if timer:
            timer.cancel()

    def _clear_gesture_state(self, control_id: str) -> None:
        self._cancel_hold(control_id)
        self._cancel_tap(control_id)
        self._hold_tap.pop(control_id, None)
        self._press_events.pop(control_id, None)
        self._hold_fired.discard(control_id)
        self._double_consumed_release.discard(control_id)
        self._double_release_at.pop(control_id, None)
        self._ignore_next_release.discard(control_id)

    def _is_debounced_pad(self, control: Control, event: MidiEvent) -> bool:
        if control.type not in (ControlType.PAD_BANK, ControlType.PAD_SINGLE):
            return False
        if not event.pressed:
            return False
        now = time.monotonic() * 1000.0
        last = self._pad_last.get(control.id, 0.0)
        if now - last < self._debounce_ms:
            return True
        self._pad_last[control.id] = now
        return False

    def _action_priority(self, control: Control) -> tuple[int, tuple[int, int, str]]:
        if control.type in (ControlType.PAD_BANK, ControlType.PAD_SINGLE):
            action_base = 0
        elif control.type in (ControlType.KEYS_CHROMATIC, ControlType.KEYS_WHITE):
            action_base = 20
        else:
            action_base = 10
        return (action_base, control_priority(control))

    def _is_fast_double_repeat(self, control_id: str) -> bool:
        if control_id not in self._tap_timers:
            return False
        released_at = self._double_release_at.get(control_id, 0.0)
        if released_at <= 0:
            return False
        gap = (time.monotonic() * 1000.0) - released_at
        return gap < self._double_min_gap_ms


def _debug_control(control: Any) -> str:
    return f"{getattr(control, 'id', '?')}:{getattr(control, 'signature', '?')}"
