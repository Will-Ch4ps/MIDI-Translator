"""Backend Windows — declara capabilities e expõe serviços primitivos."""
from __future__ import annotations

from core.capability import CapabilityRegistry
from core.models import Capability

from .keyboard import KeyboardEmitter
from .mouse import MouseEmitter
from .clipboard import ClipboardService
from .volume import VolumeService
from .window import WindowService
from .system import SystemService
from .shell import ShellService


_CAPABILITIES = [
    Capability(id="keyboard.combo", label="Combos de teclado"),
    Capability(id="keyboard.hold", label="Segurar teclas"),
    Capability(id="keyboard.macro", label="Macros de teclado"),
    Capability(id="keyboard.type", label="Digitar texto"),
    Capability(id="mouse.move", label="Mover mouse"),
    Capability(id="mouse.click", label="Clique de mouse"),
    Capability(id="mouse.scroll", label="Scroll de mouse"),
    Capability(id="clipboard.read", label="Ler clipboard"),
    Capability(id="clipboard.write", label="Escrever clipboard"),
    Capability(id="audio.master", label="Volume master"),
    Capability(id="audio.per_app", label="Volume por aplicação"),
    Capability(id="audio.mute", label="Mute master e por app"),
    Capability(id="audio.discovery", label="Descobrir sessões de áudio"),
    Capability(id="window.snap", label="Snap de janela"),
    Capability(id="window.focus", label="Foco de janela"),
    Capability(id="window.minimize_all", label="Minimizar todas"),
    Capability(id="window.virtual_desktop", label="Virtual desktops"),
    Capability(id="system.lock", label="Trancar sessão"),
    Capability(id="system.notify", label="Notificação"),
    Capability(id="system.screenshot", label="Screenshot"),
    Capability(id="shell.launch", label="Iniciar aplicativo"),
    Capability(id="shell.command", label="Executar comando"),
    Capability(id="shell.script", label="Executar script"),
]


def declare_capabilities(registry: CapabilityRegistry) -> None:
    registry.declare_many(_CAPABILITIES)


def services() -> dict:
    return {
        "keyboard": KeyboardEmitter(),
        "mouse": MouseEmitter(),
        "clipboard": ClipboardService(),
        "volume": VolumeService(),
        "window": WindowService(),
        "system": SystemService(),
        "shell": ShellService(),
    }


__all__ = ["declare_capabilities", "services"]
