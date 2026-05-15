"""Connector Spotify — controla via global media keys + audio per-app.

Web API exigiria login OAuth (Phase 3). MVP: usa teclas de mídia, que
chegam ao Spotify quando está em foreground ou aceita global hotkeys.
"""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus


class SpotifyConnector:
    manifest = ConnectionManifest(
        id="spotify",
        name="Spotify",
        description="Play/pause, próxima, anterior e volume Spotify (via tecla de mídia + audio.per_app).",
        icon="music",
        category="Música",
        keywords=["spotify", "música", "player"],
    )

    def __init__(self) -> None:
        self._keyboard: Any = None
        self._volume: Any = None

    def bind(self, services: dict[str, Any]) -> None:
        self._keyboard = services.get("keyboard")
        self._volume = services.get("volume")

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        kb = self._keyboard
        vol = self._volume
        yield _def("spotify.toggle", "Play / Pause", "play", "play/pause media"), _make_media(kb, "play/pause media")
        yield _def("spotify.next", "Próxima", "skip-forward", "next track"), _make_media(kb, "next track")
        yield _def("spotify.previous", "Anterior", "skip-back", "previous track"), _make_media(kb, "previous track")
        yield _volume_def(), _make_volume(vol)

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        return ConnectionStatus.READY if self._keyboard and getattr(self._keyboard, "available", False) else ConnectionStatus.OFFLINE


def _def(action_id: str, label: str, icon: str, _hint: str) -> ActionDef:
    return ActionDef(
        id=action_id,
        connector_id="spotify",
        label=label,
        icon=icon,
        category="Música",
        capabilities=["keyboard.combo"],
    )


def _volume_def() -> ActionDef:
    return ActionDef(
        id="spotify.volume",
        connector_id="spotify",
        label="Volume Spotify (knob)",
        description="Define o volume da sessão Spotify proporcional ao knob.",
        icon="volume-2",
        category="Música",
        capabilities=["audio.per_app"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="target", type="string", label="Processo", default="spotify"),
        ]),
        continuous=True,
    )


def _make_media(keyboard, combo: str):
    def handler(_action: Action, event: MidiEvent) -> None:
        if not keyboard or not event.pressed:
            return
        keyboard.press_combo(combo)
    return handler


def _make_volume(volume):
    def handler(action: Action, event: MidiEvent) -> None:
        if not volume or not event.is_continuous:
            return
        target = str(action.params.get("target", "spotify"))
        scalar = max(0.0, min(1.0, event.value / 127.0))
        volume.set_target(scalar, target)
    return handler
