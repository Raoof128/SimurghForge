use std::fs;
use std::path::{Component, Path, PathBuf};

use super::paths;

/// Align with frontend default (`500 * 1024 * 1024` in `types/conversion.ts`).
pub const MAX_INPUT_FILE_BYTES: u64 = 500 * 1024 * 1024;

/// Matches the settings slider maximum (`Settings.tsx`).
pub const ABSOLUTE_MAX_INPUT_FILE_BYTES: u64 = 2000 * 1024 * 1024;

/// True when the path contains a `..` path component (directory traversal).  
/// Filenames like `file..name.png` are allowed (no `ParentDir` component).
pub fn path_has_parent_dir_component(path: &str) -> bool {
    Path::new(path)
        .components()
        .any(|c| matches!(c, Component::ParentDir))
}

pub fn validate_input(path: &str, max_size: u64) -> Result<PathBuf, String> {
    if path_has_parent_dir_component(path) {
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

/// Only allow safe file extensions (no path separators or control chars).
pub fn sanitize_output_format(fmt: &str) -> Result<String, String> {
    let f = fmt.trim().to_lowercase();
    if f.is_empty() || f.len() > 16 {
        return Err("Invalid output format".into());
    }
    if !f.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err("Invalid output format".into());
    }
    Ok(f)
}

pub fn build_output_path(
    output_dir: &str,
    input_filename: &str,
    output_format: &str,
) -> Result<PathBuf, String> {
    let resolved_dir = paths::expand_tilde(output_dir.trim())?;
    if resolved_dir.trim().is_empty() {
        return Err("Output directory is empty".into());
    }
    let dir = Path::new(&resolved_dir);
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

    let ext = sanitize_output_format(output_format)?;
    let output_file = format!("{clean}.{ext}");
    Ok(dir.join(&output_file))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn parent_dir_detection_allows_double_dot_in_filename() {
        assert!(!path_has_parent_dir_component("photo..edited.png"));
        assert!(path_has_parent_dir_component("../secret.txt"));
        assert!(path_has_parent_dir_component("/tmp/foo/../../etc/passwd"));
    }

    #[test]
    fn test_rejects_traversal() {
        let result = validate_input("../../etc/passwd", MAX_INPUT_FILE_BYTES);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("traversal"));
    }

    #[test]
    fn test_rejects_nonexistent() {
        let result = validate_input("/nonexistent/file.txt", MAX_INPUT_FILE_BYTES);
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
        let result = validate_input(f.path().to_str().unwrap(), MAX_INPUT_FILE_BYTES);
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

    #[test]
    fn test_rejects_bad_extension() {
        let dir = tempfile::tempdir().unwrap();
        let r = build_output_path(dir.path().to_str().unwrap(), "a.txt", "../x");
        assert!(r.is_err());
    }
}
