"""Clipboard Linux via wl-clipboard (Wayland) ou xclip/xsel (X11)."""
from __future__ import annotations

import shutil
import subprocess
import sys


class ClipboardService:
    def __init__(self) -> None:
        self._mode = _detect()

    @property
    def available(self) -> bool:
        return self._mode is not None

    def read(self) -> str:
        if self._mode == "wl":
            return self._exec(["wl-paste", "--no-newline"])
        if self._mode == "xclip":
            return self._exec(["xclip", "-selection", "clipboard", "-out"])
        if self._mode == "xsel":
            return self._exec(["xsel", "--clipboard", "--output"])
        return ""

    def write(self, text: str) -> bool:
        if self._mode == "wl":
            return self._pipe(["wl-copy"], text)
        if self._mode == "xclip":
            return self._pipe(["xclip", "-selection", "clipboard"], text)
        if self._mode == "xsel":
            return self._pipe(["xsel", "--clipboard", "--input"], text)
        return False

    @staticmethod
    def _exec(args: list[str]) -> str:
        try:
            result = subprocess.run(args, capture_output=True, text=True, check=False)
            return result.stdout
        except Exception as exc:  # noqa: BLE001
            print(f"[clipboard.linux] {args[0]} read: {exc}", file=sys.stderr, flush=True)
            return ""

    @staticmethod
    def _pipe(args: list[str], text: str) -> bool:
        try:
            proc = subprocess.Popen(args, stdin=subprocess.PIPE)
            proc.communicate(text.encode("utf-8"))
            return proc.returncode == 0
        except Exception as exc:  # noqa: BLE001
            print(f"[clipboard.linux] {args[0]} write: {exc}", file=sys.stderr, flush=True)
            return False


def _detect() -> str | None:
    if shutil.which("wl-copy") and shutil.which("wl-paste"):
        return "wl"
    if shutil.which("xclip"):
        return "xclip"
    if shutil.which("xsel"):
        return "xsel"
    return None
