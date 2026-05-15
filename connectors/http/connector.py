"""Connector HTTP — webhooks GET/POST/PUT/DELETE."""
from __future__ import annotations

import json as _json
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus


class HttpConnector:
    manifest = ConnectionManifest(
        id="http",
        name="HTTP / Webhook",
        description="Dispara requisições HTTP (Home Assistant, OBS REST, qualquer webhook).",
        icon="webhook",
        category="Integrações",
        keywords=["http", "rest", "webhook", "home assistant", "ifttt"],
    )

    def bind(self, _services: dict[str, Any]) -> None:
        return

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        yield _request_def(), _request_handler

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        return ConnectionStatus.READY


def _request_def() -> ActionDef:
    return ActionDef(
        id="http.request",
        connector_id="http",
        label="Requisição HTTP",
        description="Envia GET/POST/PUT/DELETE com headers e body opcionais.",
        icon="globe",
        category="Integrações",
        capabilities=[],
        params_schema=ParamsSchema(fields=[
            ParamField(name="method", type="choice", label="Método", default="GET",
                       choices=["GET", "POST", "PUT", "DELETE", "PATCH"]),
            ParamField(name="url", type="string", label="URL", required=True),
            ParamField(name="headers", type="kv", label="Headers (k=v por linha)", default=""),
            ParamField(name="body", type="text", label="Body (JSON ou texto)", default=""),
            ParamField(name="timeout_ms", type="int", label="Timeout (ms)", default=5000, min=100, max=60000),
            ParamField(name="send_value", type="bool", label="Trocar {{value}} pelo valor do knob", default=False),
        ]),
        example="POST http://homeassistant.local:8123/api/services/light/toggle",
        continuous=False,
    )


def _request_handler(action: Action, event: MidiEvent) -> None:
    if not event.pressed and not event.is_continuous:
        return
    if event.is_continuous and not action.params.get("send_value"):
        return

    url = str(action.params.get("url", "")).strip()
    if not url:
        return

    method = str(action.params.get("method", "GET")).upper()
    headers = _parse_headers(str(action.params.get("headers", "")))
    body_text = str(action.params.get("body", ""))
    if action.params.get("send_value"):
        body_text = body_text.replace("{{value}}", str(event.value))
        url = url.replace("{{value}}", str(event.value))

    data = body_text.encode("utf-8") if body_text else None
    if data and "content-type" not in {k.lower() for k in headers}:
        headers["Content-Type"] = "application/json" if _looks_json(body_text) else "text/plain"

    timeout = max(0.1, int(action.params.get("timeout_ms", 5000)) / 1000.0)
    request = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            response.read()
    except urllib.error.URLError as exc:
        print(f"[http] {url}: {exc}", file=sys.stderr, flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"[http] {url} falhou: {exc}", file=sys.stderr, flush=True)


def _parse_headers(text: str) -> dict[str, str]:
    headers: dict[str, str] = {}
    for line in (text or "").splitlines():
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if key:
            headers[key] = value
    return headers


def _looks_json(text: str) -> bool:
    text = text.strip()
    if not text or text[0] not in "{[":
        return False
    try:
        _json.loads(text)
        return True
    except Exception:  # noqa: BLE001
        return False
