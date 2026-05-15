use serde::Serialize;
use serde_json::Value;
use serde::Deserialize;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::{Mutex, OnceLock};
use std::thread::{sleep, spawn};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

struct ListenerProcess {
    child: Child,
    port: String,
    profile: String,
    layout: String,
}

#[derive(Deserialize)]
struct BootstrapEnvelope {
    ok: bool,
    data: Option<BootstrapData>,
    error: Option<String>,
}

#[derive(Deserialize)]
struct BootstrapData {
    #[serde(rename = "midiPorts")]
    midi_ports: Vec<String>,
    #[serde(rename = "preferredPort")]
    preferred_port: String,
    profile: NamedProfile,
    layouts: Vec<String>,
}

#[derive(Deserialize)]
struct NamedProfile {
    name: String,
}

#[derive(Serialize)]
pub struct ListenerStatus {
    pub running: bool,
    pub port: Option<String>,
    pub profile: Option<String>,
    pub layout: Option<String>,
    pub error: Option<String>,
}

static LISTENER_SLOT: OnceLock<Mutex<Option<ListenerProcess>>> = OnceLock::new();

fn listener_slot() -> &'static Mutex<Option<ListenerProcess>> {
    LISTENER_SLOT.get_or_init(|| Mutex::new(None))
}

fn app_root() -> Result<PathBuf, String> {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .map(PathBuf::from)
        .ok_or_else(|| "could not resolve app root".to_string())
}

fn resolve_default_binding() -> Result<(String, String, String), String> {
    let mut bridge = Command::new("py");
    bridge
        .args(["-3", "backend/bridge.py", "bootstrap", "{}"])
        .current_dir(app_root()?);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        bridge.creation_flags(CREATE_NO_WINDOW);
    }
    let output = bridge
        .output()
        .map_err(|err| format!("failed to read bootstrap data: {err}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let payload: BootstrapEnvelope =
        serde_json::from_str(stdout.trim()).map_err(|err| format!("invalid bootstrap json: {err}"))?;

    if !payload.ok {
        let message = payload.error.unwrap_or_else(|| "bootstrap failed".to_string());
        return Err(message);
    }

    let data = payload
        .data
        .ok_or_else(|| "bootstrap returned empty payload".to_string())?;
    let port = if data.preferred_port.trim().is_empty() {
        data.midi_ports.first().cloned().unwrap_or_default()
    } else {
        data.preferred_port
    };

    if port.trim().is_empty() {
        return Err("no midi port available".to_string());
    }

    let layout = data
        .layouts
        .first()
        .cloned()
        .unwrap_or_else(|| "starrykey25".to_string());
    let profile = if data.profile.name.trim().is_empty() {
        "default".to_string()
    } else {
        data.profile.name
    };

    Ok((port, profile, layout))
}

fn status_from(active: Option<&ListenerProcess>, error: Option<String>) -> ListenerStatus {
    ListenerStatus {
        running: active.is_some(),
        port: active.map(|item| item.port.clone()),
        profile: active.map(|item| item.profile.clone()),
        layout: active.map(|item| item.layout.clone()),
        error,
    }
}

fn refresh_listener(active: &mut Option<ListenerProcess>) -> Option<String> {
    if let Some(proc) = active.as_mut() {
        return match proc.child.try_wait() {
            Ok(None) => None,
            Ok(Some(code)) => {
                *active = None;
                if code.success() {
                    None
                } else {
                    Some(format!("listener exited: {code}"))
                }
            }
            Err(err) => {
                *active = None;
                Some(format!("listener status error: {err}"))
            }
        };
    }
    None
}

fn spawn_stream_readers(app: &AppHandle, child: &mut Child) {
    if let Some(stdout) = child.stdout.take() {
        let app_handle = app.clone();
        spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines().map_while(Result::ok) {
                if let Ok(payload) = serde_json::from_str::<Value>(&line) {
                    let _ = app_handle.emit("midi-runtime", payload);
                }
            }
        });
    }

    if let Some(stderr) = child.stderr.take() {
        let app_handle = app.clone();
        spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines().map_while(Result::ok) {
                let payload = serde_json::json!({
                    "type": "status",
                    "status": "stderr",
                    "message": line
                });
                let _ = app_handle.emit("midi-runtime", payload);
            }
        });
    }
}

pub fn stop_listener_process() {
    if let Ok(mut guard) = listener_slot().lock() {
        if let Some(mut proc) = guard.take() {
            let _ = proc.child.kill();
            let _ = proc.child.wait();
        }
    }
}

pub fn start_listener_process_default(app: &AppHandle) -> Result<ListenerStatus, String> {
    let (port, profile, layout) = resolve_default_binding()?;
    listener_start(app.clone(), port, profile, layout)
}

#[tauri::command]
pub fn listener_status() -> ListenerStatus {
    match listener_slot().lock() {
        Ok(mut guard) => {
            let err = refresh_listener(&mut guard);
            status_from(guard.as_ref(), err)
        }
        Err(_) => status_from(None, Some("listener lock failed".to_string())),
    }
}

#[tauri::command]
pub fn listener_start(
    app: AppHandle,
    port: String,
    profile: String,
    layout: String,
) -> Result<ListenerStatus, String> {
    if port.trim().is_empty() {
        return Err("no midi port selected".to_string());
    }
    let mut guard = listener_slot()
        .lock()
        .map_err(|_| "listener lock failed".to_string())?;
    let err = refresh_listener(&mut guard);
    if guard.is_some() {
        return Ok(status_from(guard.as_ref(), err));
    }

    let args = vec![
        "-3".to_string(),
        "backend/service.py".to_string(),
        "--port".to_string(),
        port.clone(),
        "--profile".to_string(),
        profile.clone(),
        "--layout".to_string(),
        layout.clone(),
    ];

    let mut command = Command::new("py");
    command
        .args(args)
        .current_dir(app_root()?)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    let mut child = command
        .spawn()
        .map_err(|err| format!("failed to start MIDI listener: {err}"))?;

    spawn_stream_readers(&app, &mut child);
    sleep(Duration::from_millis(120));
    if let Ok(Some(code)) = child.try_wait() {
        return Err(format!("listener exited immediately: {code}"));
    }

    *guard = Some(ListenerProcess {
        child,
        port,
        profile,
        layout,
    });
    Ok(status_from(guard.as_ref(), None))
}

#[tauri::command]
pub fn listener_stop() -> Result<ListenerStatus, String> {
    stop_listener_process();
    Ok(status_from(None, None))
}
