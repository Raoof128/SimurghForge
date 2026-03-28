# Simurgh Forge Engine Overhaul — Design Document

**Date:** 2026-03-28
**Author:** Raouf Abedini
**Status:** Approved

---

## 1. Architecture: Three-Tier Engines

| Tier | Engine | Formats | Rationale |
|---|---|---|---|
| Native Rust | `image` + `ravif` + `rawloader` | PNG, JPG, WebP, AVIF, TIFF, BMP, ICO, GIF, CR2, NEF | Zero deps, fast, full quality control |
| Native Rust | `symphonia` + `hound` | WAV, FLAC, OGG decode | Fast audio decoding |
| Native Rust | `lopdf` + `printpdf` | Simple PDF read/write | No LibreOffice needed for basic PDF |
| Native Rust | `serde` family | JSON, YAML, TOML, XML, CSV, TSV | Already in ecosystem |
| CLI (kept) | FFmpeg | All video, MP3/AAC/OPUS encode, MKV, thumbnails, waveforms | Unbeatable for media |
| CLI (kept) | LibreOffice | DOCX, PPTX, ODT, complex PDF | No Rust alternative for Office |
| CLI (kept) | Pandoc | MD, LaTeX, ePub, rich HTML | Best for markup pipelines |
| Python | Pandas | XLSX, Parquet, SQLite | Keep for tabular data |

## 2. Quality Controls

### Simple Presets (default)

| Preset | Image | Video | Audio | PDF |
|---|---|---|---|---|
| Low | 60%, max 1024px | 720p, 1Mbps | 128kbps | High compression |
| Medium | 80%, max 2048px | 1080p, 5Mbps | 192kbps | Balanced |
| High | 95%, original size | Original res, 15Mbps | 320kbps | Minimal compression |
| Lossless | 100%, no resize | Lossless codec | FLAC/WAV | No compression |

### Advanced Controls (per format type)

- **Images:** Quality %, max width/height, DPI, strip metadata
- **Video:** Resolution, bitrate, codec (H.264/H.265/VP9), FPS
- **Audio:** Sample rate, bitrate, channels
- **PDF:** Compression level, image DPI, password
- **Data:** Delimiter, pretty-print, encoding

## 3. New Formats (19 additions → 49 total)

### Images (+6): AVIF encode, ICO, CR2, NEF, animated GIF, animated WebP
### Documents (+4): ePub, LaTeX, PPTX read, rich HTML
### Media (+5): MKV, OPUS, M4A improved, video thumbnail, audio waveform
### Data (+4): YAML, TOML, XML, SQLite

## 4. New Rust Dependencies

```toml
image = "0.25"
webp = "0.3"
ravif = "0.11"
avif-decode = "1"
rawloader = "0.37"
imagepipe = "0.5"
symphonia = { version = "0.5", features = ["all"] }
hound = "3.5"
lopdf = "0.32"
printpdf = "0.7"
serde_yaml = "0.9"
toml = "0.8"
quick-xml = { version = "0.36", features = ["serialize"] }
```

## 5. Build Sequence

1. ConversionOptions type + quality preset UI
2. Wire options through IPC to Rust engines
3. Replace ImageMagick with image crate + RAW support
4. Add rust_data.rs for YAML/TOML/XML
5. Add rust_audio.rs for decode-side
6. Add rust_pdf.rs for simple PDF
7. Update FFmpeg engine with quality/codec args
8. Update Pandoc engine with ePub/LaTeX/rich HTML
9. Update LibreOffice engine with PPTX support
10. Update format map with all 49 formats
11. Update router for tiered engine selection

---

*Simurgh Forge v0.2.0 — Engine Overhaul*
