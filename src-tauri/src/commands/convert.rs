use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::Semaphore;

use super::engines;
use super::router::{self, Engine};
use crate::utils::{mime, paths, sanitise};

#[allow(dead_code)]
#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct ImageOptions {
    pub quality: Option<u8>,
    pub max_width: Option<u32>,
    pub max_height: Option<u32>,
    pub dpi: Option<u32>,
    pub strip_metadata: Option<bool>,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct VideoOptions {
    pub resolution: Option<String>,
    pub bitrate: Option<u32>,
    pub codec: Option<String>,
    pub fps: Option<u32>,
}

#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct AudioOptions {
    pub sample_rate: Option<u32>,
    pub bitrate: Option<u32>,
    pub channels: Option<u8>,
}

#[allow(dead_code)]
#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct PdfOptions {
    pub compression: Option<String>,
    pub image_dpi: Option<u32>,
}

#[allow(dead_code)]
#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct DataOptions {
    pub delimiter: Option<String>,
    pub pretty_print: Option<bool>,
    pub encoding: Option<String>,
}

#[allow(dead_code)]
#[derive(Deserialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct ConversionOptions {
    pub preset: Option<String>,
    pub image: Option<ImageOptions>,
    pub video: Option<VideoOptions>,
    pub audio: Option<AudioOptions>,
    pub pdf: Option<PdfOptions>,
    pub data: Option<DataOptions>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileRequest {
    pub id: String,
    pub input_path: String,
    pub output_format: String,
    pub options: Option<ConversionOptions>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConvertBatchPayload {
    pub files: Vec<FileRequest>,
    /// If empty, the backend uses the same default as `get_default_output_dir` (fixes forge before settings load).
    pub output_dir: String,
    pub max_concurrency: u32,
    /// From app settings; capped server-side to match the max file size slider.
    #[serde(default)]
    pub max_input_file_bytes: Option<u64>,
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

pub fn emit_progress(
    app: &AppHandle,
    id: &str,
    status: &str,
    percent: u8,
    error_msg: Option<String>,
    output_path: Option<String>,
) {
    let _ = app.emit(
        "conversion_progress",
        ProgressEvent {
            id: id.to_string(),
            status: status.to_string(),
            percent,
            error_msg,
            output_path,
        },
    );
}

/// Matches frontend queue limit (`useConversionQueue`).
const MAX_BATCH_FILES: usize = 50;
/// Matches settings slider max (`Settings.tsx`).
const MAX_CONCURRENCY: u32 = 8;

fn clamp_max_input_bytes(raw: Option<u64>) -> u64 {
    match raw {
        Some(v) if v > 0 => v.min(sanitise::ABSOLUTE_MAX_INPUT_FILE_BYTES),
        _ => sanitise::MAX_INPUT_FILE_BYTES,
    }
}

fn resolve_output_dir(raw: &str) -> Result<String, String> {
    let t = raw.trim();
    if t.is_empty() {
        paths::default_output_dir_string()
    } else {
        Ok(t.to_string())
    }
}

#[tauri::command]
pub async fn convert_batch(app: AppHandle, payload: ConvertBatchPayload) -> Result<(), String> {
    if payload.files.len() > MAX_BATCH_FILES {
        return Err(format!("Too many files in one batch (max {MAX_BATCH_FILES})"));
    }

    let permits = payload.max_concurrency.clamp(1, MAX_CONCURRENCY) as usize;
    let semaphore = Arc::new(Semaphore::new(permits));
    let total = payload.files.len();
    let succeeded = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let failed = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let max_input_bytes = clamp_max_input_bytes(payload.max_input_file_bytes);
    let output_dir = resolve_output_dir(&payload.output_dir)?;

    let mut handles = Vec::new();

    for file in payload.files {
        let app = app.clone();
        let sem = Arc::clone(&semaphore);
        let ok_count = Arc::clone(&succeeded);
        let err_count = Arc::clone(&failed);
        let out_dir = output_dir.clone();
        let max_bytes = max_input_bytes;

        let handle = tauri::async_runtime::spawn(async move {
            let _permit = Arc::clone(&sem)
                .acquire_owned()
                .await
                .expect("conversion semaphore should not be closed");

            let input_path = match sanitise::validate_input(&file.input_path, max_bytes) {
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

            let input_filename =
                input_path.file_name().and_then(|n| n.to_str()).unwrap_or("output");
            let output_path =
                match sanitise::build_output_path(&out_dir, input_filename, &file.output_format) {
                    Ok(p) => p,
                    Err(e) => {
                        emit_progress(&app, &file.id, "error", 0, Some(e), None);
                        err_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                        return;
                    }
                };

            let options = file.options.clone().unwrap_or_default();

            emit_progress(&app, &file.id, "converting", 10, None, None);

            let result = match engine {
                Engine::RustImage => {
                    engines::rust_image::convert(
                        &input_path,
                        &output_path,
                        &app,
                        &file.id,
                        &options,
                    )
                    .await
                }
                Engine::RustData => {
                    engines::rust_data::convert(&input_path, &output_path, &app, &file.id, &options)
                        .await
                }
                Engine::RustAudio => {
                    engines::rust_audio::convert(
                        &input_path,
                        &output_path,
                        &app,
                        &file.id,
                        &options,
                    )
                    .await
                }
                Engine::RustPdf => {
                    engines::rust_pdf::convert(&input_path, &output_path, &app, &file.id, &options)
                        .await
                }
                Engine::FFmpeg => {
                    engines::ffmpeg::convert(&input_path, &output_path, &app, &file.id, &options)
                        .await
                }
                Engine::LibreOffice => {
                    engines::libreoffice::convert(
                        &input_path,
                        &output_path,
                        &app,
                        &file.id,
                        &options,
                    )
                    .await
                }
                Engine::Pandoc => {
                    engines::pandoc::convert(&input_path, &output_path, &app, &file.id, &options)
                        .await
                }
                Engine::Pandas => {
                    engines::pandas::convert(&input_path, &output_path, &app, &file.id, &options)
                        .await
                }
                Engine::ImageMagick => {
                    engines::imagemagick::convert(
                        &input_path,
                        &output_path,
                        &app,
                        &file.id,
                        &options,
                    )
                    .await
                }
            };

            match result {
                Ok(()) => {
                    emit_progress(
                        &app,
                        &file.id,
                        "done",
                        100,
                        None,
                        Some(output_path.to_string_lossy().to_string()),
                    );
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
        if let Err(e) = handle.await {
            log::error!("conversion task join error: {e}");
        }
    }

    let ok = succeeded.load(std::sync::atomic::Ordering::Relaxed);
    let err = failed.load(std::sync::atomic::Ordering::Relaxed);
    let _ = app.emit(
        "batch_complete",
        BatchCompleteEvent { total_files: total, succeeded: ok, failed: err, output_dir },
    );

    Ok(())
}

#[tauri::command]
pub async fn get_default_output_dir() -> Result<String, String> {
    paths::default_output_dir_string()
}
