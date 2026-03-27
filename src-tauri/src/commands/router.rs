#[derive(Debug, Clone, PartialEq)]
pub enum Engine {
    ImageMagick,
    FFmpeg,
    LibreOffice,
    Pandoc,
    Pandas,
}

pub fn route(input_type: &str, _output_format: &str) -> Result<Engine, String> {
    match input_type {
        "png" | "jpg" | "jpeg" | "heic" | "svg" | "webp" | "tiff" | "bmp" | "avif" => {
            Ok(Engine::ImageMagick)
        }
        "mp4" | "mov" | "webm" | "avi" | "mp3" | "wav" | "flac" | "ogg" | "aac" | "m4a" | "gif" => {
            Ok(Engine::FFmpeg)
        }
        "csv" | "xlsx" | "json" | "parquet" | "tsv" => {
            Ok(Engine::Pandas)
        }
        "docx" | "odt" | "rtf" | "pdf" => Ok(Engine::LibreOffice),
        "md" | "html" | "txt" => Ok(Engine::Pandoc),
        _ => Err(format!("No engine for input type: {}", input_type)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_image_routing() {
        assert_eq!(route("png", "jpg").unwrap(), Engine::ImageMagick);
        assert_eq!(route("heic", "webp").unwrap(), Engine::ImageMagick);
    }

    #[test]
    fn test_video_routing() {
        assert_eq!(route("mp4", "mp3").unwrap(), Engine::FFmpeg);
        assert_eq!(route("wav", "flac").unwrap(), Engine::FFmpeg);
    }

    #[test]
    fn test_document_routing() {
        assert_eq!(route("docx", "pdf").unwrap(), Engine::LibreOffice);
        assert_eq!(route("md", "html").unwrap(), Engine::Pandoc);
    }

    #[test]
    fn test_data_routing() {
        assert_eq!(route("csv", "json").unwrap(), Engine::Pandas);
        assert_eq!(route("xlsx", "csv").unwrap(), Engine::Pandas);
    }

    #[test]
    fn test_unknown_format() {
        assert!(route("xyz", "pdf").is_err());
    }
}
