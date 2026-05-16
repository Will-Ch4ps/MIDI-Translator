"""Registro dos comandos da bridge (um por arquivo, agregados aqui)."""
from .bootstrap import handle_bootstrap
from .midi_ports import handle_list_midi_ports
from .listener import handle_start_listener, handle_stop_listener
from .devices import handle_load_device, handle_save_device, handle_list_devices
from .profiles import handle_save_profile, handle_load_profile, handle_set_layer
from .preset_packs import handle_apply_preset_pack, handle_undo_preset_pack, handle_list_preset_packs
from .actions import handle_test_action, handle_list_actions
from .recipes import handle_list_recipes
from .telemetry import handle_telemetry_snapshot, handle_log_snapshot
from .learn import (
    handle_learn_start,
    handle_learn_stop,
    handle_learn_snapshot,
    handle_learn_advance,
    handle_learn_override,
    handle_learn_finalize,
)


COMMANDS = {
    "bootstrap": handle_bootstrap,
    "list_midi_ports": handle_list_midi_ports,
    "start_listener": handle_start_listener,
    "stop_listener": handle_stop_listener,
    "load_device": handle_load_device,
    "save_device": handle_save_device,
    "list_devices": handle_list_devices,
    "save_profile": handle_save_profile,
    "load_profile": handle_load_profile,
    "set_layer": handle_set_layer,
    "apply_preset_pack": handle_apply_preset_pack,
    "undo_preset_pack": handle_undo_preset_pack,
    "list_preset_packs": handle_list_preset_packs,
    "test_action": handle_test_action,
    "list_actions": handle_list_actions,
    "list_recipes": handle_list_recipes,
    "telemetry_snapshot": handle_telemetry_snapshot,
    "log_snapshot": handle_log_snapshot,
    "learn_start": handle_learn_start,
    "learn_stop": handle_learn_stop,
    "learn_snapshot": handle_learn_snapshot,
    "learn_advance": handle_learn_advance,
    "learn_override": handle_learn_override,
    "learn_finalize": handle_learn_finalize,
}


__all__ = ["COMMANDS"]
