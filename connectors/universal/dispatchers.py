"""Dispatcher que executa o kind declarado num pack JSON."""
from __future__ import annotations

import socket
import struct
import subprocess
import sys
import urllib.error
import urllib.request
from typing import Any

from core.models import MidiEvent


def dispatch(kind: str, params: dict[str, Any], event: MidiEvent) -> None:
    handler = _HANDLERS.get(kind)
    if not handler:
        print(f"[universal] kind desconhecido: {kind}", file=sys.stderr, flush=True)
        return
    handler(params, event)


def _dispatch_http(params: dict[str, Any], event: MidiEvent) -> None:
    if not event.pressed and not event.is_continuous:
        return
    url = str(params.get("url", "")).replace("{{value}}", str(event.value))
    if not url:
        return
    method = str(params.get("method", "GET")).upper()
    body = str(params.get("body", "")).replace("{{value}}", str(event.value))
    data = body.encode("utf-8") if body else None
    headers = dict(params.get("headers") or {})
    request = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=5.0) as response:
            response.read()
    except urllib.error.URLError as exc:
        print(f"[universal/http] {url}: {exc}", file=sys.stderr, flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"[universal/http] {url}: {exc}", file=sys.stderr, flush=True)


def _dispatch_osc(params: dict[str, Any], event: MidiEvent) -> None:
    if not event.pressed and not event.is_continuous:
        return
    host = str(params.get("host", "127.0.0.1"))
    port = int(params.get("port", 8000))
    address = str(params.get("address", "")).strip()
    if not address:
        return
    args_text = str(params.get("args", "")).replace("{{value}}", str(event.value))
    payload = _encode_osc(address, _parse_args(args_text))
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.sendto(payload, (host, port))
    except Exception as exc:  # noqa: BLE001
        print(f"[universal/osc] {address}: {exc}", file=sys.stderr, flush=True)


def _dispatch_shell(params: dict[str, Any], event: MidiEvent) -> None:
    if not event.pressed:
        return
    command = str(params.get("command", ""))
    if not command:
        return
    try:
        subprocess.Popen(command, shell=True)
    except Exception as exc:  # noqa: BLE001
        print(f"[universal/shell] {command}: {exc}", file=sys.stderr, flush=True)


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


_HANDLERS = {
    "http": _dispatch_http,
    "osc": _dispatch_osc,
    "shell": _dispatch_shell,
}
