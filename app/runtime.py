"""Runtime central — instancia core + backends + connectors + router.

Mantém estado vivo durante a vida do processo. Frontend conversa só com
este objeto via bridge JSON.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from core.action import ActionRegistry, ActionRunner
from core.bus import EventBus
from core.capability import CapabilityRegistry, detect_platform
from core.device.registry import DeviceRegistry
from core.midi.listener_async import MidiListener
from core.midi.out import list_output_ports
from core.models import Device, Profile
from core.profile import ProfileManager
from core.router import Router
from core.telemetry import EventLog, RuntimeTelemetry

from backends import load_backend, BackendBundle
from connectors import ConnectorRegistry
from connectors.audio import AudioConnector
from connectors.core import CoreConnector
from connectors.http import HttpConnector
from connectors.midi_out import MidiOutConnector
from connectors.obs import ObsConnector
from connectors.osc import OscConnector
from connectors.shell import ShellConnector
from connectors.system import SystemConnector
from connectors.universal import UniversalConnector
from connectors.window import WindowConnector


@dataclass
class Runtime:
    root: Path
    bus: EventBus = field(default_factory=EventBus)
    capabilities: CapabilityRegistry = field(init=False)
    actions: ActionRegistry = field(init=False)
    runner: ActionRunner = field(init=False)
    backend: BackendBundle = field(init=False)
    connectors: ConnectorRegistry = field(init=False)
    devices: DeviceRegistry = field(init=False)
    profiles: ProfileManager = field(init=False)
    listener: MidiListener = field(init=False)
    router: Router = field(init=False)
    telemetry: RuntimeTelemetry = field(init=False)
    log: EventLog = field(init=False)
    active_device: Device | None = None
    active_profile: Profile | None = None

    def __post_init__(self) -> None:
        self.capabilities = CapabilityRegistry()
        self.backend = load_backend(self.capabilities)
        self.actions = ActionRegistry(self.capabilities)
        self.runner = ActionRunner(self.actions)
        self.devices = DeviceRegistry(self.root / "devices")
        self.profiles = ProfileManager(self.root / "profiles")
        self.listener = MidiListener(self.bus)
        self.router = Router(self.runner, self.bus, context_provider=self._context)
        self.telemetry = RuntimeTelemetry(self.bus, layer_lookup=self._current_layer)
        self.log = EventLog(self.bus, capacity=100)
        self.connectors = ConnectorRegistry(self.actions)
        self.connectors.add_many(self._builtin_connectors(), self.backend.services)
        self.router.attach()
        self.telemetry.attach()
        self.log.attach()

    def _builtin_connectors(self) -> list:
        return [
            CoreConnector(),
            AudioConnector(),
            ShellConnector(),
            WindowConnector(),
            SystemConnector(),
            MidiOutConnector(),
            HttpConnector(),
            OscConnector(),
            ObsConnector(),
            UniversalConnector(packs_dir=self.root / "presets" / "universal"),
        ]

    def set_active_device(self, device: Device | None) -> None:
        self.active_device = device
        self.router.set_device(device)

    def load_profile(self, profile: Profile | None) -> None:
        self.active_profile = profile
        self.router.load_profile(profile)

    def set_active_layer(self, layer_id: str) -> None:
        if not self.active_profile:
            return
        self.active_profile.active_layer = layer_id
        self.router.layer_state.set_layer(layer_id)

    def _current_layer(self) -> str:
        return self.router.layer_state.current

    def _context(self) -> dict[str, Any]:
        window_svc = self.backend.services.get("window")
        foreground = window_svc.foreground_process_name() if window_svc else ""
        return {"foreground_app": foreground}

    def midi_input_ports(self) -> list[str]:
        try:
            import mido
            return list(mido.get_input_names())
        except Exception:  # noqa: BLE001
            return []

    def midi_output_ports(self) -> list[str]:
        return list_output_ports()
