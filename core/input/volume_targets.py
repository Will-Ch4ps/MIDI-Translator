"""Helpers for selecting and matching per-app audio targets."""
from __future__ import annotations

from pathlib import Path
from typing import Any

TARGET_ALIASES = {
    "master": ["master"],
    "system": ["master"],
    "global": ["master"],
    "lol": [
        "leagueclientux.exe",
        "leagueclientuxrender.exe",
        "league of legends.exe",
        "riotclientservices.exe",
        "riot client.exe",
    ],
    "browser": ["chrome.exe", "msedge.exe", "firefox.exe", "brave.exe", "opera.exe", "vivaldi.exe"],
    "youtube": ["chrome.exe", "msedge.exe", "firefox.exe", "brave.exe", "opera.exe", "vivaldi.exe"],
    "discord": ["discord.exe", "discordcanary.exe", "discordptb.exe"],
    "spotify": ["spotify.exe"],
    "obs": ["obs64.exe", "obs32.exe"],
}

DISCOVERY_BASE = ["master", "lol", "browser", "youtube", "discord", "spotify", "obs"]


def normalize_target(raw: str) -> str:
    text = (raw or "master").strip().lower()
    if text in {"", "master", "system", "global"}:
        return "master"
    return _leaf(text)


def expand_target_tokens(raw: str) -> list[str]:
    text = normalize_target(raw)
    chunks = [item.strip().lower() for item in text.replace(";", "|").replace(",", "|").split("|") if item.strip()]
    if not chunks:
        return ["master"]
    expanded: list[str] = []
    for token in chunks:
        alias_items = TARGET_ALIASES.get(token, [token])
        for alias in alias_items:
            value = alias.strip().lower()
            if value:
                expanded.append(_leaf(value))
    return list(dict.fromkeys(expanded))


def session_info(session: Any) -> dict[str, Any] | None:
    process = getattr(session, "Process", None)
    if not process:
        return None

    pid = int(getattr(process, "pid", 0) or 0)
    raw_name = _safe_call(process, "name")
    path = _safe_call(process, "exe")
    if not raw_name and path:
        raw_name = Path(path).name

    target = _leaf(raw_name)
    if not target:
        return None

    volume = None
    try:
        volume = float(session.SimpleAudioVolume.GetMasterVolume())
    except Exception:  # noqa: BLE001
        volume = None

    return {
        "pid": pid,
        "name": target,
        "path": path,
        "display": Path(raw_name or target).stem.replace("_", " ").strip(),
        "target": target,
        "canonical": _canonical(target),
        "volume": volume,
    }


def session_matches(info: dict[str, Any], raw_target: str) -> bool:
    tokens = expand_target_tokens(raw_target)
    pid = int(info.get("pid") or 0)
    name = str(info.get("name") or "").lower()
    canonical = str(info.get("canonical") or _canonical(name))
    for token in tokens:
        if token.startswith("pid:"):
            if int(token[4:] or 0) == pid:
                return True
            continue
        leaf = _leaf(token)
        if not leaf:
            continue
        if name == leaf:
            return True
        if canonical == _canonical(leaf):
            return True
    return False


def inspect_target(raw_target: str, apps: list[dict[str, Any]]) -> dict[str, Any]:
    target = normalize_target(raw_target)
    if target == "master":
        return {
            "status": "ok",
            "exists": True,
            "resolved": "master",
            "name": "master",
            "args": "",
            "matches": [],
            "message": "Volume master (sistema).",
        }

    matches = [app for app in apps if session_matches(app, target)]
    if matches:
        labels = ", ".join(f"{item['name']} (pid {item['pid']})" for item in matches[:3])
        return {
            "status": "ok",
            "exists": True,
            "resolved": target,
            "name": target,
            "args": "",
            "matches": matches,
            "message": f"Alvo ativo: {labels}",
        }

    return {
        "status": "warn",
        "exists": False,
        "resolved": target,
        "name": target,
        "args": "",
        "matches": [],
        "message": "Nenhum app de audio ativo bate com esse alvo agora.",
    }


def _leaf(text: str) -> str:
    value = (text or "").strip().lower()
    if "\\" in value or "/" in value:
        value = value.replace("\\", "/").split("/")[-1].strip()
    return value


def _canonical(text: str) -> str:
    value = _leaf(text)
    if value.endswith(".exe"):
        value = value[:-4]
    for char in (" ", "-", "_", "."):
        value = value.replace(char, "")
    return value


def _safe_call(obj: Any, attr: str) -> str:
    if not hasattr(obj, attr):
        return ""
    try:
        value = getattr(obj, attr)()
    except Exception:  # noqa: BLE001
        return ""
    return str(value or "").strip()
