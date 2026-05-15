"""Ações de teclado (combo, type_text, macro)."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema


def build(services: dict[str, Any]) -> Iterable[tuple[ActionDef, Any]]:
    keyboard = services.get("keyboard")
    yield _combo_def(), _make_combo(keyboard)
    yield _type_def(), _make_type(keyboard)
    yield _macro_def(), _make_macro(keyboard)


def _combo_def() -> ActionDef:
    return ActionDef(
        id="core.key.combo",
        connector_id="core",
        label="Atalho de teclado",
        description="Dispara uma combinação de teclas (ex: Ctrl+S, Ctrl+Shift+Tab).",
        icon="keyboard",
        category="Teclado",
        capabilities=["keyboard.combo"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="combo", type="key_combo", label="Combo", required=True,
                       description="Use '+' pra combinar teclas. Ex: ctrl+shift+s"),
            ParamField(name="mode", type="choice", label="Modo", default="tap",
                       choices=["tap", "hold"],
                       description="tap = apertar e soltar; hold = segura enquanto o control físico estiver pressionado"),
        ]),
        example="ctrl+c, ctrl+v, alt+tab, windows+shift+s",
    )


def _type_def() -> ActionDef:
    return ActionDef(
        id="core.text.type",
        connector_id="core",
        label="Digitar texto",
        description="Digita uma string literal.",
        icon="type",
        category="Teclado",
        capabilities=["keyboard.type"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="text", type="string", label="Texto", required=True),
            ParamField(name="delay_ms", type="int", label="Delay entre teclas (ms)", default=0, min=0, max=500),
        ]),
        example="Saudação rápida, e-mail padrão, prompt de IA.",
    )


def _macro_def() -> ActionDef:
    return ActionDef(
        id="core.macro.play",
        connector_id="core",
        label="Tocar macro",
        description="Executa uma sequência de steps (teclas, texto, delays).",
        icon="list-ordered",
        category="Teclado",
        capabilities=["keyboard.macro"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="steps", type="macro_steps", label="Steps", default=[]),
        ]),
        example="abrir editor → digitar título → salvar (Ctrl+S).",
    )


def _make_combo(keyboard):
    def handler(action: Action, event: MidiEvent) -> None:
        if not keyboard:
            return
        combo = str(action.params.get("combo", "")).strip()
        mode = str(action.params.get("mode", "tap")).lower()
        if not combo:
            return
        if mode == "hold":
            (keyboard.hold if event.pressed else keyboard.release)(combo)
        elif event.pressed:
            keyboard.press_combo(combo)
    return handler


def _make_type(keyboard):
    def handler(action: Action, event: MidiEvent) -> None:
        if not keyboard or not event.pressed:
            return
        keyboard.type_text(str(action.params.get("text", "")), int(action.params.get("delay_ms", 0) or 0))
    return handler


def _make_macro(keyboard):
    def handler(action: Action, event: MidiEvent) -> None:
        if not keyboard or not event.pressed:
            return
        keyboard.play_macro(list(action.params.get("steps") or []))
    return handler
