"""Lock, notificação, brilho, screenshot via Win32."""
from __future__ import annotations

import ctypes
import os
import subprocess
import sys
from pathlib import Path


class SystemService:
    @property
    def available(self) -> bool:
        return sys.platform.startswith("win")

    def lock(self) -> bool:
        try:
            ctypes.windll.user32.LockWorkStation()
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[system] lock falhou: {exc}", file=sys.stderr, flush=True)
            return False

    def sleep(self) -> bool:
        # SetSuspendState(Hibernate=False, Force=False, WakeupEventsDisabled=False)
        try:
            ctypes.windll.powrprof.SetSuspendState(0, 0, 0)
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[system] sleep falhou: {exc}", file=sys.stderr, flush=True)
            return False

    def notify(self, title: str, message: str = "") -> bool:
        """Notificação simples via PowerShell BurntToast (se disponível) ou MessageBeep."""
        try:
            cmd = (
                "[reflection.assembly]::loadwithpartialname('System.Windows.Forms')|Out-Null;"
                f"$n=new-object System.Windows.Forms.NotifyIcon;"
                f"$n.Icon=[System.Drawing.SystemIcons]::Information;"
                f"$n.Visible=$true;"
                f"$n.ShowBalloonTip(3000, '{_escape(title)}', '{_escape(message)}', 'Info');"
                f"Start-Sleep -Milliseconds 3500; $n.Dispose()"
            )
            subprocess.Popen(
                ["powershell.exe", "-NoProfile", "-WindowStyle", "Hidden", "-Command", cmd],
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[system] notify falhou: {exc}", file=sys.stderr, flush=True)
            return False

    def screenshot(self, target: str | None = None) -> Path | None:
        """Aciona Snipping Tool (Win+Shift+S). Cópia vai pro clipboard."""
        try:
            import keyboard as _kb  # type: ignore
            _kb.send("windows+shift+s")
            return None
        except Exception as exc:  # noqa: BLE001
            print(f"[system] screenshot falhou: {exc}", file=sys.stderr, flush=True)
            return None


def _escape(value: str) -> str:
    return (value or "").replace("'", "''")
