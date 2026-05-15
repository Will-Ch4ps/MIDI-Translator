"""Keyboard output helper."""
from __future__ import annotations

import time

import keyboard as kb

_ALIASES = {
    "win": "windows",
    "cmd": "windows",
    "meta": "windows",
    "bksp": "backspace",
    "caps": "caps lock",
    "return": "enter",
    "spacebar": "space",
}


class KeyboardEmitter:
    def press_combo(self, combo: str) -> None:
        parsed = self._normalize_combo(combo)
        if parsed:
            kb.send(parsed, do_press=True, do_release=True)

    def hold(self, combo: str) -> None:
        parsed = self._normalize_combo(combo)
        for token in self._tokens(parsed):
            kb.press(token)

    def release(self, combo: str) -> None:
        parsed = self._normalize_combo(combo)
        for token in reversed(self._tokens(parsed)):
            kb.release(token)

    def play_macro(self, steps: list[dict]) -> None:
        for step in steps:
            combo = str(step.get("combo", "")).strip()
            if combo:
                self.press_combo(combo)
            delay = int(step.get("delay_ms", 0))
            if delay > 0:
                time.sleep(delay / 1000.0)

    def _normalize_combo(self, combo: str) -> str:
        tokens = [self._normalize_token(t) for t in self._tokens(combo)]
        return "+".join(t for t in tokens if t)

    @staticmethod
    def _tokens(combo: str) -> list[str]:
        return [t.strip() for t in combo.split("+") if t.strip()]

    @staticmethod
    def _normalize_token(token: str) -> str:
        low = token.strip().lower()
        return _ALIASES.get(low, low)
