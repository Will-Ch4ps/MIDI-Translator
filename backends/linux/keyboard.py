"""Keyboard Linux via ydotool (Wayland) ou xdotool (X11)."""
from __future__ import annotations

import shutil
import subprocess
import sys


class KeyboardEmitter:
    def __init__(self) -> None:
        self._tool = self._pick_tool()

    @property
    def available(self) -> bool:
        return self._tool is not None

    def press_combo(self, combo: str) -> None:
        if not self._tool or not combo:
            return
        normalized = _normalize(combo, self._tool)
        if self._tool == "ydotool":
            self._run(["ydotool", "key", normalized])
        else:
            self._run(["xdotool", "key", normalized])

    def hold(self, combo: str) -> None:
        if not self._tool or not combo:
            return
        normalized = _normalize(combo, self._tool)
        if self._tool == "ydotool":
            self._run(["ydotool", "key", "--key-delay", "0", normalized])  # ydotool não tem hold separado
        else:
            self._run(["xdotool", "keydown", normalized])

    def release(self, combo: str) -> None:
        if not self._tool or not combo:
            return
        normalized = _normalize(combo, self._tool)
        if self._tool == "xdotool":
            self._run(["xdotool", "keyup", normalized])

    def type_text(self, text: str, delay_ms: int = 0) -> None:
        if not self._tool or not text:
            return
        delay = str(max(0, int(delay_ms)))
        if self._tool == "ydotool":
            self._run(["ydotool", "type", "--key-delay", delay, text])
        else:
            self._run(["xdotool", "type", "--delay", delay, text])

    def play_macro(self, steps: list[dict]) -> None:
        import time
        for step in steps:
            kind = str(step.get("kind", "key")).lower()
            if kind == "key" and step.get("combo"):
                self.press_combo(str(step["combo"]))
            elif kind == "text" and step.get("text"):
                self.type_text(str(step["text"]), int(step.get("delay_ms", 0)))
            delay = int(step.get("delay_ms", 0) or 0)
            if delay > 0:
                time.sleep(delay / 1000.0)

    @staticmethod
    def _pick_tool() -> str | None:
        if shutil.which("ydotool"):
            return "ydotool"
        if shutil.which("xdotool"):
            return "xdotool"
        return None

    @staticmethod
    def _run(args: list[str]) -> None:
        try:
            subprocess.run(args, check=False, capture_output=True)
        except Exception as exc:  # noqa: BLE001
            print(f"[keyboard.linux] {args[0]} falhou: {exc}", file=sys.stderr, flush=True)


def _normalize(combo: str, tool: str) -> str:
    """Converte 'ctrl+shift+s' pro formato do tool escolhido.

    xdotool aceita 'ctrl+shift+s' direto. ydotool usa códigos numéricos,
    mas suporta nomes via 'key' nas versões recentes; aqui passamos o
    formato simples e deixamos o tool resolver.
    """
    return combo.strip().lower().replace(" ", "+")
