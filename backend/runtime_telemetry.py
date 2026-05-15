"""Realtime telemetry stream emitted by the Python listener service."""
from __future__ import annotations

import json
import threading
import time
from typing import Any

from core.midi.events import MidiEvent, MidiKind


class RuntimeTelemetry:
    def __init__(self, bus, layout) -> None:
        self._bus = bus
        self._layout = layout
        self._lock = threading.Lock()

        self._pad_bank = "A"
        self._octave = 0
        self._transpose = 0
        self._full_level = False
        self._sustain_active = False

        # signature completa -> control_id para teclas virtuais KEY_NOTE_*
        #
        # Antes era note -> control_id, ignorando canal.
        # Isso fazia um PAD em note:9:49 ativar KEY_NOTE_49, que é C#.
        self._key_signature_to_id: dict[str, str] = {}

        # signature completa -> control_id roteado preferencial
        self._signature_to_id: dict[str, str] = {}

        self._build_indexes(layout.controls)

    def _build_indexes(self, controls) -> None:
        for control in controls:
            signature = getattr(control, "signature", None)

            if signature:
                self._signature_to_id[str(signature)] = control.id

            if str(control.id).startswith("KEY_NOTE_") and signature:
                self._key_signature_to_id[str(signature)] = control.id

    def attach(self) -> None:
        self._bus.on("midi.connected", self._on_connected)
        self._bus.on("midi.disconnected", self._on_disconnected)
        self._bus.on("midi.error", self._on_error)
        self._bus.on("midi.event", self._on_midi_event)
        self._bus.on("router.control_active", self._on_control_active)

    # ─── Emissão ──────────────────────────────────────────────────────────

    def _emit(self, payload: dict[str, Any]) -> None:
        print(json.dumps(payload, ensure_ascii=False), flush=True)

    def _shift(self) -> int:
        return self._octave * 12 + self._transpose

    def _emit_state(self) -> None:
        self._emit({
            "type": "state",
            "pad_bank": self._pad_bank,
            "octave": self._octave,
            "transpose": self._transpose,
            "shift": self._shift(),
            "full_level": self._full_level,
            "sustain_active": self._sustain_active,
            "timestamp_ms": int(time.time() * 1000),
        })

    # ─── Conexão ──────────────────────────────────────────────────────────

    def _on_connected(self, port_name: str) -> None:
        self._emit({"type": "status", "status": "connected", "port": port_name})
        self._emit_state()

    def _on_disconnected(self, port_name: str) -> None:
        self._emit({"type": "status", "status": "disconnected", "port": port_name})

    def _on_error(self, message: str) -> None:
        self._emit({"type": "status", "status": "error", "message": message})

    # ─── Controle ativo roteado ───────────────────────────────────────────

    def _on_control_active(self, payload: tuple[str, MidiEvent]) -> None:
        control_id, event = payload

        with self._lock:
            if control_id == "SUSTAIN":
                self._sustain_active = bool(event.pressed)

            self._emit({
                "type": "control",
                "control_id": control_id,
                "value": int(event.value),
                "pressed": bool(event.pressed),
                "raw_type": event.raw_type,
                "signature": event.signature.key(),
                "kind": event.signature.kind.value,
                "channel": int(event.signature.channel),
                "code": int(event.signature.code),
                "timestamp_ms": int(time.time() * 1000),
            })

            self._emit_state()

    # ─── Evento MIDI bruto ────────────────────────────────────────────────

    def _on_midi_event(self, event: MidiEvent) -> None:
        key_id = ""

        if event.signature.kind == MidiKind.NOTE:
            # Importante:
            # Tecla agora só é identificada por assinatura completa.
            #
            # Correto:
            #   teclado C#3  -> note:0:49 -> KEY_NOTE_49
            #   pad B6       -> note:9:49 -> PAD_B6
            #
            # Antes:
            #   qualquer note 49 virava KEY_NOTE_49, mesmo em outro canal.
            key_id = self._key_signature_to_id.get(event.signature.key(), "")

        self._emit({
            "type": "midi",
            "kind": event.signature.kind.value,
            "channel": int(event.signature.channel),
            "code": int(event.signature.code),
            "value": int(event.value),
            "pressed": bool(event.pressed),
            "raw_type": event.raw_type,
            "signature": event.signature.key(),
            "key_id": key_id,
            "octave": self._octave,
            "transpose": self._transpose,
            "shift": self._shift(),
            "timestamp_ms": int(time.time() * 1000),
        })

    # ─── API pública ──────────────────────────────────────────────────────

    def update_modifiers(
        self,
        *,
        octave: int | None = None,
        transpose: int | None = None,
        pad_bank: str | None = None,
        full_level: bool | None = None,
    ) -> None:
        with self._lock:
            if octave is not None:
                self._octave = max(-4, min(4, octave))
            if transpose is not None:
                self._transpose = max(-12, min(12, transpose))
            if pad_bank is not None:
                self._pad_bank = pad_bank
            if full_level is not None:
                self._full_level = full_level

        self._emit_state()
