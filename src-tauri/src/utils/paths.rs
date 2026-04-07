//! Cross-platform home directory and `~/` expansion for config paths and shell-open.

use std::path::{Path, PathBuf};

/// Resolve the current user's home directory (macOS/Linux `HOME`, Windows `USERPROFILE` / `HOMEDRIVE`+`HOMEPATH`).
pub fn home_dir() -> Result<PathBuf, String> {
    if let Ok(h) = std::env::var("HOME") {
        if !h.is_empty() {
            return Ok(PathBuf::from(h));
        }
    }
    if let Ok(h) = std::env::var("USERPROFILE") {
        if !h.is_empty() {
            return Ok(PathBuf::from(h));
        }
    }
    #[cfg(windows)]
    {
        let drive = std::env::var("HOMEDRIVE").unwrap_or_default();
        let path = std::env::var("HOMEPATH").unwrap_or_default();
        if !drive.is_empty() && !path.is_empty() {
            return Ok(PathBuf::from(format!("{drive}{path}")));
        }
    }
    Err("Could not determine user home directory".into())
}

/// Expand a leading `~/` to the user home directory. Other paths are returned unchanged.
pub fn expand_tilde(path: &str) -> Result<String, String> {
    if let Some(rest) = path.strip_prefix("~/") {
        let home = home_dir()?;
        let joined = home.join(rest);
        return Ok(joined.to_string_lossy().into_owned());
    }
    Ok(path.to_string())
}

/// Default output folder: `~/Downloads/SimurghForge` (matches `get_default_output_dir` command).
pub fn default_output_dir_string() -> Result<String, String> {
    let home = home_dir()?;
    Ok(home
        .join("Downloads")
        .join("SimurghForge")
        .to_string_lossy()
        .into_owned())
}

/// Best-effort open of a file or folder with the system default handler (Finder, Explorer, xdg-open, …).
pub fn reveal_in_os(path: &Path) -> Result<(), String> {
    open::that(path).map_err(|e| format!("Cannot open path: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn expand_tilde_roundtrip_smoke() {
        let Ok(home) = home_dir() else {
            // CI or sandbox without home
            return;
        };
        let s = format!("~/");
        let expanded = expand_tilde(&s).expect("expand");
        assert!(Path::new(&expanded).starts_with(&home));
    }
}
