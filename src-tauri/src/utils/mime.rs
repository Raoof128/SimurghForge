use std::path::Path;
use std::fs::File;
use std::io::Read;

pub fn detect_type(path: &Path) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| format!("Cannot open file: {}", e))?;
    let mut header = [0u8; 16];
    let bytes_read = file.read(&mut header).map_err(|e| format!("Cannot read file: {}", e))?;

    if bytes_read < 4 {
        return extension_fallback(path);
    }

    match &header[..4] {
        [0x25, 0x50, 0x44, 0x46] => Ok("pdf".into()),
        [0x89, 0x50, 0x4E, 0x47] => Ok("png".into()),
        [0xFF, 0xD8, 0xFF, _] => Ok("jpg".into()),
        [0x47, 0x49, 0x46, 0x38] => Ok("gif".into()),
        [0x52, 0x49, 0x46, 0x46] => {
            if bytes_read >= 12 {
                match &header[8..12] {
                    [0x57, 0x41, 0x56, 0x45] => Ok("wav".into()),
                    [0x41, 0x56, 0x49, 0x20] => Ok("avi".into()),
                    [0x57, 0x45, 0x42, 0x50] => Ok("webp".into()),
                    _ => extension_fallback(path),
                }
            } else {
                extension_fallback(path)
            }
        }
        [0x50, 0x4B, 0x03, 0x04] => extension_fallback(path), // ZIP-based: use extension
        [0x66, 0x4C, 0x61, 0x43] => Ok("flac".into()),
        [0x4F, 0x67, 0x67, 0x53] => Ok("ogg".into()),
        _ if bytes_read >= 8 && &header[4..8] == b"ftyp" => {
            if bytes_read >= 12 {
                match &header[8..12] {
                    b"qt  " => Ok("mov".into()),
                    _ => Ok("mp4".into()),
                }
            } else {
                Ok("mp4".into())
            }
        }
        [0x49, 0x44, 0x33, _] => Ok("mp3".into()),
        [0xFF, 0xFB, _, _] | [0xFF, 0xFA, _, _] => Ok("mp3".into()),
        _ => extension_fallback(path),
    }
}

fn extension_fallback(path: &Path) -> Result<String, String> {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .ok_or_else(|| "Unknown file type".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn write_temp(ext: &str, bytes: &[u8]) -> tempfile::NamedTempFile {
        let mut f = tempfile::Builder::new()
            .suffix(&format!(".{}", ext))
            .tempfile()
            .unwrap();
        f.write_all(bytes).unwrap();
        f.flush().unwrap();
        f
    }

    #[test]
    fn test_detect_png() {
        let f = write_temp("png", &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        assert_eq!(detect_type(f.path()).unwrap(), "png");
    }

    #[test]
    fn test_detect_jpg() {
        let f = write_temp("jpg", &[0xFF, 0xD8, 0xFF, 0xE0]);
        assert_eq!(detect_type(f.path()).unwrap(), "jpg");
    }

    #[test]
    fn test_detect_pdf() {
        let f = write_temp("pdf", b"%PDF-1.4 test content");
        assert_eq!(detect_type(f.path()).unwrap(), "pdf");
    }

    #[test]
    fn test_extension_fallback() {
        let f = write_temp("csv", b"name,age\nAlice,30");
        assert_eq!(detect_type(f.path()).unwrap(), "csv");
    }
}
