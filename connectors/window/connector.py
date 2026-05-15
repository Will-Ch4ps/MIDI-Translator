"""Connector window — snap, foco, virtual desktops, alt+tab."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus


class WindowConnector:
    manifest = ConnectionManifest(
        id="window",
        name="Janelas",
        description="Encaixar (snap), foco, alt+tab e virtual desktops.",
        icon="layout-grid",
        category="Sistema",
        keywords=["janela", "snap", "desktop", "foco", "alt tab"],
    )

    def __init__(self) -> None:
        self._win: Any = None

    def bind(self, services: dict[str, Any]) -> None:
        self._win = services.get("window")

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        win = self._win
        yield _snap_def("left", "Snap esquerda", "arrow-left-square"), _direction(win, "snap_left")
        yield _snap_def("right", "Snap direita", "arrow-right-square"), _direction(win, "snap_right")
        yield _snap_def("up", "Snap topo", "arrow-up-square"), _direction(win, "snap_up")
        yield _snap_def("down", "Snap baixo", "arrow-down-square"), _direction(win, "snap_down")
        yield _generic_def("window.minimize_all", "Mostrar área de trabalho", "monitor", ["window.minimize_all"]), _direction(win, "minimize_all")
        yield _generic_def("window.alt_tab", "Alt+Tab", "between-horizonal-end", ["window.focus"]), _direction(win, "alt_tab")
        yield _generic_def("window.desktop.next", "Próximo desktop", "arrow-right", ["window.virtual_desktop"]), _direction(win, "desktop_next")
        yield _generic_def("window.desktop.prev", "Desktop anterior", "arrow-left", ["window.virtual_desktop"]), _direction(win, "desktop_prev")

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        return ConnectionStatus.READY if self._win and self._win.available else ConnectionStatus.OFFLINE


def _snap_def(direction: str, label: str, icon: str) -> ActionDef:
    return ActionDef(
        id=f"window.snap.{direction}",
        connector_id="window",
        label=label,
        description=f"Encaixa a janela ativa à {direction}.",
        icon=icon,
        category="Janelas",
        capabilities=["window.snap"],
    )


def _generic_def(action_id: str, label: str, icon: str, caps: list[str]) -> ActionDef:
    return ActionDef(
        id=action_id,
        connector_id="window",
        label=label,
        icon=icon,
        category="Janelas",
        capabilities=caps,
    )


def _direction(win, method: str):
    def handler(_action: Action, event: MidiEvent) -> None:
        if not win or not event.pressed:
            return
        getattr(win, method, lambda: None)()
    return handler
