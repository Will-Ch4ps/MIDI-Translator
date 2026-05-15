"""Janelas Linux: i3, sway, hyprland, KDE, GNOME via ferramentas externas."""
from __future__ import annotations

import os
import shutil
import subprocess
import sys


class WindowService:
    def __init__(self) -> None:
        self._wm = _detect_wm()

    @property
    def available(self) -> bool:
        return self._wm != "none"

    def snap_left(self) -> None:
        self._snap("left")

    def snap_right(self) -> None:
        self._snap("right")

    def snap_up(self) -> None:
        self._snap("up")

    def snap_down(self) -> None:
        self._snap("down")

    def alt_tab(self) -> None:
        # delegado pro WM
        pass

    def focus_foreground_title(self) -> str:
        if shutil.which("xdotool"):
            try:
                result = subprocess.run(
                    ["xdotool", "getactivewindow", "getwindowname"],
                    capture_output=True, text=True, check=False,
                )
                return result.stdout.strip()
            except Exception:  # noqa: BLE001
                return ""
        if shutil.which("hyprctl"):
            try:
                result = subprocess.run(
                    ["hyprctl", "-j", "activewindow"],
                    capture_output=True, text=True, check=False,
                )
                import json
                data = json.loads(result.stdout or "{}")
                return str(data.get("title", ""))
            except Exception:  # noqa: BLE001
                return ""
        return ""

    def foreground_process_name(self) -> str:
        return ""

    def desktop_next(self) -> None:
        if self._wm == "i3" or self._wm == "sway":
            self._run([self._wm + "-msg" if self._wm == "i3" else "swaymsg", "workspace", "next"])
        elif self._wm == "hyprland":
            self._run(["hyprctl", "dispatch", "workspace", "+1"])

    def desktop_prev(self) -> None:
        if self._wm == "i3" or self._wm == "sway":
            self._run([self._wm + "-msg" if self._wm == "i3" else "swaymsg", "workspace", "prev"])
        elif self._wm == "hyprland":
            self._run(["hyprctl", "dispatch", "workspace", "-1"])

    def _snap(self, direction: str) -> None:
        if self._wm in ("i3", "sway"):
            self._run([self._wm + "-msg" if self._wm == "i3" else "swaymsg", "move", direction])
        elif self._wm == "hyprland":
            self._run(["hyprctl", "dispatch", "movewindow", _hypr_dir(direction)])

    @staticmethod
    def _run(args: list[str]) -> None:
        try:
            subprocess.run(args, check=False, capture_output=True)
        except Exception as exc:  # noqa: BLE001
            print(f"[window.linux] {args[0]} falhou: {exc}", file=sys.stderr, flush=True)


def _detect_wm() -> str:
    if shutil.which("hyprctl") and os.environ.get("HYPRLAND_INSTANCE_SIGNATURE"):
        return "hyprland"
    if shutil.which("swaymsg") and os.environ.get("SWAYSOCK"):
        return "sway"
    if shutil.which("i3-msg"):
        return "i3"
    desktop = os.environ.get("XDG_CURRENT_DESKTOP", "").lower()
    if "kde" in desktop and shutil.which("kdotool"):
        return "kde"
    if "gnome" in desktop:
        return "gnome"
    if shutil.which("wmctrl"):
        return "wmctrl"
    return "none"


def _hypr_dir(direction: str) -> str:
    return {"left": "l", "right": "r", "up": "u", "down": "d"}.get(direction, "l")
