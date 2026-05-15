"""Backends de plataforma — implementam primitivas que connectors consomem.

Cada backend declara as `Capability` que suporta. O CapabilityRegistry
agrega de todos os backends carregados; ActionRegistry filtra ações por
capability disponível.
"""
from .loader import load_backend, BackendBundle

__all__ = ["BackendBundle", "load_backend"]
