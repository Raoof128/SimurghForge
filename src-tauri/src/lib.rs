mod commands;
mod utils;

use serde::Serialize;
use std::path::Path;

use crate::utils::{paths, sanitise};

#[derive(Serialize)]
struct FileInfo {
    path: String,
    size: u64,
}

#[tauri::command]
async fn get_file_info(paths: Vec<String>) -> Result<Vec<FileInfo>, String> {
    let mut results = Vec::new();
    for p in paths {
        if sanitise::path_has_parent_dir_component(&p) {
            return Err("Path traversal detected".into());
        }
        let meta = std::fs::metadata(&p).map_err(|e| format!("Cannot read {}: {}", p, e))?;
        results.push(FileInfo { path: p, size: meta.len() });
    }
    Ok(results)
}

#[tauri::command]
async fn open_folder(path: String) -> Result<(), String> {
    let resolved = paths::expand_tilde(&path)?;
    let p = Path::new(&resolved);
    if !p.exists() {
        return Err(format!("Path does not exist: {}", resolved));
    }

    paths::reveal_in_os(p)
}

#[tauri::command]
async fn load_settings() -> Result<String, String> {
    let home = paths::home_dir()?;
    let config_path = home.join(".config").join("simurgh-forge").join("settings.json");
    match std::fs::read_to_string(&config_path) {
        Ok(s) => Ok(s),
        Err(_) => Ok("{}".to_string()),
    }
}

#[tauri::command]
async fn save_settings(json: String) -> Result<(), String> {
    let home = paths::home_dir()?;
    let config_dir = home.join(".config").join("simurgh-forge");
    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    let config_path = config_dir.join("settings.json");
    std::fs::write(&config_path, json).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::convert::convert_batch,
            commands::convert::get_default_output_dir,
            get_file_info,
            open_folder,
            load_settings,
            save_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
