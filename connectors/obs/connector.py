"""Connector OBS Studio (via WebSocket v5)."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema, Recipe, RecipeStep

from ..manifest import ConnectionManifest, ConnectionStatus
from .client import ObsClient


class ObsConnector:
    manifest = ConnectionManifest(
        id="obs",
        name="OBS Studio",
        description="Trocar cenas, mute mic, replay buffer, start/stop streaming e recording.",
        icon="video",
        category="Streaming",
        requires_setup=True,
        docs_url="https://docs.obsproject.com/",
        keywords=["obs", "stream", "twitch", "cena", "scene", "live"],
    )

    def __init__(self) -> None:
        self._client = ObsClient()

    def bind(self, _services: dict[str, Any]) -> None:
        return

    def connect(self, host: str = "127.0.0.1", port: int = 4455, password: str = "") -> bool:
        return self._client.connect(host, port, password)

    def disconnect(self) -> None:
        self._client.disconnect()

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        client = self._client
        yield _scene_def(), _make_scene(client)
        yield _mute_def(), _make_mute(client)
        yield _stream_toggle_def("start"), _make_simple(client, "start_streaming")
        yield _stream_toggle_def("stop"), _make_simple(client, "stop_streaming")
        yield _record_toggle_def("start"), _make_simple(client, "start_recording")
        yield _record_toggle_def("stop"), _make_simple(client, "stop_recording")
        yield _replay_def(), _make_simple(client, "trigger_replay_buffer")

    def recipes(self) -> Iterable[Recipe]:
        yield Recipe(
            id="obs.start_live",
            name="Iniciar live no OBS",
            description="Troca pra cena 'Intro', começa a transmissão e silencia notificações.",
            icon="play",
            steps=[
                RecipeStep("action", {"id": "obs.scene.set", "params": {"scene": "Intro"}}),
                RecipeStep("delay", {"ms": 2000}),
                RecipeStep("action", {"id": "obs.stream.start"}),
            ],
        )

    def status(self) -> ConnectionStatus:
        if not self._client.available:
            return ConnectionStatus.MISSING
        if not self._client.connected:
            return ConnectionStatus.INSTALLED
        return ConnectionStatus.READY


def _scene_def() -> ActionDef:
    return ActionDef(
        id="obs.scene.set",
        connector_id="obs",
        label="Trocar cena",
        description="Muda pra cena indicada (pelo nome exato).",
        icon="image",
        category="Streaming",
        capabilities=[],
        params_schema=ParamsSchema(fields=[
            ParamField(name="scene", type="string", label="Nome da cena", required=True),
        ]),
    )


def _mute_def() -> ActionDef:
    return ActionDef(
        id="obs.input.toggle_mute",
        connector_id="obs",
        label="Mute / unmute (OBS)",
        description="Alterna mute de um input do OBS (Mic, Desktop Audio, etc).",
        icon="mic-off",
        category="Streaming",
        capabilities=[],
        params_schema=ParamsSchema(fields=[
            ParamField(name="input_name", type="string", label="Nome do input", required=True,
                       default="Mic/Aux"),
        ]),
    )


def _stream_toggle_def(direction: str) -> ActionDef:
    return ActionDef(
        id=f"obs.stream.{direction}",
        connector_id="obs",
        label=f"{'Iniciar' if direction == 'start' else 'Parar'} transmissão",
        icon="radio-tower" if direction == "start" else "square",
        category="Streaming",
        capabilities=[],
    )


def _record_toggle_def(direction: str) -> ActionDef:
    return ActionDef(
        id=f"obs.record.{direction}",
        connector_id="obs",
        label=f"{'Iniciar' if direction == 'start' else 'Parar'} gravação",
        icon="circle-dot" if direction == "start" else "square",
        category="Streaming",
        capabilities=[],
    )


def _replay_def() -> ActionDef:
    return ActionDef(
        id="obs.replay_buffer.save",
        connector_id="obs",
        label="Salvar replay buffer",
        description="Salva o último trecho do replay buffer no disco.",
        icon="save",
        category="Streaming",
        capabilities=[],
    )


def _make_scene(client: ObsClient):
    def handler(action: Action, event: MidiEvent) -> None:
        if not event.pressed:
            return
        scene = str(action.params.get("scene", ""))
        if scene:
            client.set_scene(scene)
    return handler


def _make_mute(client: ObsClient):
    def handler(action: Action, event: MidiEvent) -> None:
        if not event.pressed:
            return
        name = str(action.params.get("input_name", ""))
        if name:
            client.toggle_mute(name)
    return handler


def _make_simple(client: ObsClient, method: str):
    def handler(_action: Action, event: MidiEvent) -> None:
        if not event.pressed:
            return
        getattr(client, method, lambda: None)()
    return handler
