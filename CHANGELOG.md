# Changelog

All notable changes to Simurgh Forge are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Raouf: 2026-04-07 (Australia/Sydney)

- **Scope:** Frontend (`src/`), HTML shell, i18n, build tooling; **Rust** (`src-tauri/`).
- **Summary (frontend):** Centralised all UI copy in `src/i18n/strings.ts` for i18n readiness; fixed async Tauri event unlisten race on unmount; corrected retry batch payload by snapshotting the file before reset; added Ctrl+Windows/Linux parity for keyboard shortcuts; improved accessibility (roles, labels, focus, settings backdrop as a real button, toast/queue live regions); aligned settings “About” version with `package.json`; added `esbuild` dev dependency so `vite build` minification works; tightened `main.tsx` root bootstrap and `index.html` meta/theme; enabled `resolveJsonModule` for JSON version import.
- **Summary (Rust):** Added `utils/paths.rs` for portable home resolution and `~/` expansion (Windows `USERPROFILE` / `HOMEDRIVE`+`HOMEPATH`, Unix `HOME`); replaced macOS-only `/usr/bin/open` with the `open` crate for `open_folder`; rejected `..` in `get_file_info` paths; capped batch size (50) and concurrency (1–8) to match the UI and avoid `Semaphore(0)` deadlocks; aligned max input size with the frontend (`500 * 1024 * 1024`); sanitized output extensions in `build_output_path`; clearer semaphore acquire error; default downloads folder via `Path` joins.
- **Files:** `AGENT.md`, `CHANGELOG.md`, `index.html`, `package.json`, `package-lock.json`, `tsconfig.app.json`, `src/main.tsx`, `src/App.tsx`, `src/i18n/strings.ts`, `src/components/*`, `src/hooks/useIPCEvents.ts`, `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`, `src-tauri/src/commands/convert.rs`, `src-tauri/src/utils/mod.rs`, `src-tauri/src/utils/paths.rs`, `src-tauri/src/utils/sanitise.rs`.
- **Verification:** `npm run type-check`, `npm run lint`, `npm run build` (pass); `cargo test` in `src-tauri` (36 tests, pass).
- **Follow-ups:** Consider extracting additional locales from `strings.ts`; optional `React.memo` on queue rows if profiling shows benefit.

### Raouf: 2026-04-07 (Australia/Sydney) — batch conversion & path hardening

- **Scope:** `src-tauri/` (`lib.rs`, `commands/convert.rs`, `utils/sanitise.rs`, `utils/paths.rs`), `src/App.tsx`, `src/types/conversion.ts`.
- **Summary:** Fixed batch forge failing when `outputDir` was still empty (now defaults server-side to `~/Downloads/SimurghForge`); replaced naive `..` substring checks with real `Path` component detection so names like `photo..edit.png` work; `get_file_info` uses the same rule; added optional `maxInputFileBytes` on the batch payload (from settings) with a server cap aligned to the 2000 MB slider; log conversion task join errors; completion banner only when `totalFiles > 0`; shared `paths::default_output_dir_string()` for default dir.
- **Verification:** `cargo test` (37 tests), `npm run type-check`.

## [0.2.0] - 2026-03-28

### Added

- 4 native Rust conversion engines (image, data, audio, PDF)
- Quality controls: preset selector (Low/Medium/High/Lossless) and Advanced panel
- 19 new formats (49 total): AVIF, ICO, CR2, NEF, ePub, LaTeX, PPTX, MKV, OPUS, YAML, TOML, XML, SQLite
- FFmpeg quality arguments: resolution, bitrate, codec (H.264/H.265/VP9), FPS
- Audio quality arguments: bitrate, sample rate, channels
- Image quality arguments: quality %, max dimensions, DPI, strip metadata
- Tiered engine routing: native Rust first, CLI fallback
- Video thumbnail extraction and audio waveform generation
- Pandoc --standalone for proper HTML output
- ESLint, Prettier, rustfmt configuration
- GitHub Actions CI/CD pipeline
- README, LICENSE, CONTRIBUTING, SECURITY, CHANGELOG documentation

### Changed

- Router expanded from 5 to 9 engine variants
- Format map reorganized with Common/More grouping
- Version bumped to 0.2.0 across package.json, Cargo.toml, tauri.conf.json

## [0.1.0] - 2026-03-28

### Added

- Initial release with 5 conversion engines (FFmpeg, ImageMagick, LibreOffice, Pandoc, Pandas)
- Drag-and-drop file input with Tauri native onDragDropEvent
- File browser via Tauri dialog plugin
- Real-time per-file progress bars via Tauri IPC events
- Dark forge theme with amber/gold accent on charcoal background
- JetBrains Mono and IBM Plex Sans typography
- Batch conversion with semaphore-based concurrency (configurable 1-8)
- MIME magic byte detection with extension fallback
- Path sanitization and traversal protection
- Settings panel with output directory, max file size, and concurrency controls
- Settings persistence to ~/.config/simurgh-forge/settings.json
- Keyboard shortcuts: Cmd+O (browse), Cmd+Enter (forge), Cmd+, (settings), Esc (close)
- Completion banner with Open Folder button
- Open File button on converted file cards
- New Batch reset button
- Custom styled format dropdown with portal rendering
- Collapsible drop zone when files are queued
- Toast notifications for skipped unsupported files
- Duplicate file detection by path
- 50-file queue limit
- ARIA roles, labels, and focus-visible rings
- Noise texture overlay and Persian geometric lattice background
- 12 custom keyframe animations
- 14 Rust unit tests

[0.2.0]: https://github.com/Raoof128/SimurghForge/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Raoof128/SimurghForge/releases/tag/v0.1.0
