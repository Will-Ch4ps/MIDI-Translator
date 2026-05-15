"""Mapping and action models."""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ActionType(str, Enum):
    KEY = "key"
    MACRO = "macro"
    VOLUME_UP = "volume_up"
    VOLUME_DOWN = "volume_down"
    VOLUME_SET = "volume_set"
    VOLUME_MUTE = "volume_mute"
    MEDIA_PLAY = "media_play"
    MEDIA_NEXT = "media_next"
    MEDIA_PREV = "media_prev"
    APP_LAUNCH = "app_launch"
    COMMAND = "command"
    SCRIPT = "script"
    NOOP = "noop"
    MEDIA = "media"


class TriggerMode(str, Enum):
    PRESS = "press"
    RELEASE = "release"
    HOLD = "hold"
    DOUBLE = "double"


@dataclass
class Action:
    type: ActionType
    params: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {"type": self.type.value, "params": self.params}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Action":
        raw = str(data.get("type", "key"))
        try:
            t = ActionType(raw)
        except ValueError:
            t = ActionType.KEY
        return cls(type=t, params=dict(data.get("params", {})))


@dataclass
class Mapping:
    control_id: str
    action: Action
    label: str = ""
    trigger: TriggerMode = TriggerMode.PRESS

    def to_dict(self) -> dict[str, Any]:
        return {
            "control_id": self.control_id,
            "action": self.action.to_dict(),
            "label": self.label,
            "trigger": self.trigger.value,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "Mapping":
        control_id = data.get("control_id") or data.get("signature", "")
        raw = str(data.get("trigger") or "press")
        try:
            trigger = TriggerMode(raw)
        except ValueError:
            trigger = TriggerMode.PRESS
        return cls(
            control_id=control_id,
            action=Action.from_dict(data.get("action", {})),
            label=str(data.get("label", "")),
            trigger=trigger,
        )
