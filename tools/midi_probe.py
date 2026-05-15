"""Raw MIDI probe for debugging keys, pads and channels.

Usage examples:

    python tools/midi_probe.py --list
    python tools/midi_probe.py
    python tools/midi_probe.py --port "Nome da porta MIDI"
    python tools/midi_probe.py --seconds 20

This script prints raw incoming MIDI messages before MIDITranslate routing.
It is useful to verify whether a physical key is actually sending MIDI.
"""
from __future__ import annotations

import argparse
import sys
import time
from typing import Iterable

import mido


HINTS = ("starrykey", "starry key", "donner", "m-vave", "mvave")
NOTE_NAMES = ("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")


def note_name(note: int) -> str:
    return f"{NOTE_NAMES[note % 12]}{(note // 12) - 1}"


def list_ports() -> list[str]:
    try:
        return list(mido.get_input_names())
    except Exception as exc:  # noqa: BLE001
        print(f"[midi_probe] erro ao listar portas: {exc}", file=sys.stderr)
        return []


def choose_port(ports: Iterable[str], requested: str = "") -> str:
    names = list(ports)

    if requested:
        if requested in names:
            return requested

        lowered = requested.lower()
        for name in names:
            if lowered in name.lower():
                return name

        raise RuntimeError(f"porta não encontrada: {requested}")

    for name in names:
        low = name.lower()
        if any(hint in low for hint in HINTS):
            return name

    if names:
        return names[0]

    raise RuntimeError("nenhuma porta MIDI de entrada encontrada")


def msg_signature(msg) -> str:
    channel = getattr(msg, "channel", None)

    if msg.type in ("note_on", "note_off"):
        return f"note:{channel}:{msg.note}"

    if msg.type == "control_change":
        return f"cc:{channel}:{msg.control}"

    if msg.type == "pitchwheel":
        return f"pitch:{channel}:0"

    if msg.type == "program_change":
        return f"program:{channel}:{msg.program}"

    return msg.type


def describe_msg(msg) -> str:
    timestamp = time.strftime("%H:%M:%S")
    signature = msg_signature(msg)

    if msg.type in ("note_on", "note_off"):
        velocity = getattr(msg, "velocity", 0)
        pressed = msg.type == "note_on" and velocity > 0
        state = "DOWN" if pressed else "UP"

        return (
            f"{timestamp} | {state:<4} | "
            f"{signature:<12} | "
            f"{note_name(msg.note):<4} | "
            f"note={msg.note:<3} velocity={velocity:<3} channel={msg.channel + 1:<2} | "
            f"raw={msg}"
        )

    if msg.type == "control_change":
        pressed = msg.value > 0
        state = "ON " if pressed else "OFF"

        return (
            f"{timestamp} | {state:<4} | "
            f"{signature:<12} | "
            f"cc={msg.control:<3} value={msg.value:<3} channel={msg.channel + 1:<2} | "
            f"raw={msg}"
        )

    if msg.type == "pitchwheel":
        return (
            f"{timestamp} | PITCH | "
            f"{signature:<12} | "
            f"value={msg.pitch:<6} channel={msg.channel + 1:<2} | "
            f"raw={msg}"
        )

    return f"{timestamp} | OTHER | {signature:<12} | raw={msg}"


def run(port_name: str, seconds: float = 0.0, show_clock: bool = False) -> None:
    print()
    print("MIDI Probe iniciado")
    print(f"Porta: {port_name}")
    print()
    print("Pressione as teclas/pads agora.")
    print("Para testar o C#, pressione também C e D ao lado para comparar.")
    print("Pare com Ctrl+C.")
    print("-" * 96)

    started = time.monotonic()
    last_activity = started

    with mido.open_input(port_name) as port:
        while True:
            if seconds > 0 and time.monotonic() - started >= seconds:
                print("-" * 96)
                print(f"Encerrado após {seconds:.1f}s.")
                return

            got_any = False

            for msg in port.iter_pending():
                got_any = True
                last_activity = time.monotonic()
                print(describe_msg(msg), flush=True)

            if show_clock and not got_any and time.monotonic() - last_activity > 2.0:
                print(f"{time.strftime('%H:%M:%S')} | aguardando MIDI...", flush=True)
                last_activity = time.monotonic()

            time.sleep(0.002)


def main() -> int:
    parser = argparse.ArgumentParser(description="Raw MIDI monitor for MIDITranslate.")
    parser.add_argument("--list", action="store_true", help="Lista portas MIDI e sai.")
    parser.add_argument("--port", default="", help="Nome completo ou parcial da porta MIDI.")
    parser.add_argument("--seconds", type=float, default=0.0, help="Tempo máximo de captura.")
    parser.add_argument("--clock", action="store_true", help="Mostra heartbeat enquanto aguarda eventos.")
    args = parser.parse_args()

    ports = list_ports()

    if args.list:
        print("Portas MIDI de entrada:")
        if not ports:
            print("  nenhuma")
            return 1

        for index, name in enumerate(ports, start=1):
            print(f"  {index}. {name}")

        return 0

    try:
        port_name = choose_port(ports, args.port)
        run(port_name, seconds=args.seconds, show_clock=args.clock)
        return 0
    except KeyboardInterrupt:
        print()
        print("Encerrado pelo usuário.")
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"[midi_probe] erro: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
