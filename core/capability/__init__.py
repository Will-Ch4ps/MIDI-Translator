"""Detecção e registry de capabilities da plataforma corrente."""
from .detect import detect_platform, Platform
from .registry import CapabilityRegistry

__all__ = ["CapabilityRegistry", "Platform", "detect_platform"]
