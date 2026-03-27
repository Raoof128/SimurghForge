use std::path::Path;
use tokio::process::Command;
use tauri::AppHandle;
use crate::commands::convert::emit_progress;

fn find_script() -> Result<String, String> {
    let candidates = [
        "scripts/pandas_convert.py",
        "../scripts/pandas_convert.py",
    ];

    for path in &candidates {
        if Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }

    // Try via CARGO_MANIFEST_DIR (dev mode)
    if let Ok(manifest) = std::env::var("CARGO_MANIFEST_DIR") {
        let dev_path = Path::new(&manifest).parent().unwrap().join("scripts/pandas_convert.py");
        if dev_path.exists() {
            return Ok(dev_path.to_string_lossy().to_string());
        }
    }

    Err("pandas_convert.py script not found".into())
}

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    let script = find_script()?;

    emit_progress(app_handle, file_id, "converting", 20, None, None);

    let output = Command::new("python3")
        .arg(&script)
        .arg(input_path)
        .arg(output_path)
        .output()
        .await
        .map_err(|e| format!("Failed to run Python: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Pandas error: {}", stderr));
    }

    Ok(())
}
