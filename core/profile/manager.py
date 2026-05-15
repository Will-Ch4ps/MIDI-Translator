"""Carrega e salva profiles em JSON, suportando legacy v0.1."""
from __future__ import annotations

import json
import re
from pathlib import Path

from ..models import Action, Layer, Mapping, Profile, TriggerMode


class ProfileManager:
    def __init__(self, root: Path) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def list_profiles(self) -> list[str]:
        return sorted(path.stem for path in self.root.glob("*.json"))

    def load(self, name: str) -> Profile:
        path = self._path_for(name)
        if not path.exists():
            return Profile(name=name)
        data = json.loads(path.read_text(encoding="utf-8"))
        if _looks_legacy(data):
            return _migrate_legacy(name, data)
        return Profile.from_dict(data)

    def save(self, profile: Profile) -> Path:
        path = self._path_for(profile.name)
        path.write_text(
            json.dumps(profile.to_dict(), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        return path

    def delete(self, name: str) -> bool:
        path = self._path_for(name)
        if path.exists():
            path.unlink()
            return True
        return False

    def _path_for(self, name: str) -> Path:
        safe = re.sub(r"[^A-Za-z0-9_-]+", "_", name).strip("_") or "profile"
        return self.root / f"{safe}.json"


def _looks_legacy(data: dict) -> bool:
    if "layers" in data:
        return False
    mappings = data.get("mappings") or []
    if not mappings:
        return False
    first = mappings[0] if isinstance(mappings[0], dict) else {}
    action = first.get("action") or {}
    return "type" in action and "id" not in action


def _migrate_legacy(name: str, data: dict) -> Profile:
    """Converte profile v0.1 (action.type=KEY/MACRO/...) pro novo formato."""
    profile = Profile(name=str(data.get("name", name)), device_id=str(data.get("device_name", "") or ""))
    profile.layers = [Layer(id="default", name="Default")]

    for raw in data.get("mappings") or []:
        if not isinstance(raw, dict):
            continue
        try:
            trigger = TriggerMode(str(raw.get("trigger", "press")))
        except ValueError:
            trigger = TriggerMode.PRESS
        action_data = raw.get("action") or {}
        legacy_type = str(action_data.get("type", "noop"))
        action_id = _legacy_action_id(legacy_type)
        profile.mappings.append(Mapping(
            control_id=str(raw.get("control_id", "")),
            action=Action(id=action_id, params=dict(action_data.get("params") or {})),
            trigger=trigger,
            label=str(raw.get("label", "")),
            layer="default",
        ))
    return profile


_LEGACY_ACTION_MAP = {
    "key": "core.key.combo",
    "macro": "core.macro.play",
    "volume_up": "audio.volume.step_up",
    "volume_down": "audio.volume.step_down",
    "volume_set": "audio.volume.set",
    "volume_mute": "audio.volume.mute_toggle",
    "media_play": "audio.media.play",
    "media_next": "audio.media.next",
    "media_prev": "audio.media.previous",
    "media": "audio.media.play",
    "app_launch": "shell.app.launch",
    "command": "shell.command.run",
    "script": "shell.script.run",
    "noop": "core.noop",
}


def _legacy_action_id(legacy_type: str) -> str:
    return _LEGACY_ACTION_MAP.get(legacy_type.lower(), "core.noop")
