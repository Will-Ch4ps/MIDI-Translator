"""Connector shell — launch, run_command, run_script."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import ActionDef, Action, MidiEvent, ParamField, ParamsSchema, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus


class ShellConnector:
    manifest = ConnectionManifest(
        id="shell",
        name="Aplicativos & Scripts",
        description="Abrir programas, atalhos, comandos no terminal e scripts (.py/.ps1/.sh).",
        icon="terminal",
        category="Sistema",
        keywords=["app", "abrir", "script", "comando", "terminal", "lançar"],
    )

    def __init__(self) -> None:
        self._shell: Any = None

    def bind(self, services: dict[str, Any]) -> None:
        self._shell = services.get("shell")

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        shell = self._shell
        yield _launch_def(), _make_launch(shell)
        yield _command_def(), _make_command(shell)
        yield _script_def(), _make_script(shell)

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        return ConnectionStatus.READY if self._shell and self._shell.available else ConnectionStatus.OFFLINE


def _launch_def() -> ActionDef:
    return ActionDef(
        id="shell.app.launch",
        connector_id="shell",
        label="Abrir aplicativo",
        description="Abre um app, URL, atalho (.lnk), ou shell URI (shell:Apps, ms-settings:).",
        icon="external-link",
        category="Aplicativos",
        capabilities=["shell.launch"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="path", type="path", label="Caminho ou URI", required=True,
                       description="Ex.: notepad, C:/Tools/x.exe, shell:AppsFolder\\..., https://...")
        ]),
        example="Spotify, OBS, Chrome, Photoshop.",
    )


def _command_def() -> ActionDef:
    return ActionDef(
        id="shell.command.run",
        connector_id="shell",
        label="Executar comando",
        description="Roda um comando direto no shell padrão.",
        icon="square-terminal",
        category="Sistema",
        capabilities=["shell.command"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="command", type="string", label="Comando", required=True),
        ]),
        example="echo oi, taskkill /IM notepad.exe, systemctl restart foo",
    )


def _script_def() -> ActionDef:
    return ActionDef(
        id="shell.script.run",
        connector_id="shell",
        label="Executar script",
        description="Roda um arquivo .py/.ps1/.bat/.cmd/.vbs/.sh.",
        icon="file-code",
        category="Sistema",
        capabilities=["shell.script"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="path", type="path", label="Caminho", required=True),
            ParamField(name="args", type="string", label="Argumentos", default=""),
        ]),
    )


def _make_launch(shell):
    def handler(action: Action, event: MidiEvent) -> None:
        if not shell or not event.pressed:
            return
        shell.launch(str(action.params.get("path", "")))
    return handler


def _make_command(shell):
    def handler(action: Action, event: MidiEvent) -> None:
        if not shell or not event.pressed:
            return
        shell.run_command(str(action.params.get("command", "")))
    return handler


def _make_script(shell):
    def handler(action: Action, event: MidiEvent) -> None:
        if not shell or not event.pressed:
            return
        shell.run_script(str(action.params.get("path", "")), str(action.params.get("args", "")))
    return handler
