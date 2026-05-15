"""Entrypoint do MIDI Studio v0.2 — abre listener e dorme até signal."""
from __future__ import annotations

import argparse
import signal
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.runtime import Runtime
from core.models import Profile


def run(port_name: str, profile_name: str, device_id: str) -> int:
    runtime = Runtime(root=ROOT)

    if device_id:
        device = runtime.devices.load(device_id)
        if device:
            runtime.set_active_device(device)
    else:
        names = runtime.devices.list_devices()
        if names:
            runtime.set_active_device(runtime.devices.load(names[0]))

    profile: Profile | None = None
    if profile_name:
        profile = runtime.profiles.load(profile_name)
    elif runtime.profiles.list_profiles():
        profile = runtime.profiles.load(runtime.profiles.list_profiles()[0])
    if profile and runtime.active_device and not profile.device_id:
        profile.device_id = runtime.active_device.id
    runtime.load_profile(profile)

    if not port_name:
        ports = runtime.midi_input_ports()
        port_name = ports[0] if ports else ""
    if port_name:
        runtime.listener.start(port_name)
    else:
        print("[service] nenhuma porta MIDI disponível — aguardando comandos", file=sys.stderr, flush=True)

    stop = threading.Event()

    def on_signal(_signum, _frame) -> None:
        stop.set()

    signal.signal(signal.SIGINT, on_signal)
    signal.signal(signal.SIGTERM, on_signal)

    try:
        while not stop.is_set():
            stop.wait(0.25)
    finally:
        runtime.listener.stop()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="MIDI Studio backend service")
    parser.add_argument("--port", default="")
    parser.add_argument("--profile", default="")
    parser.add_argument("--device", default="")
    args = parser.parse_args()
    try:
        return run(args.port, args.profile, args.device)
    except Exception as exc:  # noqa: BLE001
        print(f"[service] {exc}", file=sys.stderr, flush=True)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
