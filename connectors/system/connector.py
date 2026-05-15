"""Connector system — operações no SO inteiro."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus


class SystemConnector:
    manifest = ConnectionManifest(
        id="system",
        name="Sistema",
        description="Trancar a sessão, notificações, suspender, brilho e screenshot.",
        icon="settings",
        category="Sistema",
        keywords=["lock", "notify", "sleep", "brilho", "screenshot", "sistema"],
    )

    def __init__(self) -> None:
        self._sys: Any = None

    def bind(self, services: dict[str, Any]) -> None:
        self._sys = services.get("system")

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        sys_svc = self._sys
        yield _def("system.lock", "Trancar sessão", "lock", ["system.lock"]), _wrap(sys_svc, "lock")
        yield _def("system.sleep", "Suspender", "moon", []), _wrap(sys_svc, "sleep")
        yield _notify_def(), _notify_handler(sys_svc)
        yield _def("system.screenshot", "Screenshot", "camera", ["system.screenshot"]), _wrap(sys_svc, "screenshot")
        yield _brightness_def(), _brightness_handler(sys_svc)

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        return ConnectionStatus.READY if self._sys and self._sys.available else ConnectionStatus.OFFLINE


def _def(action_id: str, label: str, icon: str, capabilities: list[str]) -> ActionDef:
    return ActionDef(
        id=action_id,
        connector_id="system",
        label=label,
        icon=icon,
        category="Sistema",
        capabilities=capabilities,
    )


def _notify_def() -> ActionDef:
    return ActionDef(
        id="system.notify",
        connector_id="system",
        label="Notificação",
        icon="bell",
        category="Sistema",
        capabilities=["system.notify"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="title", type="string", label="Título", required=True),
            ParamField(name="message", type="string", label="Mensagem", default=""),
        ]),
    )


def _brightness_def() -> ActionDef:
    return ActionDef(
        id="system.brightness.set",
        connector_id="system",
        label="Brilho do monitor",
        icon="sun",
        category="Sistema",
        capabilities=["system.brightness"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="percent", type="int", label="Porcentagem", default=50, min=0, max=100),
        ]),
    )


def _wrap(svc, method: str):
    def handler(_action: Action, event: MidiEvent) -> None:
        if not svc or not event.pressed:
            return
        getattr(svc, method, lambda *a, **k: None)()
    return handler


def _notify_handler(svc):
    def handler(action: Action, event: MidiEvent) -> None:
        if not svc or not event.pressed:
            return
        svc.notify(str(action.params.get("title", "")), str(action.params.get("message", "")))
    return handler


def _brightness_handler(svc):
    def handler(action: Action, event: MidiEvent) -> None:
        if not svc or not event.pressed:
            return
        method = getattr(svc, "set_brightness", None)
        if method:
            method(int(action.params.get("percent", 50)))
    return handler
