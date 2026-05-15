"""Ações de volume (step up/down, set, mute)."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema


def build(services: dict[str, Any]) -> Iterable[tuple[ActionDef, Any]]:
    volume = services.get("volume")
    yield _step_def("up", "+", "volume-2"), _make_step(volume, +1)
    yield _step_def("down", "-", "volume"), _make_step(volume, -1)
    yield _set_def(), _make_set(volume)
    yield _mute_def(), _make_mute(volume)


def _target_field() -> ParamField:
    return ParamField(
        name="target", type="audio_target", label="Alvo", default="master",
        description="'master' ou nome do processo (ex: spotify, discord, chrome).",
    )


def _step_def(direction: str, sign_label: str, icon: str) -> ActionDef:
    return ActionDef(
        id=f"audio.volume.step_{direction}",
        connector_id="audio",
        label=f"Volume {sign_label}",
        description=f"{'Aumenta' if direction == 'up' else 'Diminui'} o volume do alvo.",
        icon=icon,
        category="Áudio",
        capabilities=["audio.master"],
        params_schema=ParamsSchema(fields=[
            _target_field(),
            ParamField(name="step", type="float", label="Passo (0..1)", default=0.04, min=0.005, max=0.5),
            ParamField(name="use_knob_direction", type="bool", label="Seguir direção do knob", default=False),
        ]),
        continuous=direction == "up",
    )


def _set_def() -> ActionDef:
    return ActionDef(
        id="audio.volume.set",
        connector_id="audio",
        label="Volume = valor do knob",
        description="Define o volume do alvo proporcional ao valor do knob/fader (0..127 → 0..1).",
        icon="sliders-horizontal",
        category="Áudio",
        capabilities=["audio.master"],
        params_schema=ParamsSchema(fields=[_target_field()]),
        continuous=True,
    )


def _mute_def() -> ActionDef:
    return ActionDef(
        id="audio.volume.mute_toggle",
        connector_id="audio",
        label="Mute / unmute",
        description="Alterna mute do alvo.",
        icon="volume-x",
        category="Áudio",
        capabilities=["audio.mute"],
        params_schema=ParamsSchema(fields=[_target_field()]),
    )


def _make_step(volume, sign: int):
    last_values: dict[str, int] = {}

    def handler(action: Action, event: MidiEvent) -> None:
        if not volume:
            return
        step = float(action.params.get("step", 0.04) or 0.04)
        target = str(action.params.get("target", "master"))
        if action.params.get("use_knob_direction") and event.is_continuous:
            key = event.signature.key()
            previous = last_values.get(key)
            current = int(event.value)
            last_values[key] = current
            if previous is None or previous == current:
                return
            volume.step(step * (1 if current > previous else -1), target)
            return
        if event.pressed:
            volume.step(step * sign, target)
    return handler


def _make_set(volume):
    def handler(action: Action, event: MidiEvent) -> None:
        if not volume or not event.is_continuous:
            return
        volume.set_target(_to_unit(event.value), str(action.params.get("target", "master")))
    return handler


def _make_mute(volume):
    def handler(action: Action, event: MidiEvent) -> None:
        if not volume or not event.pressed:
            return
        volume.mute_toggle()
    return handler


def _to_unit(value: int) -> float:
    if value < 0:
        return max(0.0, min(1.0, (value + 8192.0) / 16383.0))
    return max(0.0, min(1.0, value / 127.0))
