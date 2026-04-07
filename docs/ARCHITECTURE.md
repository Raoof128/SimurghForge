# Architecture

Simurgh Forge is a **local-first** desktop application: a React + TypeScript UI hosted in a Tauri webview talks to a **Rust** backend over **Tauri IPC** (invoke + events). No cloud APIs are required for conversion; optional system CLIs extend format coverage.

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Webview (React 19 + Vite)                    │
│  App ─ Queue state ─ i18n strings ─ Tauri IPC client             │
└────────────────────────────┬────────────────────────────────────┘
                             │ invoke / listen
┌────────────────────────────▼────────────────────────────────────┐
│                     Tauri runtime (Rust)                        │
│  lib.rs — commands: convert_batch, settings, open, file info  │
│  convert.rs — batch orchestration, Tokio semaphore, progress  │
│  router.rs — input kind + output format → Engine enum            │
│  engines/* — per-engine conversion (Rust native + CLI)          │
│  utils — MIME sniffing, path sanitisation, home-dir helpers      │
└─────────────────────────────────────────────────────────────────┘
                             │ std::process / tokio::process
┌────────────────────────────▼────────────────────────────────────┐
│  FFmpeg · LibreOffice · Pandoc · ImageMagick · python3+Pandas   │
└─────────────────────────────────────────────────────────────────┘
```

## Layer responsibilities

| Layer | Responsibility |
|-------|------------------|
| **UI** | Queue (`useConversionQueue`), per-file options, settings persistence (JSON via Rust), progress display, i18n (`src/i18n/strings.ts`). |
| **IPC** | `invoke` for request/response commands; `listen` for `conversion_progress` and `batch_complete`. |
| **Orchestration** | `convert_batch` spawns one async task per file, bounded by a `Semaphore` (concurrency 1–8, batch size ≤ 50). |
| **Routing** | `router::route(input_type, output_format)` picks `Engine` (native Rust vs CLI). |
| **Engines** | Each engine exposes `convert(input, output, app, id, options) -> Result<(), String>`. |
| **Safety** | Canonicalise input paths; reject parent-dir traversal in path components; sanitise output extensions; cap file size; subprocess args via `.arg()` only (no shell string building). |

## Engine tiers

1. **Native Rust** — Fast path with no external binaries: `image`, `ravif`, `symphonia`/`hound`, `lopdf`, serde stack for JSON/YAML/TOML/XML/CSV.
2. **CLI tools** — FFmpeg, LibreOffice (`soffice`), Pandoc, ImageMagick (`magick`), Python+Pandas for spreadsheets and Parquet.

The router prefers native engines when they can handle the input/output pair; otherwise it selects the appropriate CLI.

## Progress and completion

- Each file emits `conversion_progress` with `id`, `status` (`queued` | `converting` | `done` | `error`), `percent`, optional `error_msg` and `output_path`.
- After all tasks finish, `batch_complete` emits aggregate counts and `output_dir`.

## Configuration

- User settings are stored under the OS config directory (e.g. `~/.config/simurgh-forge/settings.json` on Unix).
- Default output directory: `~/Downloads/SimurghForge` when unset.

## Related material

- [IPC reference](IPC_REFERENCE.md) — command and event contracts
- Repository `docs/plans/` — dated design notes (not normative for current behaviour)
