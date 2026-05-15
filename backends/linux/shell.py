"""Lançamento de apps, comandos e scripts no Linux."""
from __future__ import annotations

import os
import shlex
import shutil
import subprocess
import sys
from pathlib import Path


_SCRIPT_EXTS = {".py", ".sh", ".bash", ".zsh"}


class ShellService:
    @property
    def available(self) -> bool:
        return not sys.platform.startswith("win")

    def launch(self, path_or_uri: str) -> bool:
        target = (path_or_uri or "").strip()
        if not target:
            return False
        if "://" in target or target.startswith("/"):
            return self._spawn([shutil.which("xdg-open") or "xdg-open", target], detached=True)
        return self._spawn([target], detached=True)

    def run_command(self, command: str) -> bool:
        if not command:
            return False
        try:
            subprocess.Popen(command, shell=True)
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[shell.linux] command falhou: {exc}", file=sys.stderr, flush=True)
            return False

    def run_script(self, path: str, args_text: str = "") -> bool:
        target = (path or "").strip()
        if not target or not Path(target).exists():
            return False
        ext = Path(target).suffix.lower()
        args = _split(args_text)
        cwd = str(Path(target).parent)
        if ext == ".py":
            return self._spawn([sys.executable, target, *args], cwd=cwd)
        if ext in {".sh", ".bash", ".zsh"}:
            shell = shutil.which("bash") or "/bin/sh"
            return self._spawn([shell, target, *args], cwd=cwd)
        if os.access(target, os.X_OK):
            return self._spawn([target, *args], cwd=cwd)
        return self._spawn([shutil.which("xdg-open") or "xdg-open", target], detached=True)

    @staticmethod
    def _spawn(args: list[str], *, cwd: str | None = None, detached: bool = False) -> bool:
        try:
            if detached:
                subprocess.Popen(args, cwd=cwd, start_new_session=True)
            else:
                subprocess.Popen(args, cwd=cwd)
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[shell.linux] spawn falhou ({args}): {exc}", file=sys.stderr, flush=True)
            return False


def _split(raw: str) -> list[str]:
    try:
        return [item for item in shlex.split(raw or "") if item]
    except ValueError:
        return [item for item in (raw or "").split() if item]
