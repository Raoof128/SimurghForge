use std::path::Path;
use tokio::process::Command;
use tauri::AppHandle;
use crate::commands::convert::{emit_progress, ConversionOptions};

fn find_soffice() -> Result<String, String> {
    let candidates = [
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    ];

    for path in &candidates {
        if Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }

    Err("LibreOffice (soffice) not found. Install via: brew install --cask libreoffice".into())
}

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
    options: &ConversionOptions,
) -> Result<(), String> {
    let _ = options;
    let soffice = find_soffice()?;

    emit_progress(app_handle, file_id, "converting", 20, None, None);

    let output_format = output_path
        .extension()
        .and_then(|e| e.to_str())
        .ok_or("Cannot determine output format")?;

    let output_dir = output_path
        .parent()
        .ok_or("Cannot determine output directory")?;

    let output = Command::new(&soffice)
        .arg("--headless")
        .arg("--convert-to").arg(output_format)
        .arg("--outdir").arg(output_dir)
        .arg(input_path)
        .output()
        .await
        .map_err(|e| format!("Failed to run LibreOffice: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("LibreOffice error: {}", stderr));
    }

    emit_progress(app_handle, file_id, "converting", 90, None, None);

    // LibreOffice names output as <stem>.<format> in outdir — rename if needed
    let lo_output = output_dir.join(format!(
        "{}.{}",
        input_path.file_stem().and_then(|s| s.to_str()).unwrap_or("output"),
        output_format
    ));

    if lo_output != output_path && lo_output.exists() {
        std::fs::rename(&lo_output, output_path)
            .map_err(|e| format!("Failed to rename output: {}", e))?;
    }

    Ok(())
}
