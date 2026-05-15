use std::thread::spawn;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

use crate::listener_service::{listener_stop, start_listener_process_default, stop_listener_process};

const MENU_OPEN: &str = "open";
const MENU_START_LISTENER: &str = "start_listener";
const MENU_STOP_LISTENER: &str = "stop_listener";
const MENU_QUIT: &str = "quit";

pub fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let open_item = MenuItem::with_id(app, MENU_OPEN, "Abrir MIDITranslate", true, None::<&str>)?;
    let start_item =
        MenuItem::with_id(app, MENU_START_LISTENER, "Iniciar listener", true, None::<&str>)?;
    let stop_item = MenuItem::with_id(app, MENU_STOP_LISTENER, "Parar listener", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, MENU_QUIT, "Sair", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open_item, &start_item, &stop_item, &quit_item])?;

    let mut builder = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
            MENU_OPEN => {
                let _ = show_main_window(app);
            }
            MENU_START_LISTENER => {
                let handle = app.app_handle().clone();
                spawn(move || {
                    let result = start_listener_process_default(&handle);
                    if let Ok(status) = result {
                        let payload = serde_json::json!({
                            "type": "status",
                            "status": if status.running { "connected" } else { "disconnected" },
                            "port": status.port
                        });
                        let _ = handle.emit("midi-runtime", payload);
                    } else if let Err(message) = result {
                        let payload = serde_json::json!({
                            "type": "status",
                            "status": "error",
                            "message": message
                        });
                        let _ = handle.emit("midi-runtime", payload);
                    }
                });
            }
            MENU_STOP_LISTENER => {
                let _ = listener_stop();
            }
            MENU_QUIT => {
                stop_listener_process();
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if matches!(
                event,
                TrayIconEvent::Click {
                    button: MouseButton::Left,
                    button_state: MouseButtonState::Up,
                    ..
                }
            ) {
                let _ = show_main_window(tray.app_handle());
            }
        });
    if let Some(icon) = app.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    builder.build(app)?;

    Ok(())
}

pub fn show_main_window(app: &AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        window.show()?;
        window.set_focus()?;
    }
    Ok(())
}
