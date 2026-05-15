"""Connector REAPER — comanda transport e tracks via OSC nativo."""
from __future__ import annotations

import socket
import struct
import sys
from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus


class ReaperConnector:
    manifest = ConnectionManifest(
        id="reaper",
        name="REAPER",
        description="Transport, gravação e tracks via OSC nativo do REAPER.",
        icon="audio-waveform",
        category="DAW",
        requires_setup=True,
        docs_url="https://www.reaper.fm/sdk/osc/osc.php",
        keywords=["reaper", "daw", "transport", "record"],
    )

    def __init__(self, host: str = "127.0.0.1", port: int = 8000) -> None:
        self._host = host
        self._port = port

    def bind(self, _services: dict[str, Any]) -> None:
        return

    def configure(self, host: str, port: int) -> None:
        self._host = host
        self._port = port

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        yield _addr_def("reaper.play", "Play", "play", "/play"), self._make_send("/play")
        yield _addr_def("reaper.stop", "Stop", "square", "/stop"), self._make_send("/stop")
        yield _addr_def("reaper.record", "Record", "circle-dot", "/record"), self._make_send("/record")
        yield _addr_def("reaper.loop", "Loop", "repeat", "/repeat"), self._make_send("/repeat")
        yield _custom_def(), self._make_custom()

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        return ConnectionStatus.READY

    def _make_send(self, address: str):
        def handler(_action: Action, event: MidiEvent) -> None:
            if not event.pressed:
                return
            self._send(address, [("i", 1)])
        return handler

    def _make_custom(self):
        def handler(action: Action, event: MidiEvent) -> None:
            if not event.pressed and not event.is_continuous:
                return
            address = str(action.params.get("address", ""))
            if not address:
                return
            value = event.value / 127.0 if event.is_continuous else 1
            tag = "f" if event.is_continuous else "i"
            self._send(address, [(tag, value)])
        return handler

    def _send(self, address: str, args: list[tuple[str, Any]]) -> None:
        payload = _encode_osc(address, args)
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
                sock.sendto(payload, (self._host, self._port))
        except Exception as exc:  # noqa: BLE001
            print(f"[reaper] {address}: {exc}", file=sys.stderr, flush=True)


def _addr_def(action_id: str, label: str, icon: str, _address: str) -> ActionDef:
    return ActionDef(
        id=action_id,
        connector_id="reaper",
        label=label,
        icon=icon,
        category="DAW",
        capabilities=[],
    )


def _custom_def() -> ActionDef:
    return ActionDef(
        id="reaper.osc.send",
        connector_id="reaper",
        label="Enviar OSC custom",
        description="Envia um endereço OSC qualquer ao REAPER (ex: /track/1/volume).",
        icon="send",
        category="DAW",
        capabilities=[],
        params_schema=ParamsSchema(fields=[
            ParamField(name="address", type="string", label="Endereço OSC", required=True),
        ]),
        continuous=True,
    )


def _encode_osc(address: str, args: list[tuple[str, Any]]) -> bytes:
    addr = _pad(address.encode("utf-8") + b"\x00")
    tags = ("," + "".join(t for t, _ in args)).encode("ascii") + b"\x00"
    body = b""
    for tag, value in args:
        if tag == "i":
            body += struct.pack(">i", int(value))
        elif tag == "f":
            body += struct.pack(">f", float(value))
        else:
            body += _pad(str(value).encode("utf-8") + b"\x00")
    return addr + _pad(tags) + body


def _pad(data: bytes) -> bytes:
    rem = len(data) % 4
    return data if rem == 0 else data + b"\x00" * (4 - rem)
