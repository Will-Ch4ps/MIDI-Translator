"""Aplica/desfaz Preset Packs aditivamente num profile existente."""
from __future__ import annotations

from dataclasses import dataclass

from ..models import (
    Action,
    Control,
    ControlKind,
    Device,
    Mapping,
    PresetPack,
    PresetPackTarget,
    Profile,
    TriggerMode,
)


@dataclass
class TargetSuggestion:
    target: PresetPackTarget
    candidate_ids: list[str]


def suggest_targets(pack: PresetPack, device: Device, profile: Profile) -> list[TargetSuggestion]:
    """Sugere controles do device que melhor servem aos `suggested_targets` do pack.

    Prioriza controles sem mapping na layer 'default'; depois com qualquer
    mapping (alertando sobreposição).
    """
    free = _free_controls_by_kind(device, profile)
    used = _used_controls_by_kind(device, profile)
    suggestions: list[TargetSuggestion] = []

    for target in pack.suggested_targets:
        kinds = _kinds_for_role(target.role)
        pool: list[str] = []
        for kind in kinds:
            pool.extend(free.get(kind, []))
        if len(pool) < target.count:
            for kind in kinds:
                pool.extend(used.get(kind, []))
        candidate_ids = pool[: target.count]
        suggestions.append(TargetSuggestion(target=target, candidate_ids=candidate_ids))
    return suggestions


def apply_preset_pack(
    pack: PresetPack,
    profile: Profile,
    target_control_ids: list[str],
    layer: str = "default",
) -> Profile:
    """Adiciona mappings do pack ao profile, com tag <pack.id>."""
    tag = pack.id
    profile.mappings = [m for m in profile.mappings if tag not in m.tags]

    for declared in pack.mappings:
        if declared.role_index >= len(target_control_ids):
            continue
        control_id = target_control_ids[declared.role_index]
        try:
            trigger = TriggerMode(declared.trigger)
        except ValueError:
            trigger = TriggerMode.PRESS
        profile.mappings.append(Mapping(
            control_id=control_id,
            action=Action(id=declared.action_id, params=dict(declared.params)),
            trigger=trigger,
            label=declared.label,
            layer=layer,
            tags=[tag],
        ))

    for connection_id in pack.requires_connections:
        if connection_id not in profile.requires_connections:
            profile.requires_connections.append(connection_id)
    return profile


def undo_preset_pack(pack_id: str, profile: Profile) -> Profile:
    profile.mappings = [m for m in profile.mappings if pack_id not in m.tags]
    return profile


_ROLE_KINDS: dict[str, list[ControlKind]] = {
    "pads": [ControlKind.PAD],
    "knobs": [ControlKind.KNOB_ABS, ControlKind.KNOB_REL],
    "button": [ControlKind.BUTTON_TOGGLE, ControlKind.BUTTON_MOMENTARY, ControlKind.BUTTON_TRIGGER],
    "key": [ControlKind.KEY],
    "fader": [ControlKind.FADER],
    "any": list(ControlKind),
}


def _kinds_for_role(role: str) -> list[ControlKind]:
    return _ROLE_KINDS.get(role, _ROLE_KINDS["any"])


def _free_controls_by_kind(device: Device, profile: Profile) -> dict[ControlKind, list[str]]:
    used = {m.control_id for m in profile.mappings}
    out: dict[ControlKind, list[str]] = {}
    for control in device.controls:
        if control.id in used:
            continue
        out.setdefault(control.kind, []).append(control.id)
    return out


def _used_controls_by_kind(device: Device, profile: Profile) -> dict[ControlKind, list[str]]:
    out: dict[ControlKind, list[str]] = {}
    for control in device.controls:
        out.setdefault(control.kind, []).append(control.id)
    return out
