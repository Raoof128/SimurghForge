use std::path::Path;
use std::fs;
use image::{DynamicImage, ImageFormat, imageops::FilterType};
use tauri::AppHandle;
use crate::commands::convert::{emit_progress, ConversionOptions};

/// Detect the image format from a file extension.
fn detect_image_format(path: &Path) -> Result<ImageFormat, String> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .ok_or_else(|| "No file extension".to_string())?;

    match ext.as_str() {
        "png" => Ok(ImageFormat::Png),
        "jpg" | "jpeg" => Ok(ImageFormat::Jpeg),
        "gif" => Ok(ImageFormat::Gif),
        "webp" => Ok(ImageFormat::WebP),
        "tiff" | "tif" => Ok(ImageFormat::Tiff),
        "bmp" => Ok(ImageFormat::Bmp),
        "ico" => Ok(ImageFormat::Ico),
        "avif" => Ok(ImageFormat::Avif),
        _ => Err(format!("Unsupported image format: {}", ext)),
    }
}

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
    options: &ConversionOptions,
) -> Result<(), String> {
    emit_progress(app_handle, file_id, "converting", 10, None, None);

    // Load image
    let mut img: DynamicImage = image::open(input_path)
        .map_err(|e| format!("Cannot open image: {}", e))?;

    emit_progress(app_handle, file_id, "converting", 30, None, None);

    // Apply resize if options specify max dimensions
    if let Some(ref img_opts) = options.image {
        let (w, h) = (img.width(), img.height());
        let max_w = img_opts.max_width.unwrap_or(w);
        let max_h = img_opts.max_height.unwrap_or(h);

        if w > max_w || h > max_h {
            img = img.resize(max_w, max_h, FilterType::Lanczos3);
        }
    }

    emit_progress(app_handle, file_id, "converting", 60, None, None);

    // Determine output format
    let out_format = detect_image_format(output_path)?;
    let quality = options
        .image
        .as_ref()
        .and_then(|o| o.quality)
        .unwrap_or(95);

    // Ensure parent directory exists
    if let Some(parent) = output_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Cannot create output dir: {}", e))?;
    }

    // Save based on format
    match out_format {
        ImageFormat::Jpeg => {
            let file =
                fs::File::create(output_path).map_err(|e| format!("Cannot create file: {}", e))?;
            let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(file, quality);
            img.write_with_encoder(encoder)
                .map_err(|e| format!("JPEG encode error: {}", e))?;
        }
        ImageFormat::WebP => {
            // image 0.25 supports WebP writing natively
            img.save(output_path)
                .map_err(|e| format!("WebP save error: {}", e))?;
        }
        ImageFormat::Avif => {
            // image 0.25 with ravif supports AVIF writing natively
            img.save(output_path)
                .map_err(|e| format!("AVIF save error: {}", e))?;
        }
        _ => {
            img.save(output_path)
                .map_err(|e| format!("Image save error: {}", e))?;
        }
    }

    emit_progress(app_handle, file_id, "converting", 95, None, None);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_format_png() {
        let fmt = detect_image_format(Path::new("test.png")).unwrap();
        assert_eq!(fmt, ImageFormat::Png);
    }

    #[test]
    fn test_detect_format_jpg() {
        let fmt = detect_image_format(Path::new("photo.jpg")).unwrap();
        assert_eq!(fmt, ImageFormat::Jpeg);
    }

    #[test]
    fn test_detect_format_jpeg() {
        let fmt = detect_image_format(Path::new("photo.jpeg")).unwrap();
        assert_eq!(fmt, ImageFormat::Jpeg);
    }

    #[test]
    fn test_detect_format_webp() {
        let fmt = detect_image_format(Path::new("image.webp")).unwrap();
        assert_eq!(fmt, ImageFormat::WebP);
    }

    #[test]
    fn test_detect_format_avif() {
        let fmt = detect_image_format(Path::new("image.avif")).unwrap();
        assert_eq!(fmt, ImageFormat::Avif);
    }

    #[test]
    fn test_detect_format_unsupported() {
        let result = detect_image_format(Path::new("file.xyz"));
        assert!(result.is_err());
    }

    #[test]
    fn test_detect_format_no_extension() {
        let result = detect_image_format(Path::new("noext"));
        assert!(result.is_err());
    }
}
