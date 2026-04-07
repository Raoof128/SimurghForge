#[derive(Debug, Clone, PartialEq)]
pub enum Engine {
    RustImage,   // image crate — PNG, JPG, WebP, AVIF, TIFF, BMP, ICO, GIF
    RustData,    // serde — JSON, YAML, TOML, XML, CSV, TSV
    RustAudio,   // symphonia+hound — any audio → WAV
    RustPdf,     // lopdf — PDF → TXT
    FFmpeg,      // video, audio encode, thumbnails, waveforms
    LibreOffice, // DOCX, PPTX, ODT, RTF, complex PDF
    Pandoc,      // MD, LaTeX, ePub, HTML, TXT markup
    Pandas,      // XLSX, Parquet, SQLite
    ImageMagick, // fallback for images RustImage can't handle (e.g. RAW)
}

pub fn route(input_type: &str, output_format: &str) -> Result<Engine, String> {
    match input_type {
        // Images: try Rust first
        "png" | "jpg" | "jpeg" | "webp" | "avif" | "tiff" | "bmp" | "ico" | "gif" => {
            Ok(Engine::RustImage)
        }
        // RAW camera: ImageMagick (Rust can't handle yet)
        "heic" | "cr2" | "nef" => Ok(Engine::ImageMagick),
        // SVG: ImageMagick
        "svg" => Ok(Engine::ImageMagick),

        // Video: FFmpeg
        "mp4" | "mov" | "webm" | "mkv" | "avi" => Ok(Engine::FFmpeg),

        // Audio: Rust for WAV output, FFmpeg for everything else
        "mp3" | "wav" | "flac" | "ogg" | "aac" | "opus" | "m4a" => {
            if output_format == "wav" {
                Ok(Engine::RustAudio)
            } else {
                Ok(Engine::FFmpeg)
            }
        }

        // PDF: Rust for TXT extraction, LibreOffice for everything else
        "pdf" => {
            if output_format == "txt" {
                Ok(Engine::RustPdf)
            } else {
                Ok(Engine::LibreOffice)
            }
        }

        // Documents: LibreOffice
        "docx" | "odt" | "rtf" | "pptx" => Ok(Engine::LibreOffice),

        // Markup: Pandoc
        "md" | "tex" | "epub" => Ok(Engine::Pandoc),
        "html" | "txt" => Ok(Engine::Pandoc),

        // Data: Rust for JSON/YAML/TOML/XML, Pandas for XLSX/Parquet/SQLite
        "json" | "yaml" | "yml" | "toml" | "xml" => {
            if ["xlsx", "parquet", "sqlite"].contains(&output_format) {
                Ok(Engine::Pandas)
            } else {
                Ok(Engine::RustData)
            }
        }
        "csv" | "tsv" => {
            if ["xlsx", "parquet", "sqlite"].contains(&output_format) {
                Ok(Engine::Pandas)
            } else {
                Ok(Engine::RustData)
            }
        }
        "xlsx" | "parquet" | "sqlite" => Ok(Engine::Pandas),

        _ => Err(format!("No engine for input type: {}", input_type)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rust_image_routing() {
        assert_eq!(route("png", "jpg").unwrap(), Engine::RustImage);
        assert_eq!(route("webp", "png").unwrap(), Engine::RustImage);
        assert_eq!(route("avif", "png").unwrap(), Engine::RustImage);
        assert_eq!(route("ico", "png").unwrap(), Engine::RustImage);
        assert_eq!(route("gif", "png").unwrap(), Engine::RustImage);
    }

    #[test]
    fn test_imagemagick_routing() {
        assert_eq!(route("heic", "jpg").unwrap(), Engine::ImageMagick);
        assert_eq!(route("cr2", "jpg").unwrap(), Engine::ImageMagick);
        assert_eq!(route("nef", "png").unwrap(), Engine::ImageMagick);
        assert_eq!(route("svg", "png").unwrap(), Engine::ImageMagick);
    }

    #[test]
    fn test_video_routing() {
        assert_eq!(route("mp4", "mp3").unwrap(), Engine::FFmpeg);
        assert_eq!(route("mkv", "mp4").unwrap(), Engine::FFmpeg);
        assert_eq!(route("mov", "webm").unwrap(), Engine::FFmpeg);
    }

    #[test]
    fn test_audio_routing_wav_output() {
        assert_eq!(route("mp3", "wav").unwrap(), Engine::RustAudio);
        assert_eq!(route("flac", "wav").unwrap(), Engine::RustAudio);
        assert_eq!(route("ogg", "wav").unwrap(), Engine::RustAudio);
        assert_eq!(route("opus", "wav").unwrap(), Engine::RustAudio);
    }

    #[test]
    fn test_audio_routing_non_wav_output() {
        assert_eq!(route("wav", "mp3").unwrap(), Engine::FFmpeg);
        assert_eq!(route("flac", "mp3").unwrap(), Engine::FFmpeg);
        assert_eq!(route("mp3", "flac").unwrap(), Engine::FFmpeg);
        assert_eq!(route("m4a", "mp3").unwrap(), Engine::FFmpeg);
    }

    #[test]
    fn test_pdf_routing() {
        assert_eq!(route("pdf", "txt").unwrap(), Engine::RustPdf);
        assert_eq!(route("pdf", "docx").unwrap(), Engine::LibreOffice);
    }

    #[test]
    fn test_document_routing() {
        assert_eq!(route("docx", "pdf").unwrap(), Engine::LibreOffice);
        assert_eq!(route("pptx", "pdf").unwrap(), Engine::LibreOffice);
        assert_eq!(route("odt", "pdf").unwrap(), Engine::LibreOffice);
        assert_eq!(route("rtf", "pdf").unwrap(), Engine::LibreOffice);
    }

    #[test]
    fn test_markup_routing() {
        assert_eq!(route("md", "html").unwrap(), Engine::Pandoc);
        assert_eq!(route("tex", "pdf").unwrap(), Engine::Pandoc);
        assert_eq!(route("epub", "pdf").unwrap(), Engine::Pandoc);
        assert_eq!(route("html", "pdf").unwrap(), Engine::Pandoc);
        assert_eq!(route("txt", "pdf").unwrap(), Engine::Pandoc);
    }

    #[test]
    fn test_data_routing_rust() {
        assert_eq!(route("json", "yaml").unwrap(), Engine::RustData);
        assert_eq!(route("yaml", "json").unwrap(), Engine::RustData);
        assert_eq!(route("toml", "json").unwrap(), Engine::RustData);
        assert_eq!(route("xml", "json").unwrap(), Engine::RustData);
        assert_eq!(route("csv", "json").unwrap(), Engine::RustData);
        assert_eq!(route("tsv", "csv").unwrap(), Engine::RustData);
    }

    #[test]
    fn test_data_routing_pandas() {
        assert_eq!(route("csv", "xlsx").unwrap(), Engine::Pandas);
        assert_eq!(route("json", "parquet").unwrap(), Engine::Pandas);
        assert_eq!(route("csv", "sqlite").unwrap(), Engine::Pandas);
        assert_eq!(route("xlsx", "csv").unwrap(), Engine::Pandas);
        assert_eq!(route("parquet", "json").unwrap(), Engine::Pandas);
        assert_eq!(route("sqlite", "csv").unwrap(), Engine::Pandas);
    }

    #[test]
    fn test_unknown_format() {
        assert!(route("xyz", "pdf").is_err());
    }
}
