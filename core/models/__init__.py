"""Modelos de dados centrais da nova fundação.

Tudo que é serializável (Device, Profile, Mapping, etc.) vive aqui.
A lógica (managers, registries, runners) fica nos pacotes irmãos.
"""
from .signature import MidiKind, MidiSignature
from .event import MidiEvent
from .device import Control, ControlKind, Device, Position
from .action import Action, ActionDef, ParamField, ParamsSchema
from .capability import Capability
from .profile import Condition, Layer, Mapping, Profile, TriggerMode
from .recipe import PresetPack, PresetPackMapping, PresetPackTarget, Recipe, RecipeStep

__all__ = [
    "Action",
    "ActionDef",
    "Capability",
    "Condition",
    "Control",
    "ControlKind",
    "Device",
    "Layer",
    "Mapping",
    "MidiEvent",
    "MidiKind",
    "MidiSignature",
    "ParamField",
    "ParamsSchema",
    "Position",
    "PresetPack",
    "PresetPackMapping",
    "PresetPackTarget",
    "Profile",
    "Recipe",
    "RecipeStep",
    "TriggerMode",
]
