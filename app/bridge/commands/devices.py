"""save_device / load_device / list_devices."""
from __future__ import annotations

from typing import Any

from app.runtime import Runtime
from core.models import Device


def handle_save_device(runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    data = payload.get("device") or {}
    if not isinstance(data, dict):
        raise ValueError("device deve ser um objeto")
    device = Device.from_dict(data)
    runtime.devices.save(device)
    return device.to_dict()


def handle_load_device(runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    device_id = str(payload.get("device_id", "")).strip()
    if not device_id:
        raise ValueError("device_id obrigatório")
    device = runtime.devices.load(device_id)
    if not device:
        raise RuntimeError(f"device {device_id} não encontrado")
    runtime.set_active_device(device)
    return device.to_dict()


def handle_list_devices(runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    return {"devices": runtime.devices.list_devices()}
