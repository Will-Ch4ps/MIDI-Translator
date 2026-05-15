"""Windows volume control: master and per-application sessions."""
from __future__ import annotations

import sys
from typing import Any, Optional

try:
    import keyboard as kb
except Exception:  # noqa: BLE001
    kb = None

try:
    from comtypes import CLSCTX_ALL  # type: ignore
    from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume  # type: ignore

    _PYCAW_OK = True
except Exception:  # noqa: BLE001
    _PYCAW_OK = False

from .volume_targets import DISCOVERY_BASE, normalize_target, session_info, session_matches


class VolumeController:
    def __init__(self) -> None:
        self._endpoint = self._load_endpoint() if _PYCAW_OK else None

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

    def get_scalar(self) -> Optional[float]:
        if not self._endpoint:
            return None
        return float(self._endpoint.GetMasterVolumeLevelScalar())

    def set_scalar(self, value: float) -> None:
        if self._endpoint:
            self._endpoint.SetMasterVolumeLevelScalar(_clamp01(value), None)

    def step(self, delta: float, target: str = "master") -> None:
        norm = normalize_target(target)
        if norm == "master":
            self._step_master(delta)
            return
        if self._step_sessions(norm, delta):
            return
        self._step_master(delta)

    def set_target_scalar(self, value: float, target: str = "master") -> None:
        norm = normalize_target(target)
        scalar = _clamp01(value)
        if norm == "master":
            self.set_scalar(scalar)
            return
        if self._set_sessions(norm, scalar):
            return
        self.set_scalar(scalar)

    def mute_toggle(self) -> None:
        if self._endpoint:
            self._endpoint.SetMute(0 if self._endpoint.GetMute() else 1, None)
        elif kb:
            kb.send("volume mute")

    def _step_master(self, delta: float) -> None:
        if self._endpoint:
            current = self.get_scalar()
            if current is not None:
                self.set_scalar(current + delta)
            return
        if kb:
            key = "volume up" if delta > 0 else "volume down"
            for _ in range(max(1, int(abs(delta) / 0.02))):
                kb.send(key)

    def _set_sessions(self, target: str, scalar: float) -> bool:
        if not _PYCAW_OK:
            return False
        changed = False
        for session in AudioUtilities.GetAllSessions():
            info = session_info(session)
            if not info or not session_matches(info, target):
                continue
            try:
                session.SimpleAudioVolume.SetMasterVolume(scalar, None)
                changed = True
            except Exception as exc:  # noqa: BLE001
                print(f"[volume] set session volume failed: {exc}", file=sys.stderr, flush=True)
        return changed

    def _step_sessions(self, target: str, delta: float) -> bool:
        if not _PYCAW_OK:
            return False
        changed = False
        for session in AudioUtilities.GetAllSessions():
            info = session_info(session)
            if not info or not session_matches(info, target):
                continue
            try:
                audio = session.SimpleAudioVolume
                audio.SetMasterVolume(_clamp01(float(audio.GetMasterVolume()) + delta), None)
                changed = True
            except Exception as exc:  # noqa: BLE001
                print(f"[volume] step session volume failed: {exc}", file=sys.stderr, flush=True)
        return changed


def discover_audio_targets() -> list[str]:
    catalog = discover_audio_catalog()
    return catalog["targets"]


def discover_audio_catalog() -> dict[str, Any]:
    names: set[str] = set(DISCOVERY_BASE)
    apps_by_key: dict[str, dict[str, Any]] = {}
    if not _PYCAW_OK:
        return {"targets": sorted(names), "apps": []}
    try:
        for session in AudioUtilities.GetAllSessions():
            info = session_info(session)
            if not info:
                continue
            names.add(str(info["name"]).lower())
            key = str(info["name"]).lower()
            if key not in apps_by_key:
                apps_by_key[key] = info
    except Exception as exc:  # noqa: BLE001
        print(f"[volume] discover targets failed: {exc}", file=sys.stderr, flush=True)
    apps = sorted(apps_by_key.values(), key=lambda item: str(item.get("name") or ""))
    return {"targets": sorted(names), "apps": apps}


def _clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))
