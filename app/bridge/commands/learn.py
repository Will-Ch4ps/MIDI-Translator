"""Commands do Learn Wizard — captura controles MIDI ao vivo."""
from __future__ import annotations

from typing import Any, Callable

from app.runtime import Runtime
from core.device.learn import LearnOrchestrator
from core.models import ControlKind, MidiEvent


_orchestrator: LearnOrchestrator | None = None
_unsubscribe: Callable[[], None] | None = None


def handle_learn_start(runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    global _orchestrator, _unsubscribe
    device_id = str(payload.get("device_id", "novo-device")).strip() or "novo-device"
    device_name = str(payload.get("device_name", "Novo MIDI")).strip() or "Novo MIDI"
    _orchestrator = LearnOrchestrator(device_id=device_id, device_name=device_name)
    _orchestrator.start()

    runtime.router.set_learn(True)
    if _unsubscribe:
        _unsubscribe()
    _unsubscribe = runtime.bus.on("router.captured", _on_captured)
    return {"status": "listening", "phase": _orchestrator.phase.value}


def handle_learn_stop(runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    global _unsubscribe
    runtime.router.set_learn(False)
    if _unsubscribe:
        _unsubscribe()
        _unsubscribe = None
    return {"status": "stopped"}


def handle_learn_snapshot(_runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    if not _orchestrator:
        return {"controls": [], "phase": "idle"}
    return {
        "controls": [_control_view(c) for c in _orchestrator.preview()],
        "phase": _orchestrator.phase.value,
        "captured_signatures": list(_orchestrator.samples.keys()),
    }


def handle_learn_advance(_runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    if not _orchestrator:
        raise RuntimeError("learn não está ativo")
    phase = _orchestrator.advance_phase()
    return {"phase": phase.value}


def handle_learn_override(_runtime: Runtime, payload: dict[str, Any]) -> dict[str, Any]:
    if not _orchestrator:
        raise RuntimeError("learn não está ativo")
    signature = str(payload.get("signature", "")).strip()
    kind = str(payload.get("kind", "")).strip()
    if not signature or not kind:
        raise ValueError("signature e kind obrigatórios")
    try:
        ck = ControlKind(kind)
    except ValueError:
        raise ValueError(f"kind inválido: {kind}")
    _orchestrator.override_kind(signature, ck)
    return {"signature": signature, "kind": ck.value}


def handle_learn_finalize(runtime: Runtime, _payload: dict[str, Any]) -> dict[str, Any]:
    global _unsubscribe
    if not _orchestrator:
        raise RuntimeError("learn não está ativo")
    device = _orchestrator.finalize()
    runtime.devices.save(device)
    runtime.set_active_device(device)
    runtime.router.set_learn(False)
    if _unsubscribe:
        _unsubscribe()
        _unsubscribe = None
    return device.to_dict()


def _on_captured(event: MidiEvent) -> None:
    if not _orchestrator:
        return
    _orchestrator.consume_event(event)


def _control_view(control) -> dict[str, Any]:
    return {
        "id": control.id,
        "name": control.name,
        "kind": control.kind.value,
        "signature": control.signature,
        "group": control.group,
        "params": control.params,
    }
