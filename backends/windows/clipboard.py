"""Clipboard via ctypes (sem deps externas)."""
from __future__ import annotations

import ctypes
import ctypes.wintypes as wt
import sys


_CF_UNICODETEXT = 13
_GMEM_MOVEABLE = 0x0002


class ClipboardService:
    @property
    def available(self) -> bool:
        return sys.platform.startswith("win")

    def read(self) -> str:
        u32 = ctypes.windll.user32
        if not u32.OpenClipboard(None):
            return ""
        try:
            handle = u32.GetClipboardData(_CF_UNICODETEXT)
            if not handle:
                return ""
            kernel32 = ctypes.windll.kernel32
            pointer = kernel32.GlobalLock(handle)
            if not pointer:
                return ""
            try:
                return ctypes.c_wchar_p(pointer).value or ""
            finally:
                kernel32.GlobalUnlock(handle)
        finally:
            u32.CloseClipboard()

    def write(self, text: str) -> bool:
        u32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32
        encoded = (text or "").encode("utf-16-le") + b"\x00\x00"

        if not u32.OpenClipboard(None):
            return False
        try:
            u32.EmptyClipboard()
            handle = kernel32.GlobalAlloc(_GMEM_MOVEABLE, len(encoded))
            if not handle:
                return False
            pointer = kernel32.GlobalLock(handle)
            if not pointer:
                return False
            try:
                ctypes.memmove(pointer, encoded, len(encoded))
            finally:
                kernel32.GlobalUnlock(handle)
            u32.SetClipboardData(_CF_UNICODETEXT, handle)
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[clipboard] write falhou: {exc}", file=sys.stderr, flush=True)
            return False
        finally:
            u32.CloseClipboard()
