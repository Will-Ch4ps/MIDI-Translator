"""Ações de mouse (click, move, scroll)."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema


def build(services: dict[str, Any]) -> Iterable[tuple[ActionDef, Any]]:
    mouse = services.get("mouse")
    yield _click_def(), _make_click(mouse)
    yield _move_def(), _make_move(mouse)
    yield _scroll_def(), _make_scroll(mouse)


def _click_def() -> ActionDef:
    return ActionDef(
        id="core.mouse.click",
        connector_id="core",
        label="Clique do mouse",
        description="Dispara um clique do mouse.",
        icon="mouse-pointer-click",
        category="Mouse",
        capabilities=["mouse.click"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="button", type="choice", label="Botão", default="left",
                       choices=["left", "right", "middle"]),
            ParamField(name="double", type="bool", label="Duplo clique", default=False),
        ]),
    )


def _move_def() -> ActionDef:
    return ActionDef(
        id="core.mouse.move",
        connector_id="core",
        label="Mover mouse",
        description="Move o cursor por (dx, dy) relativos ou absolutos.",
        icon="move",
        category="Mouse",
        capabilities=["mouse.move"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="dx", type="int", label="dx", default=0),
            ParamField(name="dy", type="int", label="dy", default=0),
            ParamField(name="absolute", type="bool", label="Coordenadas absolutas", default=False),
        ]),
    )


def _scroll_def() -> ActionDef:
    return ActionDef(
        id="core.mouse.scroll",
        connector_id="core",
        label="Scroll do mouse",
        description="Rolar verticalmente ou horizontalmente.",
        icon="mouse",
        category="Mouse",
        capabilities=["mouse.scroll"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="delta", type="int", label="Delta (notches)", default=1),
            ParamField(name="horizontal", type="bool", label="Horizontal", default=False),
        ]),
        continuous=True,
    )


def _make_click(mouse):
    def handler(action: Action, event: MidiEvent) -> None:
        if not mouse or not event.pressed:
            return
        button = str(action.params.get("button", "left"))
        if action.params.get("double"):
            mouse.double_click(button)
        else:
            mouse.click(button)
    return handler


def _make_move(mouse):
    def handler(action: Action, event: MidiEvent) -> None:
        if not mouse or not event.pressed:
            return
        dx = int(action.params.get("dx", 0))
        dy = int(action.params.get("dy", 0))
        if action.params.get("absolute"):
            mouse.move_to(dx, dy)
        else:
            mouse.move(dx, dy)
    return handler


def _make_scroll(mouse):
    def handler(action: Action, event: MidiEvent) -> None:
        if not mouse:
            return
        delta = int(action.params.get("delta", 1))
        horizontal = bool(action.params.get("horizontal", False))
        if event.is_continuous:
            mouse.scroll(delta if event.value > 64 else -delta, horizontal)
        elif event.pressed:
            mouse.scroll(delta, horizontal)
    return handler
