"""Connector Discord — PTT global, mute server, deafen via hotkeys.

Não usa API privada do Discord. As actions emitem combos que o usuário
configura como global hotkey nas preferências do Discord. Bonus:
push-to-talk fica natural com trigger 'hold'.
"""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus


class DiscordConnector:
    manifest = ConnectionManifest(
        id="discord",
        name="Discord",
        description="Push-to-talk global, mute server, deafen via hotkeys configurados no Discord.",
        icon="mic",
        category="Comunicação",
        requires_setup=True,
        keywords=["discord", "voice", "ptt", "mute"],
        docs_url="https://support.discord.com/hc/articles/214840138",
    )

    def __init__(self) -> None:
        self._keyboard: Any = None

    def bind(self, services: dict[str, Any]) -> None:
        self._keyboard = services.get("keyboard")

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        kb = self._keyboard
        yield _ptt_def(), _make_hold(kb)
        yield _mute_def(), _make_combo(kb)
        yield _deafen_def(), _make_combo(kb)

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        return ConnectionStatus.READY if self._keyboard and getattr(self._keyboard, "available", False) else ConnectionStatus.OFFLINE


def _ptt_def() -> ActionDef:
    return ActionDef(
        id="discord.ptt",
        connector_id="discord",
        label="Push-to-talk",
        description="Hold pra falar. Configure o mesmo combo nas preferências de voz do Discord.",
        icon="mic",
        category="Comunicação",
        capabilities=["keyboard.hold"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="combo", type="key_combo", label="Combo", default="f13", required=True,
                       description="Tecla configurada como PTT no Discord. F13–F24 são boas porque não conflitam."),
        ]),
    )


def _mute_def() -> ActionDef:
    return ActionDef(
        id="discord.mute",
        connector_id="discord",
        label="Mute Discord",
        icon="mic-off",
        category="Comunicação",
        capabilities=["keyboard.combo"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="combo", type="key_combo", label="Combo", default="ctrl+shift+m"),
        ]),
    )


def _deafen_def() -> ActionDef:
    return ActionDef(
        id="discord.deafen",
        connector_id="discord",
        label="Deafen",
        icon="volume-x",
        category="Comunicação",
        capabilities=["keyboard.combo"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="combo", type="key_combo", label="Combo", default="ctrl+shift+d"),
        ]),
    )


def _make_hold(keyboard):
    def handler(action: Action, event: MidiEvent) -> None:
        if not keyboard:
            return
        combo = str(action.params.get("combo", "f13"))
        if not combo:
            return
        if event.pressed:
            keyboard.hold(combo)
        else:
            keyboard.release(combo)
    return handler


def _make_combo(keyboard):
    def handler(action: Action, event: MidiEvent) -> None:
        if not keyboard or not event.pressed:
            return
        combo = str(action.params.get("combo", ""))
        if combo:
            keyboard.press_combo(combo)
    return handler
