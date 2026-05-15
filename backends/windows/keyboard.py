"""Emissão de teclas via lib `keyboard` (Windows SendInput)."""
from __future__ import annotations

import time

try:
    import keyboard as _kb
except Exception:  # noqa: BLE001
    _kb = None


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
    @property
    def available(self) -> bool:
        return _kb is not None

    def press_combo(self, combo: str) -> None:
        if not _kb:
            return
        parsed = _normalize_combo(combo)
        if parsed:
            _kb.send(parsed, do_press=True, do_release=True)

    def hold(self, combo: str) -> None:
        if not _kb:
            return
        for token in _tokens(_normalize_combo(combo)):
            _kb.press(token)

    def release(self, combo: str) -> None:
        if not _kb:
            return
        for token in reversed(_tokens(_normalize_combo(combo))):
            _kb.release(token)

    def type_text(self, text: str, delay_ms: int = 0) -> None:
        if not _kb or not text:
            return
        _kb.write(text, delay=max(0, delay_ms) / 1000.0)

    def play_macro(self, steps: list[dict]) -> None:
        if not _kb:
            return
        for step in steps:
            kind = str(step.get("kind", "key")).lower()
            if kind == "key":
                combo = str(step.get("combo", "")).strip()
                if combo:
                    self.press_combo(combo)
            elif kind == "text":
                self.type_text(str(step.get("text", "")), int(step.get("delay_ms", 0)))
            elif kind == "delay":
                pass  # delay processado após o passo
            delay = int(step.get("delay_ms", 0) or 0)
            if delay > 0:
                time.sleep(delay / 1000.0)


def _normalize_combo(combo: str) -> str:
    tokens = [_ALIASES.get(t.lower(), t.lower()) for t in _tokens(combo)]
    return "+".join(t for t in tokens if t)


def _tokens(combo: str) -> list[str]:
    return [t.strip() for t in combo.split("+") if t.strip()]
