use std::path::{Path, PathBuf};
use std::fs;

pub fn validate_input(path: &str, max_size: u64) -> Result<PathBuf, String> {
    if path.contains("..") {
        return Err("Path traversal detected".into());
    }

    let canonical = fs::canonicalize(path)
        .map_err(|e| format!("Invalid path '{}': {}", path, e))?;

    if !canonical.is_file() {
        return Err(format!("Not a file: {}", canonical.display()));
    }

    let metadata = fs::metadata(&canonical)
        .map_err(|e| format!("Cannot read metadata: {}", e))?;
    if metadata.len() > max_size {
        return Err(format!(
            "File too large: {} bytes (max: {} bytes)",
            metadata.len(),
            max_size
        ));
    }

    Ok(canonical)
}

pub fn build_output_path(
    output_dir: &str,
    input_filename: &str,
    output_format: &str,
) -> Result<PathBuf, String> {
    let dir = Path::new(output_dir);
    fs::create_dir_all(dir).map_err(|e| format!("Cannot create output dir: {}", e))?;

    let stem = Path::new(input_filename)
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or("Invalid filename")?;

    let clean: String = stem
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_' || *c == '.' || *c == ' ')
        .collect();

    if clean.is_empty() {
        return Err("Filename is empty after sanitization".into());
    }

    let output_file = format!("{}.{}", clean, output_format);
    Ok(dir.join(&output_file))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_rejects_traversal() {
        let result = validate_input("../../etc/passwd", 500_000_000);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("traversal"));
    }

    #[test]
    fn test_rejects_nonexistent() {
        let result = validate_input("/nonexistent/file.txt", 500_000_000);
        assert!(result.is_err());
    }

    #[test]
    fn test_rejects_oversized() {
        let mut f = tempfile::NamedTempFile::new().unwrap();
        f.write_all(&[0u8; 1024]).unwrap();
        f.flush().unwrap();
        let result = validate_input(f.path().to_str().unwrap(), 100);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("too large"));
    }

    #[test]
    fn test_valid_file_passes() {
        let mut f = tempfile::NamedTempFile::new().unwrap();
        f.write_all(b"hello").unwrap();
        f.flush().unwrap();
        let result = validate_input(f.path().to_str().unwrap(), 500_000_000);
        assert!(result.is_ok());
    }

    #[test]
    fn test_build_output_path() {
        let dir = tempfile::tempdir().unwrap();
        let result = build_output_path(dir.path().to_str().unwrap(), "my_file.docx", "pdf");
        assert!(result.is_ok());
        let path = result.unwrap();
        assert!(path.to_str().unwrap().ends_with("my_file.pdf"));
    }
}
