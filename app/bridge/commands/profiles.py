"""save_profile / load_profile / set_layer."""
from __future__ import annotations

from typing import Any

from app.runtime import Runtime
from core.models import Profile


def handle_save_profile(runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    data = payload.get("profile") or {}
    if not isinstance(data, dict):
        raise ValueError("profile deve ser um objeto")
    profile = Profile.from_dict(data)
    runtime.profiles.save(profile)
    runtime.load_profile(profile)
    return profile.to_dict()


def handle_load_profile(runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    name = str(payload.get("name", "")).strip()
    if not name:
        raise ValueError("name obrigatório")
    profile = runtime.profiles.load(name)
    runtime.load_profile(profile)
    return profile.to_dict()


def handle_set_layer(runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    layer_id = str(payload.get("layer", "default")).strip()
    runtime.set_active_layer(layer_id)
    return {"layer": runtime.router.layer_state.current}
