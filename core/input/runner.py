"""Execute mapped actions from incoming MIDI events."""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import Any

from ..mapper.models import ActionType
from .runner_paths import SCRIPT_EXTS, resolve_command, script_workdir, split_args, to_unit

MEDIA_KEYS = {
    ActionType.MEDIA_PLAY: "play/pause media",
    ActionType.MEDIA_NEXT: "next track",
    ActionType.MEDIA_PREV: "previous track",
    ActionType.MEDIA: "play/pause media",
}

STORE_APP_TARGETS = {
    "spotify.exe": r"shell:AppsFolder\SpotifyAB.SpotifyMusic_zpdnekdrzrea0!Spotify",
}


class ActionRunner:
    def __init__(self, keyboard, volume) -> None:
        self._keyboard = keyboard
        self._volume = volume
        self._last_values: dict[str, int] = {}

    def run(self, action, event) -> None:
        params = dict(getattr(action, "params", {}) or {})
        action_type = self._coerce_type(getattr(action, "type", None))
        if action_type is None:
            return
        if action_type == ActionType.KEY:
            self._run_key(params, event.pressed)
        elif action_type == ActionType.MACRO and event.pressed:
            self._keyboard.play_macro(list(params.get("steps") or []))
        elif action_type in (ActionType.VOLUME_UP, ActionType.VOLUME_DOWN):
            self._run_volume_step(action_type, params, event)
        elif action_type == ActionType.VOLUME_SET and event.is_continuous:
            self._volume.set_target_scalar(to_unit(event.value), str(params.get("target", "master")))
        elif action_type == ActionType.VOLUME_MUTE and event.pressed:
            self._volume.mute_toggle()
        elif action_type in MEDIA_KEYS and event.pressed:
            self._keyboard.press_combo(MEDIA_KEYS[action_type])
        elif action_type == ActionType.APP_LAUNCH and event.pressed:
            self._run_launch(params)
        elif action_type == ActionType.COMMAND and event.pressed:
            self._spawn(str(params.get("command", "")).strip(), shell=True)
        elif action_type == ActionType.SCRIPT and event.pressed:
            self._run_script(params)

    def _run_key(self, params: dict[str, Any], pressed: bool) -> None:
        combo = str(params.get("combo", "")).strip()
        mode = str(params.get("mode", "tap")).lower()
        if not combo:
            return
        if mode == "hold":
            (self._keyboard.hold if pressed else self._keyboard.release)(combo)
        elif pressed:
            self._keyboard.press_combo(combo)

    def _run_volume_step(self, action_type: ActionType, params: dict[str, Any], event) -> None:
        step = float(params.get("step", 0.04) or 0.04)
        target = str(params.get("target", "master"))
        if params.get("use_knob_direction") and event.is_continuous:
            direction = self._continuous_direction(event)
            if direction:
                self._volume.step(step * direction, target)
            return
        if event.pressed:
            self._volume.step(step if action_type == ActionType.VOLUME_UP else -step, target)

    def _run_launch(self, params: dict[str, Any]) -> None:
        target_text = str(params.get("path", "")).strip()
        if not target_text:
            return
        if self._launch_shell_target(target_text):
            return
        target, args = resolve_command(target_text)
        if not target:
            return
        target = self._normalize_store_target(target)
        if self._launch_shell_target(target):
            return
        suffix = Path(target).suffix.lower()
        if suffix in SCRIPT_EXTS:
            self._run_script({"path": target, "args": " ".join(args)})
        elif suffix == ".lnk" or (Path(target).exists() and not args):
            os.startfile(target)
        else:
            if self._spawn([target, *args]):
                return
            if Path(target).exists() and not args:
                try:
                    os.startfile(target)
                    return
                except Exception as exc:  # noqa: BLE001
                    print(f"[runner] startfile fallback failed for {target}: {exc}", file=sys.stderr, flush=True)
            self._spawn(["explorer.exe", target, *args], detached=False)

    def _run_script(self, params: dict[str, Any]) -> None:
        target, inline_args = resolve_command(str(params.get("path", "")).strip())
        if not target:
            return
        target = str(Path(target))
        args = [*inline_args, *split_args(str(params.get("args", "")))]
        cwd = script_workdir(target)
        ext = Path(target).suffix.lower()

        if ext == ".py":
            self._spawn([sys.executable, target, *args], cwd=cwd, detached=False)
        elif ext == ".ps1":
            self._spawn(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", target, *args], cwd=cwd, detached=False)
        elif ext in {".bat", ".cmd"}:
            self._spawn(["cmd.exe", "/c", target, *args], cwd=cwd, detached=False)
        elif ext == ".vbs":
            self._run_vbs(target, args, cwd)
        else:
            self._spawn([target, *args], cwd=cwd)

    def _run_vbs(self, target: str, args: list[str], cwd: str | None) -> None:
        if self._spawn(["wscript.exe", "//nologo", target, *args], cwd=cwd, detached=False):
            return
        if self._spawn(["cscript.exe", "//nologo", target, *args], cwd=cwd, detached=False):
            return
        if not args:
            try:
                os.startfile(target)
            except Exception as exc:  # noqa: BLE001
                print(f"[runner] startfile vbs failed for {target}: {exc}", file=sys.stderr, flush=True)

    def _launch_shell_target(self, target: str) -> bool:
        value = target.strip()
        if not value:
            return False
        low = value.lower()
        if low.startswith("shell:"):
            return self._spawn(["explorer.exe", value], detached=False)
        if low.startswith("ms-"):
            try:
                os.startfile(value)
                return True
            except Exception as exc:  # noqa: BLE001
                print(f"[runner] shell launch failed for {value}: {exc}", file=sys.stderr, flush=True)
                return self._spawn(["explorer.exe", value], detached=False)
        return False

    def _normalize_store_target(self, target: str) -> str:
        low = target.lower()
        file_name = Path(target).name.lower()
        if file_name in STORE_APP_TARGETS:
            return STORE_APP_TARGETS[file_name]
        if "\\windowsapps\\" in low and "spotifyab.spotifymusic_" in low:
            return STORE_APP_TARGETS["spotify.exe"]
        return target

    def _spawn(self, args, *, shell: bool = False, cwd: str | None = None, detached: bool = True) -> bool:
        if not args:
            return False
        creation = getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0)
        if detached:
            creation |= getattr(subprocess, "DETACHED_PROCESS", 0)
        try:
            subprocess.Popen(args, shell=shell, creationflags=creation, cwd=cwd)
            return True
        except Exception as exc:  # noqa: BLE001
            print(f"[runner] failed to spawn {args}: {exc}", file=sys.stderr, flush=True)
            return False

    def _continuous_direction(self, event) -> int:
        key = event.signature.key()
        value = int(event.value)
        previous = self._last_values.get(key)
        self._last_values[key] = value
        if previous is None or value == previous:
            return 0
        return 1 if value > previous else -1

    @staticmethod
    def _coerce_type(raw: Any) -> ActionType | None:
        if isinstance(raw, ActionType):
            return raw
        value = getattr(raw, "value", raw)
        try:
            return ActionType(str(value))
        except ValueError:
            return None
