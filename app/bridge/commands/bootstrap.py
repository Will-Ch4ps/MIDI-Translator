"""bootstrap: estado inicial completo pra UI."""
from __future__ import annotations

from typing import Any

from app.runtime import Runtime
from app.bridge.preset_packs_builtin import list_builtin_preset_packs


def handle_bootstrap(runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    devices = [device for device in (runtime.devices.load(name) for name in runtime.devices.list_devices()) if device]
    active_device = devices[0] if devices and runtime.active_device is None else runtime.active_device
    if active_device and runtime.active_device is None:
        runtime.set_active_device(active_device)

    profile = runtime.active_profile
    if profile is None and active_device is not None:
        profile_names = runtime.profiles.list_profiles()
        name = profile_names[0] if profile_names else "Meu setup"
        profile = runtime.profiles.load(name)
        if not profile.device_id:
            profile.device_id = active_device.id
        runtime.load_profile(profile)

    return {
        "platform": {
            "os": runtime.backend.platform.os,
            "display_server": runtime.backend.platform.display_server,
            "desktop": runtime.backend.platform.desktop,
        },
        "devices": [d.to_dict() for d in devices],
        "active_device_id": active_device.id if active_device else None,
        "profile": profile.to_dict() if profile else None,
        "connectors": _connector_summaries(runtime),
        "actions": [d.to_dict() for d in runtime.actions.all_defs()],
        "available_action_ids": runtime.actions.available_ids(),
        "preset_packs": [p.to_dict() for p in list_builtin_preset_packs()],
        "midi_input_ports": runtime.midi_input_ports(),
        "midi_output_ports": runtime.midi_output_ports(),
        "active_layer": runtime.router.layer_state.current,
    }


def _connector_summaries(runtime: Runtime) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for connector in runtime.connectors.all():
        manifest = connector.manifest.to_dict()
        manifest["status"] = connector.status().value
        manifest["action_count"] = runtime.connectors.action_count(connector.manifest.id)
        out.append(manifest)
    return out
