# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.2.x   | Yes       |
| 0.1.x   | No        |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email **simurghforge@proton.me** with:

- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

### Response Timeline

- **48 hours** -- acknowledgment of report
- **7 days** -- initial assessment and severity classification
- **30 days** -- fix development and release (for confirmed vulnerabilities)

## Security Measures

Simurgh Forge implements the following security controls:

**Input validation:**
- MIME type detection via file header magic bytes (not extension-only)
- Path sanitization with traversal rejection (`../` sequences blocked)
- Canonical path resolution before any file operations
- File size limits (configurable, default 500 MB)

**Process isolation:**
- All subprocess calls use `.arg()` chaining -- never string interpolation or shell expansion
- No user-controlled data is interpolated into command strings
- Output directory is validated and created before write operations

**Application security:**
- Tauri v2 capability-based permissions model
- No network access required -- all processing is local
- Settings stored in user-local config directory

## Scope

The following are considered in-scope for security reports:

- Command injection via filenames or paths
- Path traversal allowing reads/writes outside designated directories
- MIME type spoofing bypassing safety checks
- Memory safety issues in Rust backend
- Privilege escalation via Tauri IPC

Out of scope:

- Vulnerabilities in system dependencies (FFmpeg, LibreOffice, Pandoc)
- Physical access attacks
- Social engineering
