# Simurgh Forge — Design Document

**Date:** 2026-03-28
**Author:** Raouf Abedini
**Status:** Approved

---

## 1. Architecture Overview

Three-layer build sequence:

1. **Frontend Shell** — Full React + Tailwind app with forge theme, all components (DropZone, QueuePanel, FileCard, FormatSelector, ProgressBar, Settings), wired to Tauri IPC with a mock Rust backend that simulates progress events
2. **Rust Engine Layer** — Real conversion engines (LibreOffice, Pandoc, FFmpeg, ImageMagick, Pandas) behind the router, each shelling out to the CLI tool with `.arg()` chaining
3. **Batch & Polish** — Tokio semaphore-based concurrency (configurable, default 4), ZIP bundling, settings persistence, `.dmg` build

### Key Decisions

| Decision | Choice |
|---|---|
| Output directory | Default `~/Downloads/SimurghForge/`, configurable in Settings |
| Build approach | Frontend shell + mock → engines one by one |
| Theme | Full forge aesthetic from Step 1 |
| Distribution | Homebrew deps for now, binary paths abstracted for future embedding |
| Engine order | ImageMagick → FFmpeg → LibreOffice → Pandoc → Pandas |
| State management | `useReducer` + context, no external lib |
| File drop | Tauri native `onFileDropEvent`, not react-dropzone |
| Engine contract | `&Path` params, `app_handle.clone()` per task |
| Tailwind | v4 CSS-first, `@theme {}` tokens |
| Pandoc→PDF | Chains through LibreOffice, requires LibreOffice engine built first |

---

## 2. Frontend Design

### Components

| Component | Responsibility |
|---|---|
| `App.tsx` | Root layout — centered column, app title with amber accent, dark `#0C0C0E` background |
| `DropZone.tsx` | Tauri `onFileDropEvent` for real absolute paths + visual drop target with amber border glow |
| `QueuePanel.tsx` | Scrollable list of FileCards, "Convert All" button, clear queue button |
| `FileCard.tsx` | Per-file card — filename, size, FormatSelector, ProgressBar, status icon, retry on error |
| `FormatSelector.tsx` | Dynamic dropdown from `formatMap.ts` based on detected input MIME type |
| `ProgressBar.tsx` | Amber animated bar with percentage, pulsing glow during conversion |
| `Settings.tsx` | Slide-out panel — output dir picker, max file size slider (500MB default), concurrency selector (1-8) |

### State Management

- `useConversionQueue.ts` — file list, per-file status, add/remove/clear via `useReducer`
- `useIPCEvents.ts` — listens to `conversion_progress` Tauri events, **must return unlisten function** to prevent listener stacking:

```typescript
useEffect(() => {
  let unlisten: (() => void) | undefined;
  listen<ProgressEvent>("conversion_progress", handler).then(fn => { unlisten = fn; });
  return () => { unlisten?.(); };
}, []);
```

### Design System

```css
@import "tailwindcss";

@theme {
  --color-bg-base: #0C0C0E;
  --color-bg-surface: #141416;
  --color-bg-elevated: #1C1C1F;
  --color-accent: #D4922A;
  --color-accent-dim: #7A4F0D;
  --color-text-primary: #F0EAD6;
  --color-text-muted: #6B6B6B;
  --color-success: #3DAA6A;
  --color-error: #C0392B;
  --font-display: "JetBrains Mono", monospace;
  --font-body: "IBM Plex Sans", sans-serif;
}
```

### FileCard States

- **queued** — grey border, muted text
- **forging** — amber border, animated progress bar, pulsing glow
- **done** — green border, checkmark, open file link
- **error** — red border, error message, retry button

---

## 3. Rust Backend Design

### Module Structure

```
src-tauri/src/
├── lib.rs              — Tauri builder, command registration
├── commands/
│   ├── mod.rs
│   ├── convert.rs      — batch orchestrator with Semaphore + app_handle.clone() per task
│   ├── router.rs       — MIME → engine dispatch
│   └── engines/
│       ├── mod.rs
│       ├── libreoffice.rs
│       ├── ffmpeg.rs
│       ├── imagemagick.rs
│       ├── pandoc.rs
│       └── pandas.rs
└── utils/
    ├── mime.rs         — file header magic byte sniffing
    └── sanitise.rs     — path canonicalization, traversal rejection, size check
```

### Engine Contract

```rust
pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String>
```

### Concurrency Model

```rust
for file in files {
    let app = app_handle.clone(); // required — AppHandle can't move into multiple tasks
    let permit = Arc::clone(&semaphore).acquire_owned().await.unwrap();
    tokio::spawn(async move {
        engine::convert(..., &app, ...).await;
        drop(permit);
    });
}
```

### Security

- All subprocess calls: `Command::new().arg().arg()` — never string interpolation
- `mime.rs` reads magic bytes, never trusts extension alone
- `sanitise.rs` canonicalizes paths, strips `../`, rejects traversal
- Files >500MB (configurable) rejected before processing

### Binary Path Resolution

Engine modules resolve tool paths via `which`-style lookup (PATH first, then configurable `binaries/` directory) — enables future embedded distribution.

---

## 4. IPC & Data Flow

### Frontend → Rust

```typescript
interface ConvertBatchPayload {
  files: {
    id: string;           // crypto.randomUUID()
    inputPath: string;    // absolute path from Tauri file drop
    outputFormat: string; // e.g. "pdf", "mp3"
  }[];
  outputDir: string;      // from settings
  maxConcurrency: number; // from settings
}
```

### Rust → Frontend

```typescript
interface ProgressEvent {
  id: string;
  status: "queued" | "converting" | "done" | "error";
  percent: number;       // 0-100
  errorMsg?: string;
  outputPath?: string;   // set when status === "done"
}
```

### Progress Granularity

| Engine | Progress Model |
|---|---|
| FFmpeg | Real % via `-progress pipe:1` stdout parsing |
| LibreOffice | Coarse: 0→10% (spawned) → 100% (done) |
| ImageMagick | Coarse: 0→10→100% (usually <1s) |
| Pandoc | Coarse: 0→10→100% |
| Pandas | Coarse: 0→10→100% |

### Batch Completion

- `batch_complete` event emitted when all files finish (done or error) with summary stats
- ZIP bundling: 2+ successful outputs → `SimurghForge_<timestamp>.zip` alongside individual files

---

## 5. Build Sequence

### Step 1 — Environment Setup
- Install Rust, LibreOffice, verify Python packages
- Scaffold Tauri v2 + React + Vite + TypeScript + Tailwind v4
- Add fonts, configure design tokens in `index.css`

### Step 2 — Frontend Shell (with mock backend)
- All 7 components with full forge theme
- Tauri `onFileDropEvent` for file acquisition
- `useConversionQueue` + `useIPCEvents` with unlisten cleanup
- Mock Rust command emitting fake progress events

### Step 3 — Rust Core
- `mime.rs`, `sanitise.rs`, `router.rs`, `convert.rs`
- Batch orchestrator with semaphore concurrency
- Engine trait with `&Path` signatures

### Step 4 — Real Engines
- `imagemagick.rs` (fast, simple)
- `ffmpeg.rs` (real progress parsing)
- `libreoffice.rs` (must come before Pandoc)
- `pandoc.rs` (chains through LibreOffice for PDF)
- `pandas.rs` + `scripts/pandas_convert.py`

### Step 5 — Batch & Distribution
- ZIP bundling for multi-file outputs
- Settings wired to Rust backend
- macOS dock icon + tauri.conf.json metadata
- `.dmg` build

---

*Simurgh Forge — Built by Raouf Abedini, 2026*
