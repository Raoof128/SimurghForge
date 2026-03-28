# Changelog

All notable changes to Simurgh Forge are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
