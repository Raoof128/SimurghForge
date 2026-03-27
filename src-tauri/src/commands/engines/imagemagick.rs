use std::path::Path;
use tokio::process::Command;
use tauri::AppHandle;
use crate::commands::convert::emit_progress;

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    emit_progress(app_handle, file_id, "converting", 30, None, None);

    let output = Command::new("magick")
        .arg("convert")
        .arg(input_path)
        .arg(output_path)
        .output()
        .await
        .map_err(|e| format!("Failed to run ImageMagick: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ImageMagick error: {}", stderr));
    }

    Ok(())
}
