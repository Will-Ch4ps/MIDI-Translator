use serde::Serialize;
use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;

#[derive(Serialize)]
pub struct LaunchContext {
    autostart_launch: bool,
}

pub fn is_autostart_launch() -> bool {
    std::env::args().any(|arg| arg == "--autostart")
}

#[tauri::command]
pub fn launch_context() -> LaunchContext {
    LaunchContext {
        autostart_launch: is_autostart_launch(),
    }
}

#[tauri::command]
pub fn autostart_status(app: AppHandle) -> Result<bool, String> {
    app.autolaunch()
        .is_enabled()
        .map_err(|err| format!("autostart status error: {err}"))
}

#[tauri::command]
pub fn autostart_set_enabled(app: AppHandle, enabled: bool) -> Result<bool, String> {
    let manager = app.autolaunch();
    if enabled {
        manager
            .enable()
            .map_err(|err| format!("failed to enable autostart: {err}"))?;
    } else {
        manager
            .disable()
            .map_err(|err| format!("failed to disable autostart: {err}"))?;
    }

    manager
        .is_enabled()
        .map_err(|err| format!("autostart status error: {err}"))
}

pub fn autostart_repair_if_enabled(app: &AppHandle) -> Result<(), String> {
    if cfg!(debug_assertions) {
        return Ok(());
    }
    let manager = app.autolaunch();
    let enabled = manager
        .is_enabled()
        .map_err(|err| format!("autostart status error: {err}"))?;
    if !enabled {
        return Ok(());
    }
    manager
        .disable()
        .map_err(|err| format!("failed to refresh autostart (disable): {err}"))?;
    manager
        .enable()
        .map_err(|err| format!("failed to refresh autostart (enable): {err}"))?;
    Ok(())
}
