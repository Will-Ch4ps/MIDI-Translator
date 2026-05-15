"""Connector MIDI Out — abre porta de saída e envia note/CC."""
from __future__ import annotations

from typing import Any, Iterable

from core.midi.out import MidiOut, list_output_ports
from core.models import Action, ActionDef, MidiEvent, ParamField, ParamsSchema, Recipe

from ..manifest import ConnectionManifest, ConnectionStatus


class MidiOutConnector:
    manifest = ConnectionManifest(
        id="midi_out",
        name="MIDI Out",
        description="Envia mensagens MIDI pra DAW ou pra acender LEDs no próprio controlador.",
        icon="circuit-board",
        category="MIDI",
        requires_setup=True,
        keywords=["midi", "led", "out", "feedback", "daw", "reaper", "ableton"],
    )

    def __init__(self) -> None:
        self._out = MidiOut()
        self._port_name: str = ""

    def bind(self, _services: dict[str, Any]) -> None:
        return

    def open_port(self, port_name: str) -> None:
        self._port_name = port_name
        self._out.open(port_name)

    def close_port(self) -> None:
        self._port_name = ""
        self._out.close()

    def actions(self) -> Iterable[tuple[ActionDef, Any]]:
        out = self._out
        yield _send_note_def(), _make_send_note(out)
        yield _send_cc_def(), _make_send_cc(out)

    def recipes(self) -> Iterable[Recipe]:
        return []

    def status(self) -> ConnectionStatus:
        if not list_output_ports():
            return ConnectionStatus.MISSING
        if not self._out.is_open:
            return ConnectionStatus.INSTALLED
        return ConnectionStatus.READY


def _send_note_def() -> ActionDef:
    return ActionDef(
        id="midi_out.note.send",
        connector_id="midi_out",
        label="Enviar nota MIDI",
        description="Envia note_on (acende LED se o controlador suporta) e opcionalmente note_off.",
        icon="music",
        category="MIDI",
        capabilities=[],
        params_schema=ParamsSchema(fields=[
            ParamField(name="channel", type="int", label="Canal (1..16)", default=1, min=1, max=16),
            ParamField(name="note", type="int", label="Nota (0..127)", default=60, min=0, max=127, required=True),
            ParamField(name="velocity", type="int", label="Velocidade (0..127)", default=127, min=0, max=127),
            ParamField(name="auto_release", type="bool", label="Soltar ao release", default=True),
        ]),
        example="Acender pad ao mapeá-lo / mandar trigger pra DAW.",
    )


def _send_cc_def() -> ActionDef:
    return ActionDef(
        id="midi_out.cc.send",
        connector_id="midi_out",
        label="Enviar CC",
        description="Envia Control Change com valor fixo ou valor do knob.",
        icon="sliders",
        category="MIDI",
        capabilities=[],
        params_schema=ParamsSchema(fields=[
            ParamField(name="channel", type="int", label="Canal (1..16)", default=1, min=1, max=16),
            ParamField(name="cc", type="int", label="CC (0..127)", default=20, min=0, max=127, required=True),
            ParamField(name="value", type="int", label="Valor fixo (-1 usa valor do knob)", default=-1, min=-1, max=127),
        ]),
        continuous=True,
    )


def _make_send_note(out: MidiOut):
    def handler(action: Action, event: MidiEvent) -> None:
        if not out.is_open:
            return
        channel = int(action.params.get("channel", 1)) - 1
        note = int(action.params.get("note", 60))
        velocity = int(action.params.get("velocity", 127))
        auto_release = bool(action.params.get("auto_release", True))
        if event.pressed:
            out.send_note(channel, note, velocity)
        elif auto_release:
            out.send_note(channel, note, 0)
    return handler


def _make_send_cc(out: MidiOut):
    def handler(action: Action, event: MidiEvent) -> None:
        if not out.is_open:
            return
        channel = int(action.params.get("channel", 1)) - 1
        cc = int(action.params.get("cc", 20))
        fixed = int(action.params.get("value", -1))
        if fixed >= 0:
            if event.pressed:
                out.send_cc(channel, cc, fixed)
            return
        if event.is_continuous:
            out.send_cc(channel, cc, int(event.value))
    return handler
