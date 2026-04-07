# Security policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.2.x   | Yes       |
| 0.1.x   | No        |

## Reporting a vulnerability

**Do not open a public GitHub issue for undisclosed security vulnerabilities.**

Email **simurghforge@proton.me** with:

- Description of the issue and affected component (frontend, Rust IPC, specific engine)
- Steps to reproduce
- Impact assessment (confidentiality, integrity, availability)
- Suggested fix or patch (optional)

For **non-security** bugs or feature requests, use [GitHub Issues](https://github.com/Raoof128/SimurghForge/issues) normally.

### Response timeline

- **48 hours** — acknowledgment
- **7 days** — initial assessment and severity
- **30 days** — target fix and release for confirmed issues (complex cases may take longer; we will communicate)

## Security controls (implementation)

**Input and paths**

- MIME sniffing uses file headers where possible, not only extensions.
- Path traversal is mitigated by **rejecting `..` path components** (Rust `std::path::Component::ParentDir`), canonicalising inputs, and validating output extensions.
- Filenames containing consecutive dots (e.g. `photo..edit.png`) are **not** treated as traversal.
- Per-file size limits enforced in Rust; optional client-provided cap aligned with settings (bounded server-side).

**Process invocation**

- External tools (FFmpeg, LibreOffice, Pandoc, etc.) are invoked with `Command::arg(...)` / structured arguments — **no** shell string interpolation of user paths.

**Application**

- Tauri v2 capability-based permissions (`src-tauri/capabilities/default.json`).
- Local-first: no cloud dependency for conversion.
- Settings stored under the user config directory.

## Scope

**In scope**

- Path traversal, arbitrary file read/write via IPC or paths
- Command injection via filenames, options, or environment controlled by the app
- Memory safety issues in the Rust codebase
- IPC abuse or capability bypass in Tauri configuration

**Out of scope**

- Vulnerabilities in upstream third-party binaries (FFmpeg, LibreOffice, Pandoc, ImageMagick, Python packages) — report those to upstream vendors
- Physical access, malware, or social engineering
- Denial-of-service via large but legitimate files within documented limits

## Coordinated disclosure

We appreciate responsible disclosure and will credit reporters who wish to be named (unless anonymity is requested).
