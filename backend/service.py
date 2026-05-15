"""Persistent MIDI runtime used by Tauri start/stop commands."""
from __future__ import annotations

import argparse
import signal
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.bus import EventBus
from core.device.manager import DeviceManager
from core.input.keyboard import KeyboardEmitter
from core.input.runner import ActionRunner
from core.input.volume import VolumeController
from core.mapper.router import Router
from core.midi.devices import find_starrykey, list_input_devices
from core.midi.listener import MidiListener
from core.profiles.manager import ProfileManager
from runtime_telemetry import RuntimeTelemetry


def resolve_port(port_name: str) -> str:
    if port_name:
        return port_name

    ports = list_input_devices()
    preferred = find_starrykey(ports)

    if preferred:
        return preferred
    if ports:
        return ports[0]

    raise RuntimeError("no MIDI input port available")


def run(port_name: str, layout_name: str, profile_name: str) -> None:
    devices = DeviceManager(ROOT / "devices")
    profiles = ProfileManager(ROOT / "profiles")

    layout = devices.load(layout_name)
    profile = profiles.load(profile_name)

    bus = EventBus()

    runner = ActionRunner(KeyboardEmitter(), VolumeController())

    router = Router(runner, bus)
    router.set_layout(layout)
    router.load_mappings(profile.mappings)
    router.attach()

    telemetry = RuntimeTelemetry(bus, layout)
    telemetry.attach()

    stop = threading.Event()
    listener = MidiListener(bus)

    def on_signal(_signum, _frame) -> None:
        stop.set()

    signal.signal(signal.SIGINT, on_signal)
    signal.signal(signal.SIGTERM, on_signal)

    port = resolve_port(port_name)
    listener.start(port)

    try:
        while not stop.is_set():
            stop.wait(0.2)
    finally:
        listener.stop()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", default="")
    parser.add_argument("--layout", default="starrykey25")
    parser.add_argument("--profile", default="default")
    args = parser.parse_args()

    try:
        run(args.port, args.layout, args.profile)
        return 0
    except Exception as exc:  # noqa: BLE001
        print(f"[service] {exc}", file=sys.stderr, flush=True)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
