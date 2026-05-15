"""Lançamento de apps, comandos e scripts no Windows."""
from __future__ import annotations

import os
import shlex
import subprocess
import sys
from pathlib import Path


_SCRIPT_EXTS = {".py", ".ps1", ".bat", ".cmd", ".vbs"}
_STORE_TARGETS = {
    "spotify.exe": r"shell:AppsFolder\SpotifyAB.SpotifyMusic_zpdnekdrzrea0!Spotify",
}


class ShellService:
    @property
    def available(self) -> bool:
        return sys.platform.startswith("win")

    def launch(self, path_or_uri: str) -> bool:
        target_text = (path_or_uri or "").strip()
        if not target_text:
            return False
        if self._launch_shell_uri(target_text):
            return True
        target, args = _resolve(target_text)
        if not target:
            return False
        target = _normalize_store(target)
        if self._launch_shell_uri(target):
            return True
        suffix = Path(target).suffix.lower()
        if suffix in _SCRIPT_EXTS:
            return self.run_script(target, " ".join(args))
        if suffix == ".lnk" or (Path(target).exists() and not args):
            try:
                os.startfile(target)
                return True
            except Exception as exc:  # noqa: BLE001
                print(f"[shell] startfile falhou: {exc}", file=sys.stderr, flush=True)
        if self._spawn([target, *args]):
            return True
        return self._spawn(["explorer.exe", target, *args], detached=False)

    def run_command(self, command: str) -> bool:
        if not command:
            return False
        return self._spawn(command, shell=True)

    def run_script(self, path: str, args_text: str = "") -> bool:
        target, inline_args = _resolve(path)
        if not target:
            return False
        target = str(Path(target))
        args = [*inline_args, *_split(args_text)]
        cwd = _workdir(target)
        ext = Path(target).suffix.lower()
        if ext == ".py":
            return self._spawn([sys.executable, target, *args], cwd=cwd, detached=False)
        if ext == ".ps1":
            return self._spawn(
                ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", target, *args],
                cwd=cwd, detached=False,
            )
        if ext in {".bat", ".cmd"}:
            return self._spawn(["cmd.exe", "/c", target, *args], cwd=cwd, detached=False)
        if ext == ".vbs":
            return self._spawn(["wscript.exe", "//nologo", target, *args], cwd=cwd, detached=False)
        return self._spawn([target, *args], cwd=cwd)

    @staticmethod
    def _launch_shell_uri(value: str) -> bool:
        low = value.lower()
        if low.startswith("shell:"):
            try:
                subprocess.Popen(["explorer.exe", value])
                return True
            except Exception:  # noqa: BLE001
                return False
        if low.startswith("ms-"):
            try:
                os.startfile(value)
                return True
            except Exception:  # noqa: BLE001
                return False
        return False

    @staticmethod
    def _spawn(args, *, shell: bool = False, cwd: str | None = None, detached: bool = True) -> bool:
        if not args:
            return False
        flags = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
        if detached:
            flags |= getattr(subprocess, "DETACHED_PROCESS", 0)
        try:
            subprocess.Popen(args, shell=shell, creationflags=flags, cwd=cwd)
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[shell] spawn falhou ({args}): {exc}", file=sys.stderr, flush=True)
            return False


def _resolve(raw: str) -> tuple[str, list[str]]:
    text = os.path.expandvars(os.path.expanduser(_strip_quotes(raw).strip()))
    if not text:
        return "", []
    if Path(text).exists():
        return str(Path(text)), []
    parts = [os.path.expandvars(os.path.expanduser(_strip_quotes(p))) for p in _split(text)]
    for idx in range(len(parts), 0, -1):
        candidate = " ".join(parts[:idx]).strip()
        if candidate and Path(candidate).exists():
            return str(Path(candidate)), parts[idx:]
    return (parts[0], parts[1:]) if parts else ("", [])


def _split(raw: str) -> list[str]:
    try:
        return [item for item in shlex.split(raw, posix=False) if item]
    except ValueError:
        return [item for item in raw.split() if item]


def _strip_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def _workdir(path: str) -> str | None:
    parent = Path(path).parent
    return str(parent) if parent.exists() else None


def _normalize_store(target: str) -> str:
    low = target.lower()
    name = Path(target).name.lower()
    if name in _STORE_TARGETS:
        return _STORE_TARGETS[name]
    if "\\windowsapps\\" in low and "spotifyab.spotifymusic_" in low:
        return _STORE_TARGETS["spotify.exe"]
    return target
