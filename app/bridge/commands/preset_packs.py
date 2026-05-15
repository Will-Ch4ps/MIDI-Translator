"""apply_preset_pack / undo_preset_pack / list_preset_packs."""
from __future__ import annotations

from typing import Any

from app.runtime import Runtime
from app.bridge.preset_packs_builtin import find_builtin_preset_pack, list_builtin_preset_packs
from core.profile import apply_preset_pack, suggest_targets, undo_preset_pack


def handle_apply_preset_pack(runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    pack_id = str(payload.get("pack_id", "")).strip()
    layer = str(payload.get("layer", "default"))
    pack = find_builtin_preset_pack(pack_id)
    if not pack:
        raise ValueError(f"preset pack {pack_id} não encontrado")
    if not runtime.active_device or not runtime.active_profile:
        raise RuntimeError("device e profile ativos são necessários")

    control_ids = payload.get("control_ids") or []
    if not control_ids:
        suggestions = suggest_targets(pack, runtime.active_device, runtime.active_profile)
        control_ids = [cid for s in suggestions for cid in s.candidate_ids]
    profile = apply_preset_pack(pack, runtime.active_profile, list(control_ids), layer=layer)
    runtime.profiles.save(profile)
    runtime.load_profile(profile)
    return profile.to_dict()


def handle_undo_preset_pack(runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    pack_id = str(payload.get("pack_id", "")).strip()
    if not pack_id:
        raise ValueError("pack_id obrigatório")
    if not runtime.active_profile:
        raise RuntimeError("profile ativo necessário")
    profile = undo_preset_pack(pack_id, runtime.active_profile)
    runtime.profiles.save(profile)
    runtime.load_profile(profile)
    return profile.to_dict()


def handle_list_preset_packs(_runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    return {"packs": [pack.to_dict() for pack in list_builtin_preset_packs()]}
