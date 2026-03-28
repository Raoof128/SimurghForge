use std::path::Path;
use std::process::Stdio;
use tauri::AppHandle;
use tokio::process::Command;
use tokio::io::{AsyncBufReadExt, BufReader};
use crate::commands::convert::{emit_progress, ConversionOptions};

async fn get_duration_us(input_path: &Path) -> Option<u64> {
    let output = Command::new("ffprobe")
        .arg("-v").arg("error")
        .arg("-show_entries").arg("format=duration")
        .arg("-of").arg("csv=p=0")
        .arg(input_path)
        .output()
        .await
        .ok()?;

    let s = String::from_utf8_lossy(&output.stdout);
    let secs: f64 = s.trim().parse().ok()?;
    Some((secs * 1_000_000.0) as u64)
}

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
    options: &ConversionOptions,
) -> Result<(), String> {
    let _ = options;
    emit_progress(app_handle, file_id, "converting", 5, None, None);

    let total_us = get_duration_us(input_path).await;

    let mut child = Command::new("ffmpeg")
        .arg("-y")
        .arg("-i").arg(input_path)
        .arg("-progress").arg("pipe:1")
        .arg("-nostats")
        .arg(output_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn FFmpeg: {}", e))?;

    emit_progress(app_handle, file_id, "converting", 10, None, None);

    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();

        while let Ok(Some(line)) = lines.next_line().await {
            if line.starts_with("out_time_us=") {
                if let Some(total) = total_us {
                    if let Ok(current_us) = line.trim_start_matches("out_time_us=").parse::<u64>() {
                        let pct = ((current_us as f64 / total as f64) * 90.0) as u8 + 10;
                        let clamped = pct.min(99);
                        emit_progress(app_handle, file_id, "converting", clamped, None, None);
                    }
                }
            }
        }
    }

    let status = child.wait().await.map_err(|e| format!("FFmpeg process error: {}", e))?;

    if !status.success() {
        return Err("FFmpeg conversion failed".into());
    }

    Ok(())
}
