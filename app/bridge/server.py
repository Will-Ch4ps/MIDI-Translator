"""Dispatcher de comandos — recebe (cmd, payload) e roteia pros handlers."""
from __future__ import annotations

import json
import sys
import traceback
from pathlib import Path
from typing import Any, Callable

# Windows console default cp1252 quebra com caracteres tipo '→'.
# Forçamos UTF-8 antes de qualquer print pra bridge ser robusta.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from app.runtime import Runtime
from app.bridge.commands import COMMANDS

_runtime: Runtime | None = None


def get_runtime() -> Runtime:
    global _runtime
    if _runtime is None:
        root = Path(__file__).resolve().parents[2]
        _runtime = Runtime(root=root)
    return _runtime


def dispatch(command: str, payload: dict[str, Any]) -> dict[str, Any]:
    handler = COMMANDS.get(command)
    if not handler:
        return {"ok": False, "error": f"comando desconhecido: {command}"}
    try:
        data = handler(get_runtime(), payload or {})
        return {"ok": True, "data": data}
    except Exception as exc:  # noqa: BLE001
        traceback.print_exc(file=sys.stderr)
        return {"ok": False, "error": str(exc)}


def main() -> int:
    """CLI: lê (command, payload) por argv ou stdin e imprime JSON."""
    if len(sys.argv) < 2:
        print(json.dumps({"ok": False, "error": "uso: bridge.server <command> [json]"}), flush=True)
        return 1
    command = sys.argv[1]
    payload_text = sys.argv[2] if len(sys.argv) >= 3 else (sys.stdin.read() or "{}")
    try:
        payload = json.loads(payload_text or "{}")
    except json.JSONDecodeError as exc:
        print(json.dumps({"ok": False, "error": f"payload inválido: {exc}"}), flush=True)
        return 1
    result = dispatch(command, payload)
    print(json.dumps(result, ensure_ascii=False), flush=True)
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
