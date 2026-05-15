"""Detecta plataforma (Windows / Linux X11 / Linux Wayland)."""
from __future__ import annotations

import os
import platform as _platform
import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class Platform:
    os: str  # "windows" | "linux" | "darwin"
    display_server: str = ""  # "" | "x11" | "wayland"
    desktop: str = ""  # "" | "gnome" | "kde" | "i3" | "sway" | "hyprland" | "xfce"

    @property
    def id(self) -> str:
        if self.os == "linux" and self.display_server:
            return f"linux/{self.display_server}"
        return self.os


def detect_platform() -> Platform:
    name = sys.platform
    if name.startswith("win"):
        return Platform(os="windows")
    if name == "darwin":
        return Platform(os="darwin")

    display_server = _detect_linux_display()
    desktop = _detect_linux_desktop()
    return Platform(os="linux", display_server=display_server, desktop=desktop)


def _detect_linux_display() -> str:
    if os.environ.get("WAYLAND_DISPLAY"):
        return "wayland"
    if os.environ.get("DISPLAY"):
        return "x11"
    session = os.environ.get("XDG_SESSION_TYPE", "").lower()
    if session in ("wayland", "x11"):
        return session
    return ""


def _detect_linux_desktop() -> str:
    desktop = os.environ.get("XDG_CURRENT_DESKTOP", "").lower()
    if desktop:
        return desktop.split(":")[0]
    return os.environ.get("DESKTOP_SESSION", "").lower()


__all__ = ["Platform", "detect_platform"]
