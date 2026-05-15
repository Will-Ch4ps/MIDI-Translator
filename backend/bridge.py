"""Small command bridge used by Tauri to talk to the Python backend."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _ok(data: Any) -> None:
    print(json.dumps({"ok": True, "data": data}, ensure_ascii=False), flush=True)


def _fail(message: str) -> None:
    print(json.dumps({"ok": False, "error": message}, ensure_ascii=False), flush=True)


def _services():
    """Create backend services lazily.

    Imports ficam dentro da função para que erros de import/sintaxe sejam
    capturados pelo main() e retornem como JSON, em vez de causar stdout vazio.
    """
    from core.device.manager import DeviceManager
    from core.profiles.manager import ProfileManager

    return DeviceManager(ROOT / "devices"), ProfileManager(ROOT / "profiles")


def bootstrap(_payload: dict[str, Any]) -> dict[str, Any]:
    from core.midi.devices import find_starrykey, list_input_devices

    devices, profiles = _services()
    layout_name = "starrykey25"
    profile_name = "default"

    layout = devices.load(layout_name)
    profile = profiles.load(profile_name)

    allowed_ids = _mappable_controls(layout)
    filtered = [item for item in profile.mappings if item.control_id in allowed_ids]

    if len(filtered) != len(profile.mappings):
        profile.mappings = filtered
        profiles.save(profile)

    midi_ports = list_input_devices()

    return {
        "layout": layout.to_dict(),
        "profile": profile.to_dict(),
        "layouts": devices.list_devices(),
        "profiles": profiles.list_profiles(),
        "midiPorts": midi_ports,
        "preferredPort": find_starrykey(midi_ports) or "",
    }


def save_mapping(payload: dict[str, Any]) -> dict[str, Any]:
    from core.mapper.models import Mapping

    devices, profiles = _services()
    profile_name = str(payload.get("profile") or "default")
    mapping_data = payload.get("mapping")

    if not isinstance(mapping_data, dict):
        raise ValueError("missing mapping data")

    mapping = Mapping.from_dict(mapping_data)

    if not mapping.control_id:
        raise ValueError("missing control_id")

    layout = devices.load("starrykey25")
    if mapping.control_id not in _mappable_controls(layout):
        raise ValueError(f"control '{mapping.control_id}' is internal and cannot be mapped")

    profile = profiles.load(profile_name)
    profile.mappings = [
        item
        for item in profile.mappings
        if not (item.control_id == mapping.control_id and item.trigger == mapping.trigger)
    ]
    profile.mappings.append(mapping)
    profiles.save(profile)

    return profile.to_dict()


def delete_mapping(payload: dict[str, Any]) -> dict[str, Any]:
    from core.mapper.models import TriggerMode

    _devices, profiles = _services()
    profile_name = str(payload.get("profile") or "default")
    control_id = str(payload.get("control_id") or "")
    trigger_raw = str(payload.get("trigger") or "").strip().lower()

    if not control_id:
        raise ValueError("missing control_id")

    profile = profiles.load(profile_name)

    if trigger_raw:
        try:
            trigger = TriggerMode(trigger_raw)
        except ValueError as exc:
            raise ValueError(f"invalid trigger: {trigger_raw}") from exc
        profile.mappings = [
            item
            for item in profile.mappings
            if not (item.control_id == control_id and item.trigger == trigger)
        ]
    else:
        profile.mappings = [item for item in profile.mappings if item.control_id != control_id]

    profiles.save(profile)

    return profile.to_dict()


def swap_mappings(payload: dict[str, Any]) -> dict[str, Any]:
    devices, profiles = _services()
    profile_name = str(payload.get("profile") or "default")
    source_id = str(payload.get("source_control_id") or "")
    target_id = str(payload.get("target_control_id") or "")

    if not source_id or not target_id:
        raise ValueError("missing control ids")
    if source_id == target_id:
        return profiles.load(profile_name).to_dict()

    layout = devices.load("starrykey25")
    mappable = _mappable_controls(layout)
    if source_id not in mappable or target_id not in mappable:
        raise ValueError("source or target control is internal and cannot be swapped")

    profile = profiles.load(profile_name)
    for item in profile.mappings:
        if item.control_id == source_id:
            item.control_id = target_id
        elif item.control_id == target_id:
            item.control_id = source_id
    profiles.save(profile)
    return profile.to_dict()


def list_audio_targets(_payload: dict[str, Any]) -> dict[str, Any]:
    from core.input.volume import discover_audio_catalog

    return discover_audio_catalog()


def list_running_programs(_payload: dict[str, Any]) -> dict[str, Any]:
    from core.input.program_targets import discover_running_programs

    return {"apps": discover_running_programs()}


def test_action(payload: dict[str, Any]) -> dict[str, Any]:
    from core.input.keyboard import KeyboardEmitter
    from core.input.runner import ActionRunner
    from core.input.volume import VolumeController
    from core.mapper.models import Action
    from core.midi.events import MidiEvent, MidiKind, MidiSignature

    action_data = payload.get("action")
    if not isinstance(action_data, dict):
        raise ValueError("missing action")

    action = Action.from_dict(action_data)
    value = int(payload.get("value", 100))
    pressed = bool(payload.get("pressed", True))
    is_continuous = bool(payload.get("is_continuous", False))

    if is_continuous:
        event = MidiEvent(MidiSignature(MidiKind.CC, 0, 20), max(0, min(127, value)), True, "control_change")
    else:
        event = MidiEvent(MidiSignature(MidiKind.NOTE, 0, 60), max(0, min(127, value)), pressed, "note_on" if pressed else "note_off")

    runner = ActionRunner(KeyboardEmitter(), VolumeController())
    runner.run(action, event)
    return {"tested": True}


def inspect_target(payload: dict[str, Any]) -> dict[str, Any]:
    from core.input.runner_paths import resolve_command
    from core.input.volume import discover_audio_catalog
    from core.input.volume_targets import inspect_target as inspect_volume_target

    action_type = str(payload.get("action_type") or "")
    value = str(payload.get("value") or "").strip()

    if action_type in {"app_launch", "script"}:
        raw_value = value.strip()
        if action_type == "app_launch" and raw_value.lower().startswith(("shell:", "ms-")):
            name = raw_value.split("\\")[-1].split("!")[-1] or "app"
            return {
                "status": "ok",
                "exists": True,
                "resolved": raw_value,
                "name": name,
                "args": "",
                "message": f"Atalho do Windows valido: {name}",
            }
        target, args = resolve_command(value)
        exists = bool(target and Path(target).exists())
        if exists:
            name = Path(target).stem
            return {
                "status": "ok",
                "exists": True,
                "resolved": target,
                "name": name,
                "args": " ".join(args),
                "message": f"Arquivo valido: {name}",
            }
        if target and not any(sep in target for sep in ("\\", "/")):
            return {
                "status": "warn",
                "exists": False,
                "resolved": target,
                "name": target,
                "args": " ".join(args),
                "message": "Comando sem caminho absoluto. Pode funcionar se estiver no PATH.",
            }
        return {
            "status": "error",
            "exists": False,
            "resolved": target,
            "name": "",
            "args": " ".join(args),
            "message": "Caminho nao encontrado.",
        }

    if action_type in {"volume_set", "volume_up", "volume_down"}:
        catalog = discover_audio_catalog()
        apps = list(catalog.get("apps") or [])
        return inspect_volume_target(value, apps)

    return {"status": "info", "exists": False, "resolved": value, "name": "", "args": "", "message": ""}


COMMANDS = {
    "bootstrap": bootstrap,
    "save_mapping": save_mapping,
    "delete_mapping": delete_mapping,
    "swap_mappings": swap_mappings,
    "list_audio_targets": list_audio_targets,
    "list_running_programs": list_running_programs,
    "test_action": test_action,
    "inspect_target": inspect_target,
}


def _mappable_controls(layout) -> set[str]:
    from core.device.models import ControlType

    blocked = {"KEYBOARD"}
    return {
        item.id
        for item in layout.controls
        if item.id not in blocked and item.type != ControlType.BUTTON_INTERNAL
    }

def main() -> int:
    if len(sys.argv) < 2:
        _fail("missing command")
        return 2

    command = sys.argv[1]

    try:
        payload = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    except json.JSONDecodeError as exc:
        _fail(f"invalid payload: {exc}")
        return 2

    handler = COMMANDS.get(command)
    if handler is None:
        _fail(f"unknown command: {command}")
        return 2

    try:
        _ok(handler(payload))
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"[bridge] {type(exc).__name__}: {exc}", file=sys.stderr, flush=True)
        _fail(str(exc))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
