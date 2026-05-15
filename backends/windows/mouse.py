"""Emissão de mouse via ctypes (SendInput)."""
from __future__ import annotations

import ctypes
import ctypes.wintypes as wt
import sys


_MOUSEEVENTF_MOVE = 0x0001
_MOUSEEVENTF_LEFTDOWN = 0x0002
_MOUSEEVENTF_LEFTUP = 0x0004
_MOUSEEVENTF_RIGHTDOWN = 0x0008
_MOUSEEVENTF_RIGHTUP = 0x0010
_MOUSEEVENTF_MIDDLEDOWN = 0x0020
_MOUSEEVENTF_MIDDLEUP = 0x0040
_MOUSEEVENTF_WHEEL = 0x0800
_MOUSEEVENTF_HWHEEL = 0x1000
_MOUSEEVENTF_ABSOLUTE = 0x8000

_BUTTONS = {
    "left": (_MOUSEEVENTF_LEFTDOWN, _MOUSEEVENTF_LEFTUP),
    "right": (_MOUSEEVENTF_RIGHTDOWN, _MOUSEEVENTF_RIGHTUP),
    "middle": (_MOUSEEVENTF_MIDDLEDOWN, _MOUSEEVENTF_MIDDLEUP),
}


class MouseEmitter:
    @property
    def available(self) -> bool:
        return sys.platform.startswith("win")

    def move(self, dx: int, dy: int) -> None:
        self._send_mouse(_MOUSEEVENTF_MOVE, dx, dy)

    def move_to(self, x: int, y: int) -> None:
        try:
            ctypes.windll.user32.SetCursorPos(int(x), int(y))
        except Exception as exc:  # noqa: BLE001
            print(f"[mouse] SetCursorPos falhou: {exc}", file=sys.stderr, flush=True)

    def click(self, button: str = "left") -> None:
        button = button.lower()
        if button not in _BUTTONS:
            return
        down, up = _BUTTONS[button]
        self._send_mouse(down)
        self._send_mouse(up)

    def double_click(self, button: str = "left") -> None:
        self.click(button)
        self.click(button)

    def scroll(self, delta: int, horizontal: bool = False) -> None:
        flag = _MOUSEEVENTF_HWHEEL if horizontal else _MOUSEEVENTF_WHEEL
        self._send_mouse(flag, mouse_data=int(delta) * 120)

    @staticmethod
    def _send_mouse(flags: int, dx: int = 0, dy: int = 0, mouse_data: int = 0) -> None:
        try:
            ctypes.windll.user32.mouse_event(flags, wt.DWORD(dx), wt.DWORD(dy), wt.DWORD(mouse_data), 0)
        except Exception as exc:  # noqa: BLE001
            print(f"[mouse] mouse_event falhou: {exc}", file=sys.stderr, flush=True)
