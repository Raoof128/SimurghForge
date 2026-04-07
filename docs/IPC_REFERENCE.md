# IPC reference (Tauri)

All commands are registered in `src-tauri/src/lib.rs` and `src-tauri/src/commands/convert.rs`. The frontend calls them via `@tauri-apps/api/core` `invoke`; the backend emits events with `AppHandle::emit`.

## Commands

| Command | Arguments | Returns | Notes |
|---------|-----------|---------|--------|
| `convert_batch` | `{ payload: ConvertBatchPayload }` | `()` | Spawns conversions; see below. |
| `get_default_output_dir` | — | `string` | Default `~/Downloads/SimurghForge` (OS-resolved). |
| `get_file_info` | `{ paths: string[] }` | `{ path, size }[]` | Rejects paths with `..` **path components** (not `..` inside a filename). |
| `open_folder` | `{ path: string }` | `()` | Opens file or folder in the system default handler (`open` crate). |
| `load_settings` | — | `string` | JSON string; `{}` if missing. |
| `save_settings` | `{ json: string }` | `()` | Writes settings file. |

### `ConvertBatchPayload` (camelCase in JSON)

| Field | Type | Description |
|-------|------|-------------|
| `files` | array | Each item: `id`, `inputPath`, `outputFormat`, `options` (optional). |
| `outputDir` | string | Output directory; if empty/whitespace, backend uses default downloads folder. |
| `maxConcurrency` | number | Clamped to **1–8** server-side. |
| `maxInputFileBytes` | number (optional) | Max input size per file; capped to **2000 MiB**; default **500 MiB** if omitted. |

## Events (frontend listens)

| Event | Payload (camelCase) | Direction |
|-------|---------------------|-----------|
| `conversion_progress` | `id`, `status`, `percent`, `errorMsg?`, `outputPath?` | Backend → UI |
| `batch_complete` | `totalFiles`, `succeeded`, `failed`, `outputDir` | Backend → UI |

## TypeScript types

Source of truth for the web layer: `src/types/conversion.ts` (`ProgressEvent`, `BatchCompleteEvent`, `ConvertBatchPayload`).

## Capabilities

Tauri v2 capability file: `src-tauri/capabilities/default.json` (window `main`, core + dialog + shell permissions).
