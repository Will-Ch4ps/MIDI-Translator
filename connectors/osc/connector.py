"""Connector OSC — UDP sem dependências externas."""
from __future__ import annotations

import socket
import struct
import sys
from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus


class OscConnector:
    manifest = ConnectionManifest(
        id="osc",
        name="OSC",
        description="Envia mensagens Open Sound Control (Resolume, QLab, TouchOSC, Reaper).",
        icon="radio",
        category="MIDI",
        requires_setup=True,
        keywords=["osc", "resolume", "qlab", "touchosc", "reaper", "vj"],
    )

    def bind(self, _services: dict[str, Any]) -> None:
        return

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        yield _send_def(), _send_handler

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        return ConnectionStatus.READY


def _send_def() -> ActionDef:
    return ActionDef(
        id="osc.send",
        connector_id="osc",
        label="Enviar OSC",
        description="Envia uma mensagem OSC com endereço e argumentos.",
        icon="send",
        category="MIDI",
        capabilities=[],
        params_schema=ParamsSchema(fields=[
            ParamField(name="host", type="string", label="Host", default="127.0.0.1", required=True),
            ParamField(name="port", type="int", label="Porta", default=8000, min=1, max=65535, required=True),
            ParamField(name="address", type="string", label="Endereço OSC", required=True,
                       description="ex: /scene/1/trigger"),
            ParamField(name="args", type="string", label="Args (i/f/s separados por espaço)", default="1",
                       description="Use i=int, f=float, s=string. Ex: 'i:1 f:0.5'. Ou {{value}} pro valor do knob."),
        ]),
        example="Resolume: /composition/columns/1/connect, args='1'.",
        continuous=True,
    )


def _send_handler(action: Action, event: MidiEvent) -> None:
    if not event.pressed and not event.is_continuous:
        return
    address = str(action.params.get("address", "")).strip()
    if not address:
        return
    host = str(action.params.get("host", "127.0.0.1"))
    port = int(action.params.get("port", 8000))
    args_text = str(action.params.get("args", "")).replace("{{value}}", str(event.value))
    payload = _encode_osc(address, _parse_args(args_text))
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.sendto(payload, (host, port))
    except Exception as exc:  # noqa: BLE001
        print(f"[osc] {host}:{port}{address} falhou: {exc}", file=sys.stderr, flush=True)


def _parse_args(text: str) -> list[tuple[str, Any]]:
    items: list[tuple[str, Any]] = []
    for token in text.split():
        if ":" in token:
            tag, raw = token.split(":", 1)
        else:
            tag, raw = "i", token
        tag = tag.lower()
        try:
            if tag == "i":
                items.append(("i", int(float(raw))))
            elif tag == "f":
                items.append(("f", float(raw)))
            else:
                items.append(("s", raw))
        except ValueError:
            items.append(("s", raw))
    return items


def _encode_osc(address: str, args: list[tuple[str, Any]]) -> bytes:
    addr_bytes = _pad(address.encode("utf-8") + b"\x00")
    tags = "," + "".join(t for t, _ in args)
    tag_bytes = _pad(tags.encode("ascii") + b"\x00")
    body = b""
    for tag, value in args:
        if tag == "i":
            body += struct.pack(">i", int(value))
        elif tag == "f":
            body += struct.pack(">f", float(value))
        else:
            body += _pad(str(value).encode("utf-8") + b"\x00")
    return addr_bytes + tag_bytes + body


def _pad(data: bytes) -> bytes:
    remainder = len(data) % 4
    if remainder == 0:
        return data
    return data + b"\x00" * (4 - remainder)
