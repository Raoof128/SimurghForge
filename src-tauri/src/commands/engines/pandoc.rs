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
    let output_format = output_path
        .extension()
        .and_then(|e| e.to_str())
        .ok_or("Cannot determine output format")?;

    emit_progress(app_handle, file_id, "converting", 10, None, None);

    if output_format == "pdf" {
        convert_via_libreoffice(input_path, output_path, app_handle, file_id).await
    } else {
        convert_direct(input_path, output_path, app_handle, file_id).await
    }
}

async fn convert_direct(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    let output = Command::new("pandoc")
        .arg(input_path)
        .arg("-o").arg(output_path)
        .output()
        .await
        .map_err(|e| format!("Failed to run Pandoc: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Pandoc error: {}", stderr));
    }

    emit_progress(app_handle, file_id, "converting", 90, None, None);
    Ok(())
}

async fn convert_via_libreoffice(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    // Step 1: Pandoc → temp DOCX
    let temp_dir = std::env::temp_dir();
    let temp_docx = temp_dir.join(format!("simurgh_pandoc_{}.docx", file_id));

    let pandoc_output = Command::new("pandoc")
        .arg(input_path)
        .arg("-o").arg(&temp_docx)
        .output()
        .await
        .map_err(|e| format!("Failed to run Pandoc: {}", e))?;

    if !pandoc_output.status.success() {
        let stderr = String::from_utf8_lossy(&pandoc_output.stderr);
        return Err(format!("Pandoc error: {}", stderr));
    }

    emit_progress(app_handle, file_id, "converting", 50, None, None);

    // Step 2: LibreOffice temp DOCX → PDF
    let result = super::libreoffice::convert(
        &temp_docx,
        output_path,
        app_handle,
        file_id,
    ).await;

    // Cleanup temp
    let _ = std::fs::remove_file(&temp_docx);

    result
}
