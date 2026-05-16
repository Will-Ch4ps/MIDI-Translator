#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod listener_service;
mod startup;
mod tray;

use listener_service::{listener_start, listener_status, listener_stop, stop_listener_process};
use startup::{autostart_repair_if_enabled, autostart_set_enabled, autostart_status, is_autostart_launch, launch_context};
use tray::{build_tray, show_main_window};
use serde_json::Value;
use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

fn app_root() -> Result<PathBuf, String> {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .map(PathBuf::from)
        .ok_or_else(|| "could not resolve app root".to_string())
}

#[tauri::command]
fn backend_call(command: String, payload: Value) -> Result<Value, String> {
    let root = app_root()?;
    let payload_text = payload.to_string();
    let mut bridge = Command::new("py");
    bridge
        .args(["-3", "-m", "app.bridge.server", &command, &payload_text])
        .current_dir(root);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        bridge.creation_flags(CREATE_NO_WINDOW);
    }
    let output = bridge
        .output()
        .map_err(|err| format!("failed to start python backend: {err}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let trimmed = stdout.trim();

    if trimmed.is_empty() {
        let status = output.status.code().unwrap_or(-1);
        return Err(format!(
            "python backend retornou stdout vazio (exit {status}). stderr:\n{}",
            stderr.trim()
        ));
    }

    let response: Value = serde_json::from_str(trimmed).map_err(|err| {
        format!(
            "invalid backend response ({err}). stdout:\n{trimmed}\n\nstderr:\n{}",
            stderr.trim()
        )
    })?;

    if response["ok"].as_bool() == Some(true) {
        Ok(response["data"].clone())
    } else {
        Err(response["error"].as_str().unwrap_or("backend error").to_string())
    }
}

#[tauri::command]
fn pick_file(kind: Option<String>) -> Option<String> {
    let mut dialog = rfd::FileDialog::new();
    match kind.as_deref().unwrap_or_default() {
        "app_launch" => {
            dialog = dialog
                .set_title("Selecione programa ou atalho")
                .add_filter("Programas e atalhos", &["exe", "lnk", "bat", "cmd", "com"])
                .add_filter("Scripts", &["vbs", "ps1", "py"]);
        }
        "script" => {
            dialog = dialog
                .set_title("Selecione script")
                .add_filter("Scripts", &["vbs", "ps1", "py", "bat", "cmd"]);
        }
        _ => {}
    }
    dialog.pick_file()
        .map(|path| path.to_string_lossy().to_string())
}

#[tauri::command]
fn pick_program_shortcut() -> Option<String> {
    let mut dialog = rfd::FileDialog::new()
        .set_title("Selecione atalho ou executavel")
        .add_filter("Atalhos e programas", &["lnk", "exe", "bat", "cmd", "com"]);

    if let Ok(program_data) = std::env::var("ProgramData") {
        let start_menu = PathBuf::from(program_data).join("Microsoft\\Windows\\Start Menu\\Programs");
        dialog = dialog.set_directory(start_menu);
    }

    dialog.pick_file()
        .map(|path| path.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            let _ = show_main_window(app);
        }))
        .setup(|app| {
            build_tray(&app.handle())?;
            if let Err(err) = autostart_repair_if_enabled(&app.handle()) {
                eprintln!("{err}");
            }
            if is_autostart_launch() {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            backend_call,
            listener_status,
            listener_start,
            listener_stop,
            pick_file,
            pick_program_shortcut,
            launch_context,
            autostart_status,
            autostart_set_enabled
        ])
        .build(tauri::generate_context!())
        .expect("error while building MIDITranslate")
        .run(|_app, event| {
            if matches!(event, tauri::RunEvent::Exit) {
                stop_listener_process();
            }
        });
}
