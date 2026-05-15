"""Connector Home Assistant — dispara service calls via REST API."""
from __future__ import annotations

import json as _json
import os
import sys
import urllib.error
import urllib.request
from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus


class HomeAssistantConnector:
    manifest = ConnectionManifest(
        id="home_assistant",
        name="Home Assistant",
        description="Liga/desliga luzes, dispara cenas, executa scripts via REST API.",
        icon="house",
        category="Casa inteligente",
        requires_setup=True,
        docs_url="https://www.home-assistant.io/integrations/api/",
        keywords=["hass", "home assistant", "luz", "cena", "smart home"],
    )

    def __init__(self) -> None:
        self._base_url = os.environ.get("HASS_URL", "").rstrip("/")
        self._token = os.environ.get("HASS_TOKEN", "")

    def bind(self, _services: dict[str, Any]) -> None:
        return

    def configure(self, base_url: str, token: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._token = token

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        yield _service_def(), self._call_service
        yield _scene_def(), self._activate_scene

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        if not self._base_url or not self._token:
            return ConnectionStatus.INSTALLED
        try:
            request = urllib.request.Request(
                f"{self._base_url}/api/", headers={"Authorization": f"Bearer {self._token}"}
            )
            with urllib.request.urlopen(request, timeout=2.0) as response:
                return ConnectionStatus.READY if response.status == 200 else ConnectionStatus.ERROR
        except Exception:  # noqa: BLE001
            return ConnectionStatus.OFFLINE

    def _call_service(self, action: Action, event: MidiEvent) -> None:
        if not event.pressed and not event.is_continuous:
            return
        if not self._base_url or not self._token:
            return
        domain = str(action.params.get("domain", "light"))
        service = str(action.params.get("service", "toggle"))
        entity_id = str(action.params.get("entity_id", ""))
        payload: dict[str, Any] = {}
        if entity_id:
            payload["entity_id"] = entity_id
        extra = action.params.get("data")
        if isinstance(extra, dict):
            payload.update(extra)
        self._post(f"/api/services/{domain}/{service}", payload)

    def _activate_scene(self, action: Action, event: MidiEvent) -> None:
        if not event.pressed:
            return
        if not self._base_url or not self._token:
            return
        scene = str(action.params.get("entity_id", ""))
        if not scene:
            return
        self._post("/api/services/scene/turn_on", {"entity_id": scene})

    def _post(self, path: str, payload: dict[str, Any]) -> None:
        try:
            request = urllib.request.Request(
                f"{self._base_url}{path}",
                data=_json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {self._token}",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            with urllib.request.urlopen(request, timeout=4.0) as response:
                response.read()
        except urllib.error.URLError as exc:
            print(f"[hass] {path}: {exc}", file=sys.stderr, flush=True)
        except Exception as exc:  # noqa: BLE001
            print(f"[hass] {path}: {exc}", file=sys.stderr, flush=True)


def _service_def() -> ActionDef:
    return ActionDef(
        id="home_assistant.service.call",
        connector_id="home_assistant",
        label="Chamar serviço HASS",
        description="Dispara um service.call (ex: light.toggle, switch.turn_on).",
        icon="zap",
        category="Casa inteligente",
        capabilities=[],
        params_schema=ParamsSchema(fields=[
            ParamField(name="domain", type="string", label="Domain", default="light", required=True,
                       description="Ex.: light, switch, media_player, script"),
            ParamField(name="service", type="string", label="Service", default="toggle", required=True),
            ParamField(name="entity_id", type="string", label="Entity ID", default=""),
        ]),
        example="domain=light, service=toggle, entity_id=light.sala",
    )


def _scene_def() -> ActionDef:
    return ActionDef(
        id="home_assistant.scene.activate",
        connector_id="home_assistant",
        label="Ativar cena HASS",
        description="Ativa uma scene.* do Home Assistant.",
        icon="sparkles",
        category="Casa inteligente",
        capabilities=[],
        params_schema=ParamsSchema(fields=[
            ParamField(name="entity_id", type="string", label="scene.algo", required=True),
        ]),
    )
