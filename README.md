# Simurgh Forge

**Universal file converter for macOS. 49 formats. 9 engines. Zero cloud.**

![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![Rust](https://img.shields.io/badge/rust-1.77%2B-orange)
![TypeScript](https://img.shields.io/badge/typescript-6.0-blue)
![Formats](https://img.shields.io/badge/formats-49-green)

Simurgh Forge is a local-first macOS desktop application that converts any file to any compatible format in batch with real-time per-file progress. Built with Tauri v2 (Rust backend) and React (TypeScript frontend). No network required. No subscription. Ships as a single `.app` bundle.

---

## Features

- **49 supported formats** across images, documents, audio, video, and structured data
- **9 conversion engines** -- 4 native Rust + 5 CLI-based, with automatic tiered routing
- **Quality controls** -- Simple presets (Low/Medium/High/Lossless) with an Advanced panel exposing per-format settings
- **Batch conversion** -- Drop up to 50 files, convert concurrently with configurable thread count (1-8)
- **Real-time progress** -- Per-file progress bars with FFmpeg providing true percentage tracking
- **Drag-and-drop + Browse** -- Native file drop via Tauri API, plus a file browser dialog
- **Open converted files** -- Click to open output files directly in the system default application
- **Dark forge aesthetic** -- Amber/gold on charcoal with JetBrains Mono typography, molten progress animations, and Persian geometric patterns
- **Keyboard shortcuts** -- Cmd+O (browse), Cmd+Enter (forge all), Cmd+, (settings), Esc (close)
- **Settings persistence** -- Output directory, max file size, and concurrency saved across sessions

---

## Supported Formats

### Images

| Input | Output | Engine |
|-------|--------|--------|
| PNG, JPG, WebP, AVIF, TIFF, BMP, ICO, GIF | Any of these | Rust `image` crate |
| HEIC, CR2, NEF, SVG | JPG, PNG, WebP, TIFF | ImageMagick |

### Documents

| Input | Output | Engine |
|-------|--------|--------|
| DOCX, ODT, RTF, PPTX | PDF, TXT, HTML | LibreOffice Headless |
| MD, HTML, TXT, LaTeX | PDF, HTML, DOCX, ePub | Pandoc (+ LibreOffice for PDF) |
| PDF | TXT | Rust `lopdf` |
| PDF | DOCX, HTML | LibreOffice Headless |

### Audio and Video

| Input | Output | Engine |
|-------|--------|--------|
| MP4, MOV, WebM, MKV, AVI | MP4, WebM, MKV, MOV, AVI, GIF | FFmpeg |
| MP4, MOV, WebM, MKV, AVI | MP3, WAV (audio extract) | FFmpeg |
| MP3, WAV, FLAC, OGG, AAC, OPUS, M4A | WAV | Rust `symphonia` + `hound` |
| MP3, WAV, FLAC, OGG, AAC, OPUS, M4A | MP3, FLAC, OGG, AAC, OPUS | FFmpeg |

### Data

| Input | Output | Engine |
|-------|--------|--------|
| JSON, YAML, TOML, XML | Any of these, plus CSV/TSV | Rust `serde` ecosystem |
| CSV, TSV | JSON, YAML, TOML, XML | Rust `serde` + `csv` |
| CSV, JSON, XLSX, Parquet, TSV, SQLite | Any of these | Python Pandas |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| App Shell | Tauri v2 (Rust) |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Image Processing | Rust `image` + `ravif` crate |
| Audio Processing | Rust `symphonia` + `hound` |
| PDF Processing | Rust `lopdf` |
| Data Processing | Rust `serde_yaml` + `toml` + `quick-xml` + `csv` |
| Video/Audio Encoding | FFmpeg (CLI) |
| Document Conversion | LibreOffice Headless + Pandoc (CLI) |
| Tabular Data | Python Pandas (CLI) |

---

## Architecture

Simurgh Forge uses a three-tier engine architecture:

1. **Native Rust** (fastest, zero external deps) -- image conversion, audio decoding to WAV, PDF text extraction, JSON/YAML/TOML/XML/CSV data transforms
2. **CLI Tools** (feature-rich) -- FFmpeg for video and audio encoding, LibreOffice for Office documents, Pandoc for markup and ePub
3. **Python** (tabular data) -- Pandas for XLSX, Parquet, and SQLite

The router automatically selects the best engine for each conversion. Native Rust is preferred; CLI tools are used when Rust crates cannot handle the format.

```
Frontend (React)
    |
    | Tauri IPC (invoke + emit)
    v
Rust Backend (lib.rs)
    |
    +-- router.rs (MIME type -> engine selection)
    +-- convert.rs (batch orchestrator, Tokio semaphore)
    +-- engines/
    |     +-- rust_image.rs    (image crate)
    |     +-- rust_audio.rs    (symphonia + hound)
    |     +-- rust_data.rs     (serde ecosystem)
    |     +-- rust_pdf.rs      (lopdf)
    |     +-- ffmpeg.rs        (FFmpeg CLI)
    |     +-- libreoffice.rs   (soffice CLI)
    |     +-- pandoc.rs        (pandoc CLI)
    |     +-- pandas.rs        (python3 CLI)
    |     +-- imagemagick.rs   (magick CLI)
    +-- utils/
          +-- mime.rs          (magic byte detection)
          +-- sanitise.rs      (path validation)
```

---

## Getting Started

### Prerequisites

- macOS 12+
- [Rust](https://rustup.rs/) 1.77+
- [Node.js](https://nodejs.org/) 22+
- [Homebrew](https://brew.sh/)

### Install System Dependencies

```bash
brew install ffmpeg imagemagick pandoc
brew install --cask libreoffice
pip3 install pillow pandas openpyxl pyarrow
```

### Clone and Run

```bash
git clone https://github.com/Raoof128/SimurghForge.git
cd SimurghForge
npm install
npm run tauri dev
```

### Build for Production

```bash
npm run tauri build
```

The `.app` bundle is output to `src-tauri/target/release/bundle/macos/`.

---

## Quality Controls

Each file in the queue can be configured with quality settings:

**Presets** (one click):

| Preset | Image | Video | Audio |
|--------|-------|-------|-------|
| Low | 60%, 1024px max | 720p, 1 Mbps | 128 kbps |
| Medium | 80%, 2048px max | 1080p, 5 Mbps | 192 kbps |
| High | 95%, original | Original, 15 Mbps | 320 kbps |
| Lossless | 100%, original | Original, lossless | 1411 kbps |

**Advanced** (per-format controls): quality %, max dimensions, DPI, strip metadata, resolution, bitrate, codec (H.264/H.265/VP9), FPS, sample rate, channels, compression level, pretty-print, delimiter, encoding.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+O | Browse files |
| Cmd+Enter | Forge all queued files |
| Cmd+, | Open settings |
| Esc | Close settings |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and pull request guidelines.

## Security

See [SECURITY.md](SECURITY.md) for the vulnerability reporting process.

## License

[MIT](LICENSE) -- Raouf Abedini, 2026
