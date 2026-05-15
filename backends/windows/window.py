"""Janelas, virtual desktops e foco no Windows via atalhos nativos + Win32."""
from __future__ import annotations

import ctypes
import ctypes.wintypes as wt
import sys

try:
    import keyboard as _kb
except Exception:  # noqa: BLE001
    _kb = None


class WindowService:
    @property
    def available(self) -> bool:
        return sys.platform.startswith("win")

    # ─── snap ─────────────────────────────────────────────────
    def snap_left(self) -> None:
        self._send("windows+left")

    def snap_right(self) -> None:
        self._send("windows+right")

    def snap_up(self) -> None:
        self._send("windows+up")

    def snap_down(self) -> None:
        self._send("windows+down")

    # ─── foco e minimização ────────────────────────────────────
    def minimize_all(self) -> None:
        self._send("windows+d")

    def show_desktop(self) -> None:
        self._send("windows+d")

    def alt_tab(self) -> None:
        self._send("alt+tab")

    def cycle_app_windows(self) -> None:
        self._send("alt+`")

    def focus_foreground_title(self) -> str:
        if not sys.platform.startswith("win"):
            return ""
        try:
            hwnd = ctypes.windll.user32.GetForegroundWindow()
            length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
            buffer = ctypes.create_unicode_buffer(length + 1)
            ctypes.windll.user32.GetWindowTextW(hwnd, buffer, length + 1)
            return buffer.value or ""
        except Exception as exc:  # noqa: BLE001
            print(f"[window] foreground falhou: {exc}", file=sys.stderr, flush=True)
            return ""

    def foreground_process_name(self) -> str:
        if not sys.platform.startswith("win"):
            return ""
        try:
            hwnd = ctypes.windll.user32.GetForegroundWindow()
            pid = wt.DWORD()
            ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            return _process_name(pid.value)
        except Exception as exc:  # noqa: BLE001
            print(f"[window] foreground pid falhou: {exc}", file=sys.stderr, flush=True)
            return ""

    # ─── virtual desktops (Win11) ──────────────────────────────
    def desktop_next(self) -> None:
        self._send("ctrl+windows+right")

    def desktop_prev(self) -> None:
        self._send("ctrl+windows+left")

    def desktop_new(self) -> None:
        self._send("ctrl+windows+d")

    def desktop_close(self) -> None:
        self._send("ctrl+windows+f4")

    @staticmethod
    def _send(combo: str) -> None:
        if _kb:
            _kb.send(combo)


def _process_name(pid: int) -> str:
    try:
        import psutil  # type: ignore
        return psutil.Process(pid).name()
    except Exception:  # noqa: BLE001
        return ""
