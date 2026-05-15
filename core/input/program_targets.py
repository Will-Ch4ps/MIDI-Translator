"""Discover running desktop programs for quick binding."""
from __future__ import annotations

from pathlib import Path
from typing import Any
import ctypes
from ctypes import wintypes

try:
    import psutil  # type: ignore
except Exception:  # noqa: BLE001
    psutil = None

BLOCKED = {
    "system idle process.exe",
    "system.exe",
    "registry.exe",
    "smss.exe",
    "csrss.exe",
    "wininit.exe",
    "services.exe",
    "lsass.exe",
    "dwm.exe",
}

BLOCKED_TOKENS = {"service", "host", "handler", "crash", "helper", "update", "container", "server"}

SYSTEM32_ALLOW = {
    "explorer.exe",
    "notepad.exe",
    "calc.exe",
    "mspaint.exe",
    "taskmgr.exe",
    "cmd.exe",
    "powershell.exe",
    "wt.exe",
}

STORE_TARGETS = {
    "spotify.exe": r"shell:AppsFolder\SpotifyAB.SpotifyMusic_zpdnekdrzrea0!Spotify",
}


def discover_running_programs(limit: int = 80) -> list[dict[str, Any]]:
    if not psutil:
        return []

    visible_pids = _visible_window_pids()
    by_key: dict[str, dict[str, Any]] = {}
    for proc in psutil.process_iter(["pid", "name", "exe"]):
        info = _safe_info(proc)
        if not info:
            continue
        if visible_pids and int(info.get("pid") or 0) not in visible_pids:
            continue
        key = str(info.get("path") or info.get("name")).lower()
        if key in by_key:
            continue
        by_key[key] = info

    items = sorted(by_key.values(), key=lambda item: str(item.get("display") or ""))
    return items[: max(1, limit)]


def _safe_info(proc: Any) -> dict[str, Any] | None:
    try:
        pid = int(proc.info.get("pid") or 0)
        name = str(proc.info.get("name") or "").strip()
        path = str(proc.info.get("exe") or "").strip()
    except Exception:  # noqa: BLE001
        return None

    if not name:
        return None

    low = name.lower()
    if low in BLOCKED:
        return None
    if not low.endswith(".exe"):
        return None
    if any(token in low for token in BLOCKED_TOKENS):
        return None
    if path and "\\windows\\systemapps\\" in path.lower():
        return None
    if path and "\\windows\\system32\\" in path.lower() and low not in SYSTEM32_ALLOW:
        return None
    if path and path.lower().startswith("c:\\windows\\") and low not in SYSTEM32_ALLOW:
        return None

    target = _launch_target_for(low, path)
    display = Path(name).stem.replace("_", " ").strip()
    return {
        "pid": pid,
        "name": low,
        "path": path,
        "display": display,
        "target": target,
    }


def _launch_target_for(name: str, path: str) -> str:
    store_target = STORE_TARGETS.get(name)
    if store_target and ("\\windowsapps\\" in path.lower() or not path):
        return store_target
    return path or name


def _visible_window_pids() -> set[int]:
    pids: set[int] = set()
    user32 = ctypes.windll.user32
    EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)

    def callback(hwnd: int, _lparam: int) -> bool:
        if not user32.IsWindowVisible(hwnd):
            return True
        if user32.GetWindow(hwnd, 4):  # owned window
            return True
        if user32.GetWindowTextLengthW(hwnd) <= 0:
            return True
        pid = wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        if pid.value:
            pids.add(int(pid.value))
        return True

    try:
        user32.EnumWindows(EnumWindowsProc(callback), 0)
    except Exception:  # noqa: BLE001
        return set()
    return pids
