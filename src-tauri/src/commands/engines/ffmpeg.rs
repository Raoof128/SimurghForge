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

/// Check if this is a video thumbnail extraction (video input -> image output).
fn is_video_thumbnail(input_path: &Path, output_path: &Path) -> bool {
    let input_ext = input_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    let output_ext = output_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let video_exts = ["mp4", "mov", "webm", "mkv", "avi"];
    let image_exts = ["jpg", "jpeg", "png"];

    video_exts.contains(&input_ext.as_str()) && image_exts.contains(&output_ext.as_str())
}

/// Check if this is an audio waveform generation (audio input -> image output).
fn is_audio_waveform(input_path: &Path, output_path: &Path) -> bool {
    let input_ext = input_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    let output_ext = output_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    let audio_exts = ["mp3", "wav", "flac", "ogg", "aac", "opus", "m4a"];
    let image_exts = ["png", "jpg", "jpeg"];

    audio_exts.contains(&input_ext.as_str()) && image_exts.contains(&output_ext.as_str())
}

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
    options: &ConversionOptions,
) -> Result<(), String> {
    emit_progress(app_handle, file_id, "converting", 5, None, None);

    // Special case: video thumbnail extraction
    if is_video_thumbnail(input_path, output_path) {
        return convert_thumbnail(input_path, output_path, app_handle, file_id).await;
    }

    // Special case: audio waveform generation
    if is_audio_waveform(input_path, output_path) {
        return convert_waveform(input_path, output_path, app_handle, file_id).await;
    }

    let total_us = get_duration_us(input_path).await;

    let mut cmd = Command::new("ffmpeg");
    cmd.arg("-y").arg("-i").arg(input_path);

    // Apply video options
    if let Some(ref vid) = options.video {
        if let Some(ref res) = vid.resolution {
            let scale = match res.as_str() {
                "720p" => "1280:720",
                "1080p" => "1920:1080",
                "1440p" => "2560:1440",
                "4k" => "3840:2160",
                _ => "", // "original" = no scale
            };
            if !scale.is_empty() {
                cmd.arg("-vf").arg(format!("scale={}", scale));
            }
        }
        if let Some(bitrate) = vid.bitrate {
            cmd.arg("-b:v").arg(format!("{}k", bitrate));
        }
        if let Some(ref codec) = vid.codec {
            let c = match codec.as_str() {
                "h264" => "libx264",
                "h265" => "libx265",
                "vp9" => "libvpx-vp9",
                _ => "libx264",
            };
            cmd.arg("-c:v").arg(c);
        }
        if let Some(fps) = vid.fps {
            cmd.arg("-r").arg(fps.to_string());
        }
    }

    // Apply audio options
    if let Some(ref aud) = options.audio {
        if let Some(bitrate) = aud.bitrate {
            cmd.arg("-b:a").arg(format!("{}k", bitrate));
        }
        if let Some(rate) = aud.sample_rate {
            cmd.arg("-ar").arg(rate.to_string());
        }
        if let Some(ch) = aud.channels {
            cmd.arg("-ac").arg(ch.to_string());
        }
    }

    cmd.arg("-progress").arg("pipe:1")
       .arg("-nostats")
       .arg(output_path);

    let mut child = cmd
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

/// Extract a single thumbnail frame from a video file.
async fn convert_thumbnail(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    emit_progress(app_handle, file_id, "converting", 20, None, None);

    let output = Command::new("ffmpeg")
        .arg("-y")
        .arg("-i").arg(input_path)
        .arg("-ss").arg("00:00:01")
        .arg("-frames:v").arg("1")
        .arg(output_path)
        .output()
        .await
        .map_err(|e| format!("Failed to spawn FFmpeg: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg thumbnail error: {}", stderr));
    }

    emit_progress(app_handle, file_id, "converting", 95, None, None);
    Ok(())
}

/// Generate a waveform image from an audio file.
async fn convert_waveform(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    emit_progress(app_handle, file_id, "converting", 20, None, None);

    let output = Command::new("ffmpeg")
        .arg("-y")
        .arg("-i").arg(input_path)
        .arg("-filter_complex").arg("showwavespic=s=800x200:colors=#E8A33E")
        .arg("-frames:v").arg("1")
        .arg(output_path)
        .output()
        .await
        .map_err(|e| format!("Failed to spawn FFmpeg: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("FFmpeg waveform error: {}", stderr));
    }

    emit_progress(app_handle, file_id, "converting", 95, None, None);
    Ok(())
}
