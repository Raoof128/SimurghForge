use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::sync::Semaphore;

use super::router::{self, Engine};
use super::engines;
use crate::utils::{mime, sanitise};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileRequest {
    pub id: String,
    pub input_path: String,
    pub output_format: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertBatchPayload {
    pub files: Vec<FileRequest>,
    pub output_dir: String,
    pub max_concurrency: u32,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressEvent {
    pub id: String,
    pub status: String,
    pub percent: u8,
    pub error_msg: Option<String>,
    pub output_path: Option<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchCompleteEvent {
    pub total_files: usize,
    pub succeeded: usize,
    pub failed: usize,
    pub output_dir: String,
}

pub fn emit_progress(app: &AppHandle, id: &str, status: &str, percent: u8, error_msg: Option<String>, output_path: Option<String>) {
    let _ = app.emit("conversion_progress", ProgressEvent {
        id: id.to_string(),
        status: status.to_string(),
        percent,
        error_msg,
        output_path,
    });
}

#[tauri::command]
pub async fn convert_batch(app: AppHandle, payload: ConvertBatchPayload) -> Result<(), String> {
    let semaphore = Arc::new(Semaphore::new(payload.max_concurrency as usize));
    let total = payload.files.len();
    let succeeded = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let failed = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let output_dir = payload.output_dir.clone();

    let mut handles = Vec::new();

    for file in payload.files {
        let app = app.clone();
        let sem = Arc::clone(&semaphore);
        let ok_count = Arc::clone(&succeeded);
        let err_count = Arc::clone(&failed);
        let out_dir = output_dir.clone();

        let handle = tauri::async_runtime::spawn(async move {
            let _permit = Arc::clone(&sem).acquire_owned().await.unwrap();

            let input_path = match sanitise::validate_input(&file.input_path, 500_000_000) {
                Ok(p) => p,
                Err(e) => {
                    emit_progress(&app, &file.id, "error", 0, Some(e), None);
                    err_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    return;
                }
            };

            let input_type = match mime::detect_type(&input_path) {
                Ok(t) => t,
                Err(e) => {
                    emit_progress(&app, &file.id, "error", 0, Some(e), None);
                    err_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    return;
                }
            };

            let engine = match router::route(&input_type, &file.output_format) {
                Ok(e) => e,
                Err(e) => {
                    emit_progress(&app, &file.id, "error", 0, Some(e), None);
                    err_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    return;
                }
            };

            let input_filename = input_path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("output");
            let output_path = match sanitise::build_output_path(&out_dir, input_filename, &file.output_format) {
                Ok(p) => p,
                Err(e) => {
                    emit_progress(&app, &file.id, "error", 0, Some(e), None);
                    err_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    return;
                }
            };

            emit_progress(&app, &file.id, "converting", 10, None, None);

            let result = match engine {
                Engine::ImageMagick => engines::imagemagick::convert(&input_path, &output_path, &app, &file.id).await,
                Engine::FFmpeg => engines::ffmpeg::convert(&input_path, &output_path, &app, &file.id).await,
                Engine::LibreOffice => engines::libreoffice::convert(&input_path, &output_path, &app, &file.id).await,
                Engine::Pandoc => engines::pandoc::convert(&input_path, &output_path, &app, &file.id).await,
                Engine::Pandas => engines::pandas::convert(&input_path, &output_path, &app, &file.id).await,
            };

            match result {
                Ok(()) => {
                    emit_progress(&app, &file.id, "done", 100, None, Some(output_path.to_string_lossy().to_string()));
                    ok_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                }
                Err(e) => {
                    emit_progress(&app, &file.id, "error", 0, Some(e), None);
                    err_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                }
            }
        });

        handles.push(handle);
    }

    for handle in handles {
        let _ = handle.await;
    }

    let ok = succeeded.load(std::sync::atomic::Ordering::Relaxed);
    let err = failed.load(std::sync::atomic::Ordering::Relaxed);
    let _ = app.emit("batch_complete", BatchCompleteEvent {
        total_files: total,
        succeeded: ok,
        failed: err,
        output_dir,
    });

    Ok(())
}

#[tauri::command]
pub async fn get_default_output_dir() -> Result<String, String> {
    let home = std::env::var("HOME").map_err(|e| e.to_string())?;
    Ok(format!("{}/Downloads/SimurghForge", home))
}
