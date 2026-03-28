use std::path::Path;
use tauri::AppHandle;
use crate::commands::convert::{emit_progress, ConversionOptions};

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
    options: &ConversionOptions,
) -> Result<(), String> {
    emit_progress(app_handle, file_id, "converting", 10, None, None);

    let _ = (input_path, output_path, options);

    Err("Rust PDF engine not yet implemented — falling back to LibreOffice".into())
}
