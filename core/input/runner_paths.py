"""Path and argument helpers used by ActionRunner."""
from __future__ import annotations

import os
import shlex
from pathlib import Path

SCRIPT_EXTS = {".py", ".ps1", ".bat", ".cmd", ".vbs"}


def resolve_command(raw: str) -> tuple[str, list[str]]:
    text = _expand(_strip_outer_quotes(raw).strip())
    if not text:
        return "", []
    if Path(text).exists():
        return str(Path(text)), []

    parts = [_expand(_strip_outer_quotes(item)) for item in split_args(text)]
    for idx in range(len(parts), 0, -1):
        candidate = " ".join(parts[:idx]).strip()
        if candidate and Path(candidate).exists():
            return str(Path(candidate)), parts[idx:]
    return (parts[0], parts[1:]) if parts else ("", [])


def split_args(raw: str) -> list[str]:
    try:
        return [item for item in shlex.split(raw, posix=False) if item]
    except ValueError:
        return [item for item in raw.split() if item]


def script_workdir(path: str) -> str | None:
    parent = Path(path).parent
    return str(parent) if parent.exists() else None


def to_unit(value: int) -> float:
    if value < 0:
        return max(0.0, min(1.0, (value + 8192.0) / 16383.0))
    return max(0.0, min(1.0, value / 127.0))


def _expand(value: str) -> str:
    return os.path.expandvars(os.path.expanduser(value))


def _strip_outer_quotes(value: str) -> str:
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value
