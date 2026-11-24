"""Catálogo para o seletor de programas da UI: abertos agora + instalados (menu Iniciar).

Apps da Microsoft Store guardam a versão no caminho do .exe
(ex.: ...\\WindowsApps\\OpenAI.Codex_26.506.3741.0_x64__2p2nq...\\Codex.exe), que
muda a cada atualização. Para eles usamos `shell:AppsFolder\\<AppID>`, que é estável.
"""
from __future__ import annotations

import json
import re
import subprocess
from typing import Any

from .file_info import file_description
from .program_targets import discover_running_programs

CREATE_NO_WINDOW = 0x08000000
JUNK_NAME = re.compile(r"(uninstall|desinstal|readme|leia-me|license|licen[cç]a|help|ajuda|manual)", re.I)
JUNK_TARGET = re.compile(r"^(https?:|mailto:)|\.(txt|pdf|chm|html?|url|ini)$", re.I)
SELF_EXE = "miditranslate.exe"
STORE_PATH = re.compile(r"\\windowsapps\\([^\\_]+)_[^\\]*__([a-z0-9]+)\\", re.I)


def list_programs() -> dict[str, list[dict[str, Any]]]:
    installed = _start_apps()
    running: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in discover_running_programs():
        path = str(item.get("path") or "")
        if str(item.get("name") or "").lower() == SELF_EXE:
            continue
        name = file_description(path) or str(item.get("display") or item.get("name") or "")
        target = _store_target(path, installed) or str(item.get("target") or path)
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        running.append({"name": name, "target": target, "path": path})
    running.sort(key=lambda app: app["name"].lower())

    apps: list[dict[str, Any]] = []
    names: set[str] = set()
    for app in sorted(installed, key=lambda a: a["name"].lower()):
        if JUNK_NAME.search(app["name"]) or JUNK_TARGET.search(app["app_id"]) or app["name"].lower() in names:
            continue
        names.add(app["name"].lower())
        apps.append({"name": app["name"], "target": f"shell:AppsFolder\\{app['app_id']}", "path": ""})
    return {"running": running, "installed": apps}


def _store_target(path: str, installed: list[dict[str, str]]) -> str:
    """...\\WindowsApps\\OpenAI.Codex_<versão>__<publisher>\\... → shell:AppsFolder\\OpenAI.Codex_<publisher>!App"""
    match = STORE_PATH.search(path)
    if not match:
        return ""
    family = f"{match.group(1)}_{match.group(2)}!".lower()
    for app in installed:
        if app["app_id"].lower().startswith(family):
            return f"shell:AppsFolder\\{app['app_id']}"
    return ""


def _start_apps() -> list[dict[str, str]]:
    script = "[Console]::OutputEncoding=[Text.Encoding]::UTF8; Get-StartApps | Select-Object Name, AppID | ConvertTo-Json -Compress"
    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
            capture_output=True, timeout=10, creationflags=CREATE_NO_WINDOW,
        )
        data = json.loads(result.stdout.decode("utf-8-sig") or "[]")
    except Exception:  # noqa: BLE001
        return []
    if isinstance(data, dict):
        data = [data]
    return [
        {"name": str(app.get("Name") or "").strip(), "app_id": str(app.get("AppID") or "").strip()}
        for app in data
        if app.get("Name") and app.get("AppID")
    ]
