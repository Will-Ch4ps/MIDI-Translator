"""Remap inteligente: profile do device A → controles do device B."""
from __future__ import annotations

from dataclasses import dataclass

from ..models import Control, Device, Mapping, Profile


@dataclass
class RemapResult:
    profile: Profile
    matched: list[str]    # control_ids resolvidos no destino
    unmatched: list[str]  # mappings que não casaram


def remap_profile_for_device(profile: Profile, target_device: Device) -> RemapResult:
    """Tenta casar mappings do profile com os controles do target_device.

    Estratégia (prioridade decrescente):
    1. control_id exato (caso devices idênticos).
    2. mesma `kind` + mesmo `group` + mesma posição (x,y arredondado).
    3. mesma `kind` + mesmo `group` + ordem de aparição (primeiro pad com primeiro pad).
    4. mesma `kind` + ordem de aparição.
    """
    by_id: dict[str, Control] = {c.id: c for c in target_device.controls}
    by_kind_group: dict[tuple[str, str], list[Control]] = {}
    by_kind: dict[str, list[Control]] = {}
    for control in target_device.controls:
        by_kind_group.setdefault((control.kind.value, control.group), []).append(control)
        by_kind.setdefault(control.kind.value, []).append(control)

    new_mappings: list[Mapping] = []
    matched: list[str] = []
    unmatched: list[str] = []
    used_kind_group: dict[tuple[str, str], int] = {}
    used_kind: dict[str, int] = {}

    for mapping in profile.mappings:
        target = by_id.get(mapping.control_id)
        if target:
            new_mappings.append(_with_control(mapping, target.id))
            matched.append(target.id)
            continue

        candidate = _find_by_kind_group(
            mapping, by_kind_group, by_kind, used_kind_group, used_kind
        )
        if candidate:
            new_mappings.append(_with_control(mapping, candidate.id))
            matched.append(candidate.id)
        else:
            unmatched.append(mapping.control_id)

    remapped = Profile(
        name=profile.name,
        device_id=target_device.id,
        layers=list(profile.layers),
        mappings=new_mappings,
        active_layer=profile.active_layer,
        requires_connections=list(profile.requires_connections),
    )
    return RemapResult(profile=remapped, matched=matched, unmatched=unmatched)


def _find_by_kind_group(
    mapping: Mapping,
    by_kind_group: dict[tuple[str, str], list[Control]],
    by_kind: dict[str, list[Control]],
    used_kind_group: dict[tuple[str, str], int],
    used_kind: dict[str, int],
) -> Control | None:
    return None  # placeholder: requer source device pra ler `kind`/`group` originais


def _with_control(mapping: Mapping, control_id: str) -> Mapping:
    return Mapping(
        control_id=control_id,
        action=mapping.action,
        trigger=mapping.trigger,
        label=mapping.label,
        layer=mapping.layer,
        condition=mapping.condition,
        tags=list(mapping.tags),
    )
