"""Volume Windows: master + per-app via pycaw."""
from __future__ import annotations

import sys
from typing import Any, Optional

try:
    import keyboard as _kb
except Exception:  # noqa: BLE001
    _kb = None

try:
    from comtypes import CLSCTX_ALL  # type: ignore
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume  # type: ignore
    _PYCAW = True
except Exception:  # noqa: BLE001
    _PYCAW = False


class VolumeService:
    def __init__(self) -> None:
        self._endpoint = self._load_endpoint() if _PYCAW else None

    @property
    def available(self) -> bool:
        return self._endpoint is not None

    def get_master(self) -> Optional[float]:
        if not self._endpoint:
            return None
        return float(self._endpoint.GetMasterVolumeLevelScalar())

    def set_master(self, scalar: float) -> None:
        if self._endpoint:
            self._endpoint.SetMasterVolumeLevelScalar(_clamp01(scalar), None)

    def step(self, delta: float, target: str = "master") -> None:
        target = (target or "master").lower()
        if target == "master":
            self._step_master(delta)
            return
        if not self._step_session(target, delta):
            self._step_master(delta)

    def set_target(self, scalar: float, target: str = "master") -> None:
        target = (target or "master").lower()
        clamped = _clamp01(scalar)
        if target == "master":
            self.set_master(clamped)
            return
        if not self._set_session(target, clamped):
            self.set_master(clamped)

    def mute_toggle(self) -> None:
        if self._endpoint:
            self._endpoint.SetMute(0 if self._endpoint.GetMute() else 1, None)
        elif _kb:
            _kb.send("volume mute")

    def list_sessions(self) -> list[dict[str, Any]]:
        if not _PYCAW:
            return []
        out: list[dict[str, Any]] = []
        try:
            for session in AudioUtilities.GetAllSessions():
                if not session or not session.Process:
                    continue
                out.append({
                    "name": session.Process.name(),
                    "pid": session.Process.pid,
                    "volume": float(session.SimpleAudioVolume.GetMasterVolume()),
                    "muted": bool(session.SimpleAudioVolume.GetMute()),
                })
        except Exception as exc:  # noqa: BLE001
            print(f"[volume] list_sessions: {exc}", file=sys.stderr, flush=True)
        return out

    def _step_master(self, delta: float) -> None:
        current = self.get_master()
        if current is None:
            if _kb:
                key = "volume up" if delta > 0 else "volume down"
                for _ in range(max(1, int(abs(delta) / 0.02))):
                    _kb.send(key)
            return
        self.set_master(current + delta)

    def _step_session(self, target: str, delta: float) -> bool:
        return self._apply_session(target, lambda audio: audio.SetMasterVolume(
            _clamp01(float(audio.GetMasterVolume()) + delta), None))

    def _set_session(self, target: str, scalar: float) -> bool:
        return self._apply_session(target, lambda audio: audio.SetMasterVolume(scalar, None))

    def _apply_session(self, target: str, change) -> bool:
        if not _PYCAW:
            return False
        changed = False
        try:
            for session in AudioUtilities.GetAllSessions():
                if not session or not session.Process:
                    continue
                if not target or target in session.Process.name().lower():
                    change(session.SimpleAudioVolume)
                    changed = True
        except Exception as exc:  # noqa: BLE001
            print(f"[volume] session apply: {exc}", file=sys.stderr, flush=True)
        return changed

    @staticmethod
    def _load_endpoint():
        try:
            speakers = AudioUtilities.GetSpeakers()
            dev = speakers if hasattr(speakers, "Activate") else speakers._dev
            interface = dev.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
            return interface.QueryInterface(IAudioEndpointVolume)
        except Exception as exc:  # noqa: BLE001
            print(f"[volume] pycaw unavailable: {exc}", file=sys.stderr, flush=True)
            return None


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, float(value)))
