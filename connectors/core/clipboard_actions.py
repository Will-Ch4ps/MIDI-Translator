"""Ações de clipboard."""
from __future__ import annotations

from typing import Any, Iterable

from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema


def build(services: dict[str, Any]) -> Iterable[tuple[ActionDef, Any]]:
    clipboard = services.get("clipboard")
    yield _write_def(), _make_write(clipboard)


def _write_def() -> ActionDef:
    return ActionDef(
        id="core.clipboard.write",
        connector_id="core",
        label="Copiar texto pro clipboard",
        description="Define o conteúdo do clipboard pra um texto fixo.",
        icon="clipboard-paste",
        category="Clipboard",
        capabilities=["clipboard.write"],
        params_schema=ParamsSchema(fields=[
            ParamField(name="text", type="string", label="Texto", required=True),
        ]),
    )


def _make_write(clipboard):
    def handler(action: Action, event: MidiEvent) -> None:
        if not clipboard or not event.pressed:
            return
        clipboard.write(str(action.params.get("text", "")))
    return handler
