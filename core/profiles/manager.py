"""Profile persistence in JSON files."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

from ..mapper.models import Mapping


@dataclass
class Profile:
    name: str
    device_name: str | None = None
    mappings: list[Mapping] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "device_name": self.device_name,
            "mappings": [m.to_dict() for m in self.mappings],
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Profile":
        return cls(
            name=data.get("name", "default"),
            device_name=data.get("device_name"),
            mappings=[Mapping.from_dict(x) for x in data.get("mappings", [])],
        )


class ProfileManager:
    def __init__(self, root: Path) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self._ensure_default()

    def _ensure_default(self) -> None:
        if not self._path_for("default").exists():
            self.save(Profile(name="default"))

    def list_profiles(self) -> list[str]:
        return sorted(path.stem for path in self.root.glob("*.json"))

    def load(self, name: str) -> Profile:
        path = self._path_for(name)
        if not path.exists():
            return Profile(name=name)
        return Profile.from_dict(json.loads(path.read_text(encoding="utf-8")))

    def save(self, profile: Profile) -> Path:
        path = self._path_for(profile.name)
        path.write_text(json.dumps(profile.to_dict(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        return path

    def delete(self, name: str) -> None:
        path = self._path_for(name)
        if path.exists():
            path.unlink()

    def _path_for(self, name: str) -> Path:
        safe = re.sub(r"[^A-Za-z0-9_-]+", "_", name).strip("_") or "profile"
        return self.root / f"{safe}.json"
