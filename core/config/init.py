"""Hardware configuration loader."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class HardwareConfig:
    def __init__(self, config_path: Path) -> None:
        self._config_path = config_path
        self._data: dict[str, Any] = {}
        self._load()

    def _load(self) -> None:
        if self._config_path.exists():
            self._data = json.loads(self._config_path.read_text(encoding="utf-8"))
            self._apply_defaults()
        else:
            self._data = self._default_config()
            self._save()

    def _apply_defaults(self) -> None:
        """Backfill newly introduced config fields without breaking old files."""
        default = self._default_config()

        for device_name, device_config in default.items():
            current_device = self._data.setdefault(device_name, {})

            for component_name, component_config in device_config.items():
                current_component = current_device.setdefault(component_name, {})

                if isinstance(component_config, dict):
                    for key, value in component_config.items():
                        current_component.setdefault(key, value)

        self._save()

    def _save(self) -> None:
        self._config_path.parent.mkdir(parents=True, exist_ok=True)
        self._config_path.write_text(
            json.dumps(self._data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    def _default_config(self) -> dict[str, Any]:
        return {
            "starrykey25": {
                "keyboard": {
                    "channel": 1,
                    "note_range": [48, 72],
                    "mapping_range": [0, 127],
                    "description": "Teclado físico de 25 teclas (C3-C5), com mapeamento por nota MIDI real",
                },
                "pads": {
                    "channel": 10,
                    "banks": {
                        "A": [36, 37, 38, 39, 40, 41, 42, 43],
                        "B": [44, 45, 46, 47, 48, 49, 50, 51],
                        "C": [52, 53, 54, 55, 56, 57, 58, 59],
                    },
                    "description": "Pads em 3 bancos (A, B, C)",
                },
                "knobs": {
                    "channel": 2,
                    "cc_numbers": [20, 21, 22, 23],
                    "description": "4 knobs absolutos",
                },
                "buttons": {
                    "channel": 3,
                    "cc_numbers": [59, 60, 61, 62],
                    "mode": "toggle",
                    "description": "4 botões A, B, C, D",
                },
                "pitch_bend": {
                    "channel": 4,
                    "description": "Pitch bend wheel",
                },
                "modulation": {
                    "channel": 5,
                    "cc_number": 1,
                    "description": "Modulation wheel",
                },
                "sustain": {
                    "channel": 1,
                    "cc_number": 64,
                    "description": "Pedal de sustain",
                },
            }
        }

    def get(self, device: str, component: str, key: str, default: Any = None) -> Any:
        try:
            return self._data[device][component][key]
        except KeyError:
            return default

    def set(self, device: str, component: str, key: str, value: Any) -> None:
        if device not in self._data:
            self._data[device] = {}
        if component not in self._data[device]:
            self._data[device][component] = {}

        self._data[device][component][key] = value
        self._save()

    def get_device_config(self, device: str) -> dict[str, Any]:
        return self._data.get(device, {})


# Singleton global
_config: HardwareConfig | None = None


def get_config(root_path: Path) -> HardwareConfig:
    global _config

    if _config is None:
        config_file = root_path / "config" / "hardware_channels.json"
        _config = HardwareConfig(config_file)

    return _config
