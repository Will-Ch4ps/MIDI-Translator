"""Connector universal — fábrica de ações lendo JSON manifestos do disco.

Cada arquivo em `connectors/universal/packs/*.json` define ações no
formato:

    {
      "id": "myhouse.lampada_sala",
      "label": "Lâmpada sala",
      "icon": "lamp",
      "category": "Casa",
      "kind": "http" | "osc" | "shell",
      "params": {...},        # parametros default
      "fields": [...]         # ParamField list opcional pra UI
    }
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema, Recipe

from ..base import register_connector  # noqa: F401  (mantém import limpo)
from ..manifest import ConnectionManifest, ConnectionStatus
from .dispatchers import dispatch


class UniversalConnector:
    manifest = ConnectionManifest(
        id="universal",
        name="Customizado (JSON)",
        description="Ações declaradas pelo usuário em JSON (HTTP, OSC, shell). Não precisa código.",
        icon="puzzle",
        category="Integrações",
        keywords=["custom", "json", "declarativo"],
    )

    def __init__(self, packs_dir: Path | None = None) -> None:
        self._dir = Path(packs_dir or Path(__file__).resolve().parent / "packs")
        self._dir.mkdir(parents=True, exist_ok=True)
        self._loaded: list[dict] = []

    def bind(self, _services: dict[str, Any]) -> None:
        return

    def reload(self) -> None:
        self._loaded.clear()
        for path in sorted(self._dir.glob("*.json")):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
            except Exception:  # noqa: BLE001
                continue
            for entry in (data if isinstance(data, list) else [data]):
                if isinstance(entry, dict):
                    entry["_source"] = str(path)
                    self._loaded.append(entry)

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        self.reload()
        for entry in self._loaded:
            definition = self._action_def(entry)
            handler = self._make_handler(entry)
            yield definition, handler

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        return ConnectionStatus.READY

    def _action_def(self, entry: dict) -> ActionDef:
        fields = [
            ParamField(**field)
            for field in entry.get("fields", [])
            if isinstance(field, dict) and "name" in field
        ]
        return ActionDef(
            id=str(entry.get("id", "universal.untitled")),
            connector_id="universal",
            label=str(entry.get("label", entry.get("id", ""))),
            description=str(entry.get("description", "")),
            icon=str(entry.get("icon", "puzzle")),
            category=str(entry.get("category", "Customizado")),
            capabilities=list(entry.get("capabilities", [])),
            params_schema=ParamsSchema(fields=fields),
            example=str(entry.get("example", "")),
            continuous=bool(entry.get("continuous", False)),
        )

    def _make_handler(self, entry: dict):
        kind = str(entry.get("kind", "")).lower()
        defaults = dict(entry.get("params", {}))

        def handler(action: Action, event: MidiEvent) -> None:
            merged = {**defaults, **action.params}
            dispatch(kind, merged, event)
        return handler
