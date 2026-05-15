"""Preset Packs prontos pra importação aditiva no profile.

Cada pack declara `suggested_targets` (quantos pads/knobs/buttons usar)
e `mappings` por role_index. O ProfileImporter casa role_index ↔
control_id na hora da importação.
"""
from __future__ import annotations

from core.models import PresetPack, PresetPackMapping, PresetPackTarget


def list_builtin_preset_packs() -> list[PresetPack]:
    return [
        _obs_streaming(),
        _spotify_quick(),
        _discord_ptt(),
        _photoshop_pro(),
        _system_essentials(),
        _focus_mode(),
    ]


def find_builtin_preset_pack(pack_id: str) -> PresetPack | None:
    for pack in list_builtin_preset_packs():
        if pack.id == pack_id:
            return pack
    return None


def _obs_streaming() -> PresetPack:
    return PresetPack(
        id="obs-streaming",
        name="OBS Streaming Essentials",
        description="Trocar cenas, mute mic, replay buffer, start/stop stream.",
        icon="video",
        category="Streaming",
        requires_connections=["obs"],
        suggested_targets=[
            PresetPackTarget(role="pads", count=4, hint="cenas principais"),
            PresetPackTarget(role="button", count=1, hint="mute mic"),
        ],
        mappings=[
            PresetPackMapping(role_index=0, trigger="press", action_id="obs.scene.set",
                              params={"scene": "Intro"}, label="Cena: Intro"),
            PresetPackMapping(role_index=1, trigger="press", action_id="obs.scene.set",
                              params={"scene": "Live"}, label="Cena: Live"),
            PresetPackMapping(role_index=2, trigger="press", action_id="obs.scene.set",
                              params={"scene": "BRB"}, label="Cena: BRB"),
            PresetPackMapping(role_index=3, trigger="press", action_id="obs.replay_buffer.save",
                              params={}, label="Salvar replay"),
            PresetPackMapping(role_index=4, trigger="press", action_id="obs.input.toggle_mute",
                              params={"input_name": "Mic/Aux"}, label="Mute mic"),
        ],
    )


def _spotify_quick() -> PresetPack:
    return PresetPack(
        id="spotify-quick",
        name="Spotify Quick Controls",
        description="Play/pause, próxima/anterior e volume rápido.",
        icon="music",
        category="Música",
        requires_connections=["audio"],
        suggested_targets=[
            PresetPackTarget(role="pads", count=3, hint="transport"),
            PresetPackTarget(role="knobs", count=1, hint="volume Spotify"),
        ],
        mappings=[
            PresetPackMapping(role_index=0, trigger="press", action_id="audio.media.play",
                              params={}, label="Play / Pause"),
            PresetPackMapping(role_index=1, trigger="press", action_id="audio.media.previous",
                              params={}, label="Anterior"),
            PresetPackMapping(role_index=2, trigger="press", action_id="audio.media.next",
                              params={}, label="Próxima"),
            PresetPackMapping(role_index=3, trigger="press", action_id="audio.volume.set",
                              params={"target": "spotify"}, label="Volume Spotify"),
        ],
    )


def _discord_ptt() -> PresetPack:
    return PresetPack(
        id="discord-ptt",
        name="Discord Push-to-Talk",
        description="PTT global (hold) + mute server toggle.",
        icon="mic",
        category="Comunicação",
        requires_connections=["core"],
        suggested_targets=[
            PresetPackTarget(role="pads", count=2, hint="PTT + Mute"),
        ],
        mappings=[
            PresetPackMapping(role_index=0, trigger="hold", action_id="core.key.combo",
                              params={"combo": "f13", "mode": "hold"},
                              label="Push-to-Talk (hold)"),
            PresetPackMapping(role_index=1, trigger="press", action_id="core.key.combo",
                              params={"combo": "ctrl+shift+m"}, label="Mute Discord"),
        ],
    )


def _photoshop_pro() -> PresetPack:
    return PresetPack(
        id="photoshop-pro",
        name="Photoshop Pro Shortcuts",
        description="Undo, brush size, layer toggles e zoom.",
        icon="image",
        category="Foto/Vídeo",
        requires_connections=["core"],
        suggested_targets=[
            PresetPackTarget(role="pads", count=6, hint="atalhos"),
            PresetPackTarget(role="knobs", count=2, hint="brush size + opacity"),
        ],
        mappings=[
            PresetPackMapping(role_index=0, trigger="press", action_id="core.key.combo",
                              params={"combo": "ctrl+z"}, label="Undo"),
            PresetPackMapping(role_index=1, trigger="press", action_id="core.key.combo",
                              params={"combo": "ctrl+shift+z"}, label="Redo"),
            PresetPackMapping(role_index=2, trigger="press", action_id="core.key.combo",
                              params={"combo": "ctrl+s"}, label="Salvar"),
            PresetPackMapping(role_index=3, trigger="press", action_id="core.key.combo",
                              params={"combo": "b"}, label="Brush"),
            PresetPackMapping(role_index=4, trigger="press", action_id="core.key.combo",
                              params={"combo": "e"}, label="Eraser"),
            PresetPackMapping(role_index=5, trigger="press", action_id="core.key.combo",
                              params={"combo": "g"}, label="Gradient"),
        ],
    )


def _system_essentials() -> PresetPack:
    return PresetPack(
        id="system-essentials",
        name="Sistema essencial",
        description="Lock, screenshot, snap janelas e mute master.",
        icon="settings",
        category="Sistema",
        requires_connections=["system", "audio", "window"],
        suggested_targets=[
            PresetPackTarget(role="pads", count=4, hint="comandos"),
            PresetPackTarget(role="button", count=1, hint="mute"),
        ],
        mappings=[
            PresetPackMapping(role_index=0, trigger="press", action_id="system.lock",
                              params={}, label="Trancar sessão"),
            PresetPackMapping(role_index=1, trigger="press", action_id="system.screenshot",
                              params={}, label="Screenshot"),
            PresetPackMapping(role_index=2, trigger="press", action_id="window.snap.left",
                              params={}, label="Snap esquerda"),
            PresetPackMapping(role_index=3, trigger="press", action_id="window.snap.right",
                              params={}, label="Snap direita"),
            PresetPackMapping(role_index=4, trigger="press", action_id="audio.volume.mute_toggle",
                              params={"target": "master"}, label="Mute master"),
        ],
    )


def _focus_mode() -> PresetPack:
    return PresetPack(
        id="focus-mode",
        name="Modo Foco",
        description="Snap browser, mute Discord, play Spotify.",
        icon="zap",
        category="Produtividade",
        requires_connections=["window", "audio"],
        suggested_targets=[
            PresetPackTarget(role="pads", count=3, hint="rotinas de foco"),
        ],
        mappings=[
            PresetPackMapping(role_index=0, trigger="press", action_id="window.snap.right",
                              params={}, label="Browser à direita"),
            PresetPackMapping(role_index=1, trigger="press", action_id="audio.volume.mute_toggle",
                              params={"target": "discord"}, label="Silenciar Discord"),
            PresetPackMapping(role_index=2, trigger="press", action_id="audio.media.play",
                              params={}, label="Spotify play"),
        ],
    )
