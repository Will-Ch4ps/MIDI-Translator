"""Manage JSON device layouts."""
from __future__ import annotations

import json
import re
from pathlib import Path

from ..config.init import get_config
from .models import Control, ControlType, DeviceLayout
from .presets import PRESETS


class DeviceManager:
    def __init__(self, root: Path) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        self._current: DeviceLayout | None = None
        self._config = get_config(root.parent)
        self._ensure_presets()

    def _ensure_presets(self) -> None:
        """Ensure built-in preset files reflect the current hardware config.

        O preset StarryKey é gerado a partir de config/hardware_channels.json.
        Reescrevemos o arquivo embutido para evitar layouts antigos sem
        mapping_range, mantendo os controles virtuais fora do JSON persistido.
        """
        from .presets import starrykey25

        config = self._config.get_device_config("starrykey25")
        layout = starrykey25(config if config else None)

        path = self.root / "starrykey25.json"
        self._write(path, layout)

    def list_devices(self) -> list[str]:
        return sorted(path.stem for path in self.root.glob("*.json"))

    def load(self, name: str) -> DeviceLayout:
        path = self._path_for(name)

        if path.exists():
            layout = DeviceLayout.from_dict(json.loads(path.read_text(encoding="utf-8")))
        else:
            layout = PRESETS.get(name, DeviceLayout(name=name))

        self._expand_key_controls(layout)
        self._sanitize(layout)
        self._current = layout
        return layout

    def save(self, layout: DeviceLayout) -> Path:
        self._sanitize(layout)
        path = self._path_for(layout.name)
        self._write(path, layout)
        return path

    def _sanitize(self, layout: DeviceLayout) -> None:
        """Clean unsafe duplicate signatures without breaking NOTE collisions.

        Para CC/pitch/program, assinatura duplicada quase sempre é erro de layout.
        Para NOTE, porém, alguns dispositivos podem sobrepor pads e teclado.

        Então:
        - botões internos ficam sem signature;
        - duplicatas NOTE são preservadas;
        - duplicatas não-NOTE mantêm apenas o primeiro controle.
        """
        seen: dict[str, str] = {}

        for control in layout.controls:
            if control.type == ControlType.BUTTON_INTERNAL:
                control.signature = None
                continue

            if not control.signature:
                continue

            if self._is_note_signature(control.signature):
                continue

            previous = seen.get(control.signature)
            if previous and previous != control.id:
                control.signature = None
            else:
                seen[control.signature] = control.id

    def _expand_key_controls(self, layout: DeviceLayout) -> None:
        """Expand keyboard range controls into mappable KEY_NOTE_* controls.

        - note_range/start_note/count descreve o teclado físico.
        - mapping_range descreve quais notas MIDI reais podem ser mapeadas.
        - Para o StarryKey, o teclado físico tem 25 teclas, mas octave/transpose
          do hardware faz a nota MIDI real mudar. Por isso, mapeamos 0..127.
        """
        expanded: list[Control] = []

        for control in layout.controls:
            if control.type in (ControlType.KEYS_CHROMATIC, ControlType.KEYS_WHITE):
                channel = int(control.params.get("channel", 1))
                start, end = self._mapping_bounds(control)
                count = end - start + 1

                if count > 1:
                    control.params["range_only"] = True

                    for note in range(start, end + 1):
                        if control.type == ControlType.KEYS_WHITE and note % 12 in (1, 3, 6, 8, 10):
                            continue

                        expanded.append(Control(
                            id=f"KEY_NOTE_{note}",
                            label=f"Key {self._note_name(note)}",
                            group=control.group,
                            type=control.type,
                            params={
                                "note": note,
                                "channel": channel,
                                "source": control.id,
                                "virtual": True,
                            },
                            signature=f"note:{channel - 1}:{note}",
                        ))

            expanded.append(control)

        layout.controls = expanded

    @staticmethod
    def _mapping_bounds(control: Control) -> tuple[int, int]:
        mapping_range = control.params.get("mapping_range")

        if isinstance(mapping_range, (list, tuple)) and len(mapping_range) >= 2:
            start = int(mapping_range[0])
            end = int(mapping_range[1])
            return max(0, start), min(127, end)

        start = int(control.params.get("start_note", 0))
        count = int(control.params.get("count", 0))
        end = start + max(0, count - 1)
        return max(0, start), min(127, end)

    @staticmethod
    def _note_name(note: int) -> str:
        names = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
        return f"{names[note % 12]}{(note // 12) - 1}"

    @staticmethod
    def _is_note_signature(signature: str) -> bool:
        return signature.startswith("note:")

    def _path_for(self, name: str) -> Path:
        safe = re.sub(r"[^A-Za-z0-9_-]+", "_", name).strip("_") or "device"
        return self.root / f"{safe}.json"

    @staticmethod
    def _write(path: Path, layout: DeviceLayout) -> None:
        payload = layout.to_dict()
        payload["controls"] = [
            item
            for item in payload["controls"]
            if not item.get("params", {}).get("virtual")
        ]
        path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
