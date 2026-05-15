"""Posiciona controles inferidos numa grade inicial editável depois."""
from __future__ import annotations

from ...models import Control, ControlKind, Position


def auto_layout(controls: list[Control]) -> list[Control]:
    """Aplica posições x/y/w/h sensatas baseadas no ControlKind.

    Estratégia:
    - Pads em grade 4×N (parte superior central).
    - Knobs em fila horizontal (à direita dos pads).
    - Faders em fila horizontal (acima do teclado).
    - Botões em fila inferior.
    - Pitch/Sustain à esquerda.
    - Keys em sequência (parte inferior).
    """
    pads = [c for c in controls if c.kind == ControlKind.PAD]
    keys = [c for c in controls if c.kind == ControlKind.KEY]
    knobs = [c for c in controls if c.kind in (ControlKind.KNOB_ABS, ControlKind.KNOB_REL)]
    faders = [c for c in controls if c.kind == ControlKind.FADER]
    buttons = [c for c in controls if c.kind in (
        ControlKind.BUTTON_TOGGLE,
        ControlKind.BUTTON_MOMENTARY,
        ControlKind.BUTTON_TRIGGER,
    )]
    special = [c for c in controls if c.kind in (ControlKind.PITCH, ControlKind.SUSTAIN)]

    _grid(pads, origin_x=4, origin_y=0, columns=4, cell=1.2)
    _row(knobs, origin_x=10, origin_y=0, gap=1.4, w=1.2, h=1.2)
    _row(faders, origin_x=10, origin_y=2, gap=1.4, w=1.0, h=2.0)
    _row(buttons, origin_x=4, origin_y=4, gap=1.2, w=1.0, h=0.8)
    _row(special, origin_x=0, origin_y=0, gap=1.4, w=1.2, h=2.0)
    _keys(keys, origin_x=0, origin_y=6, w=0.45, h=2.0)
    return controls


def _grid(items: list[Control], origin_x: float, origin_y: float, columns: int, cell: float) -> None:
    for index, control in enumerate(items):
        row, col = divmod(index, columns)
        control.position = Position(x=origin_x + col * cell, y=origin_y + row * cell, w=cell - 0.1, h=cell - 0.1)


def _row(items: list[Control], origin_x: float, origin_y: float, gap: float, w: float, h: float) -> None:
    for index, control in enumerate(items):
        control.position = Position(x=origin_x + index * gap, y=origin_y, w=w, h=h)


def _keys(items: list[Control], origin_x: float, origin_y: float, w: float, h: float) -> None:
    items.sort(key=lambda c: int(c.params.get("note", 0) or 0))
    for index, control in enumerate(items):
        control.position = Position(x=origin_x + index * w, y=origin_y, w=w * 0.95, h=h)
