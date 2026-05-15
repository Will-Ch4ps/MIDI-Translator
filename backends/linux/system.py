"""Lock, notify, brilho no Linux via ferramentas externas."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path


class SystemService:
    @property
    def available(self) -> bool:
        return True

    def lock(self) -> bool:
        if shutil.which("loginctl"):
            return self._run(["loginctl", "lock-session"])
        if shutil.which("xdg-screensaver"):
            return self._run(["xdg-screensaver", "lock"])
        if shutil.which("hyprlock"):
            return self._run(["hyprlock"], detached=True)
        return False

    def sleep(self) -> bool:
        if shutil.which("systemctl"):
            return self._run(["systemctl", "suspend"])
        return False

    def notify(self, title: str, message: str = "") -> bool:
        if not shutil.which("notify-send"):
            return False
        return self._run(["notify-send", title, message])

    def set_brightness(self, percent: int) -> bool:
        if not shutil.which("brightnessctl"):
            return False
        clamped = max(0, min(100, int(percent)))
        return self._run(["brightnessctl", "set", f"{clamped}%"])

    def screenshot(self, target: str | None = None) -> Path | None:
        for tool, args in (
            ("grim", ["grim", target] if target else ["grim"]),
            ("flameshot", ["flameshot", "gui"]),
            ("gnome-screenshot", ["gnome-screenshot", "-i"]),
            ("scrot", ["scrot", target] if target else ["scrot"]),
        ):
            if shutil.which(tool):
                self._run(args, detached=True)
                return Path(target) if target else None
        return None

    @staticmethod
    def _run(args: list[str], detached: bool = False) -> bool:
        try:
            if detached:
                subprocess.Popen(args)
            else:
                subprocess.run(args, check=False, capture_output=True)
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[system.linux] {args[0]} falhou: {exc}", file=sys.stderr, flush=True)
            return False
