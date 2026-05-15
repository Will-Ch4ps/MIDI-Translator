"""Carrega e salva Devices descobertos em `devices/<slug>.json` (novo formato)."""
from __future__ import annotations

import json
import re
from pathlib import Path

from ..models import Device


class DeviceRegistry:
    def __init__(self, root: Path) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def list_devices(self) -> list[str]:
        out: list[str] = []
        for path in self.root.glob("*.json"):
            if self._is_new_format(path):
                out.append(path.stem)
        return sorted(out)

    def load(self, device_id: str) -> Device | None:
        path = self._path_for(device_id)
        if not path.exists():
            return None
        data = json.loads(path.read_text(encoding="utf-8"))
        if not self._is_new_format_data(data):
            return None
        return Device.from_dict(data)

    def save(self, device: Device) -> Path:
        path = self._path_for(device.id)
        payload = device.to_dict()
        payload["_format"] = "midi-studio.device.v2"
        path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        return path

    def delete(self, device_id: str) -> bool:
        path = self._path_for(device_id)
        if path.exists():
            path.unlink()
            return True
        return False

    def _path_for(self, device_id: str) -> Path:
        safe = re.sub(r"[^A-Za-z0-9_-]+", "_", device_id).strip("_") or "device"
        return self.root / f"{safe}.json"

    @staticmethod
    def _is_new_format(path: Path) -> bool:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return False
        return DeviceRegistry._is_new_format_data(data)

    @staticmethod
    def _is_new_format_data(data: dict) -> bool:
        return data.get("_format") == "midi-studio.device.v2"
