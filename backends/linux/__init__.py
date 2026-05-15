"""Backend Linux — declara capabilities suportadas e expõe serviços."""
from __future__ import annotations

import shutil

from core.capability import CapabilityRegistry
from core.models import Capability

from .keyboard import KeyboardEmitter
from .volume import VolumeService
from .window import WindowService
from .system import SystemService
from .shell import ShellService
from .clipboard import ClipboardService


def declare_capabilities(registry: CapabilityRegistry) -> None:
    caps: list[Capability] = []

    if shutil.which("ydotool") or shutil.which("xdotool"):
        caps.extend([
            Capability(id="keyboard.combo", label="Combos de teclado"),
            Capability(id="keyboard.hold", label="Segurar teclas"),
            Capability(id="keyboard.type", label="Digitar texto"),
            Capability(id="mouse.move", label="Mover mouse"),
            Capability(id="mouse.click", label="Clique de mouse"),
        ])

    if shutil.which("wpctl") or shutil.which("pactl"):
        caps.extend([
            Capability(id="audio.master", label="Volume master"),
            Capability(id="audio.mute", label="Mute"),
        ])
    if shutil.which("pactl"):
        caps.extend([
            Capability(id="audio.per_app", label="Volume por aplicação"),
            Capability(id="audio.discovery", label="Descobrir sessões"),
        ])

    if shutil.which("wmctrl") or shutil.which("i3-msg") or shutil.which("hyprctl") or shutil.which("kdotool"):
        caps.extend([
            Capability(id="window.focus", label="Foco de janela"),
            Capability(id="window.snap", label="Snap de janela"),
        ])

    if shutil.which("loginctl") or shutil.which("xdg-screensaver"):
        caps.append(Capability(id="system.lock", label="Trancar sessão"))
    if shutil.which("notify-send"):
        caps.append(Capability(id="system.notify", label="Notificação"))
    if shutil.which("brightnessctl"):
        caps.append(Capability(id="system.brightness", label="Brilho"))

    if shutil.which("xdg-open"):
        caps.append(Capability(id="shell.launch", label="Iniciar aplicativo"))
    caps.extend([
        Capability(id="shell.command", label="Executar comando"),
        Capability(id="shell.script", label="Executar script"),
        Capability(id="clipboard.read", label="Ler clipboard"),
        Capability(id="clipboard.write", label="Escrever clipboard"),
    ])

    registry.declare_many(caps)


def services() -> dict:
    return {
        "keyboard": KeyboardEmitter(),
        "volume": VolumeService(),
        "window": WindowService(),
        "system": SystemService(),
        "shell": ShellService(),
        "clipboard": ClipboardService(),
    }


__all__ = ["declare_capabilities", "services"]
