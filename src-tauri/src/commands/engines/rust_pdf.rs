use crate::commands::convert::{emit_progress, ConversionOptions};
use std::fs;
use std::path::Path;
use tauri::AppHandle;

/// Native Rust PDF engine using lopdf.
///
/// Capabilities:
/// - PDF -> TXT: extract text from PDF pages
///
/// For all other conversions (PDF -> DOCX, PDF -> HTML, anything -> PDF),
/// this engine falls back to LibreOffice.
pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
    options: &ConversionOptions,
) -> Result<(), String> {
    let input_ext = input_path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let output_ext = output_path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();

    // We only handle PDF -> TXT natively
    if input_ext == "pdf" && output_ext == "txt" {
        return extract_pdf_text(input_path, output_path, app_handle, file_id, options).await;
    }

    // Everything else falls back to LibreOffice
    Err("Use LibreOffice engine for this PDF conversion".into())
}

async fn extract_pdf_text(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
    _options: &ConversionOptions,
) -> Result<(), String> {
    // Clone paths for the blocking task
    let input_path = input_path.to_path_buf();
    let output_path = output_path.to_path_buf();
    let app_handle = app_handle.clone();
    let file_id = file_id.to_string();

    tokio::task::spawn_blocking(move || {
        extract_text_blocking(&input_path, &output_path, &app_handle, &file_id)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

fn extract_text_blocking(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    emit_progress(app_handle, file_id, "converting", 10, None, None);

    let doc = lopdf::Document::load(input_path).map_err(|e| format!("Cannot open PDF: {}", e))?;

    emit_progress(app_handle, file_id, "converting", 30, None, None);

    let pages = doc.get_pages();
    let total_pages = pages.len();

    if total_pages == 0 {
        // Empty PDF, write empty file
        fs::write(output_path, "").map_err(|e| format!("Write error: {}", e))?;
        return Ok(());
    }

    let mut text = String::new();

    // Collect and sort page numbers (BTreeMap already sorted, but let's be explicit)
    let page_numbers: Vec<u32> = pages.keys().copied().collect();

    for (i, &page_num) in page_numbers.iter().enumerate() {
        let page_text = doc.extract_text(&[page_num]).unwrap_or_default();

        if !page_text.trim().is_empty() {
            if !text.is_empty() {
                text.push_str("\n\n--- Page ");
                text.push_str(&page_num.to_string());
                text.push_str(" ---\n\n");
            }
            text.push_str(&page_text);
        }

        // Report progress: 30% to 90% range across pages
        let progress = if total_pages > 1 {
            30 + ((i as u64 * 60) / (total_pages as u64 - 1).max(1)) as u8
        } else {
            90
        };
        emit_progress(app_handle, file_id, "converting", progress.min(90), None, None);
    }

    emit_progress(app_handle, file_id, "converting", 90, None, None);

    // If no text was extracted, still write the file (could be a scanned/image PDF)
    if text.is_empty() {
        text = String::from("[No extractable text found - this may be a scanned/image-based PDF]");
    }

    fs::write(output_path, &text).map_err(|e| format!("Write error: {}", e))?;

    emit_progress(app_handle, file_id, "converting", 95, None, None);
    Ok(())
}
