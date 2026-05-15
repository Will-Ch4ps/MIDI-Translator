"""Estado das layers e ações `layer.*`."""
from __future__ import annotations

from dataclasses import dataclass, field

from ..models import Profile


@dataclass
class LayerState:
    """Mantém qual layer está ativa e as hold-layers empilhadas."""
    active: str = "default"
    held: list[str] = field(default_factory=list)

    @property
    def current(self) -> str:
        return self.held[-1] if self.held else self.active

    def set_layer(self, layer_id: str) -> None:
        self.active = layer_id

    def toggle(self, layer_id: str) -> None:
        self.active = "default" if self.active == layer_id else layer_id

    def cycle(self, layers: list[str]) -> None:
        if not layers:
            return
        try:
            index = layers.index(self.active)
        except ValueError:
            index = -1
        self.active = layers[(index + 1) % len(layers)]

    def hold_push(self, layer_id: str) -> None:
        self.held.append(layer_id)

    def hold_pop(self, layer_id: str) -> None:
        if layer_id in self.held:
            self.held.remove(layer_id)

    def reset(self) -> None:
        self.active = "default"
        self.held.clear()


def layer_ids_in_profile(profile: Profile) -> list[str]:
    return [layer.id for layer in profile.layers] or ["default"]
