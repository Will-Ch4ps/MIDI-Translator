"""Volume Linux via wpctl (PipeWire) ou pactl (PulseAudio)."""
from __future__ import annotations

import shutil
import subprocess
import sys
from typing import Any, Optional


class VolumeService:
    def __init__(self) -> None:
        self._tool = "wpctl" if shutil.which("wpctl") else ("pactl" if shutil.which("pactl") else None)

    @property
    def available(self) -> bool:
        return self._tool is not None

    def get_master(self) -> Optional[float]:
        if self._tool == "wpctl":
            return self._read_wpctl()
        if self._tool == "pactl":
            return self._read_pactl()
        return None

    def set_master(self, scalar: float) -> None:
        clamped = _clamp01(scalar)
        if self._tool == "wpctl":
            self._run(["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", f"{clamped:.2f}"])
        elif self._tool == "pactl":
            self._run(["pactl", "set-sink-volume", "@DEFAULT_SINK@", f"{int(clamped * 100)}%"])

    def step(self, delta: float, target: str = "master") -> None:
        target = (target or "master").lower()
        if target == "master":
            self._step_master(delta)
            return
        if not self._step_app(target, delta):
            self._step_master(delta)

    def set_target(self, scalar: float, target: str = "master") -> None:
        target = (target or "master").lower()
        if target == "master":
            self.set_master(scalar)

    def mute_toggle(self) -> None:
        if self._tool == "wpctl":
            self._run(["wpctl", "set-mute", "@DEFAULT_AUDIO_SINK@", "toggle"])
        elif self._tool == "pactl":
            self._run(["pactl", "set-sink-mute", "@DEFAULT_SINK@", "toggle"])

    def list_sessions(self) -> list[dict[str, Any]]:
        if self._tool != "pactl":
            return []
        try:
            result = subprocess.run(["pactl", "list", "sink-inputs"], capture_output=True, text=True, check=False)
        except Exception:  # noqa: BLE001
            return []
        return _parse_pactl_sinks(result.stdout)

    def _step_master(self, delta: float) -> None:
        sign = "+" if delta >= 0 else "-"
        magnitude = abs(delta)
        if self._tool == "wpctl":
            self._run(["wpctl", "set-volume", "@DEFAULT_AUDIO_SINK@", f"{magnitude:.2f}{sign}"])
        elif self._tool == "pactl":
            self._run(["pactl", "set-sink-volume", "@DEFAULT_SINK@", f"{sign}{int(magnitude * 100)}%"])

    def _step_app(self, target: str, delta: float) -> bool:
        if self._tool != "pactl":
            return False
        sessions = self.list_sessions()
        changed = False
        sign = "+" if delta >= 0 else "-"
        magnitude = abs(delta)
        for session in sessions:
            if target in str(session.get("name", "")).lower():
                self._run(["pactl", "set-sink-input-volume", str(session["id"]), f"{sign}{int(magnitude * 100)}%"])
                changed = True
        return changed

    def _read_wpctl(self) -> Optional[float]:
        try:
            result = subprocess.run(["wpctl", "get-volume", "@DEFAULT_AUDIO_SINK@"], capture_output=True, text=True, check=False)
            for token in result.stdout.split():
                try:
                    return float(token)
                except ValueError:
                    continue
        except Exception:  # noqa: BLE001
            pass
        return None

    def _read_pactl(self) -> Optional[float]:
        try:
            result = subprocess.run(["pactl", "get-sink-volume", "@DEFAULT_SINK@"], capture_output=True, text=True, check=False)
            for token in result.stdout.split():
                if token.endswith("%"):
                    try:
                        return int(token.rstrip("%")) / 100.0
                    except ValueError:
                        continue
        except Exception:  # noqa: BLE001
            pass
        return None

    @staticmethod
    def _run(args: list[str]) -> None:
        try:
            subprocess.run(args, check=False, capture_output=True)
        except Exception as exc:  # noqa: BLE001
            print(f"[volume.linux] {args[0]} falhou: {exc}", file=sys.stderr, flush=True)


def _parse_pactl_sinks(text: str) -> list[dict[str, Any]]:
    sessions: list[dict[str, Any]] = []
    current: dict[str, Any] = {}
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.startswith("Sink Input #"):
            if current:
                sessions.append(current)
            current = {"id": stripped.split("#", 1)[1]}
        elif "application.name" in stripped:
            current["name"] = stripped.split("=", 1)[-1].strip().strip('"')
    if current:
        sessions.append(current)
    return sessions


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))
