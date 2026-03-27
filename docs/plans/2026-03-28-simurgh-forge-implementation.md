# Simurgh Forge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local-first macOS desktop file converter with Tauri v2, React, and Rust that converts any file to any compatible format in batch with real-time progress.

**Architecture:** Frontend-first approach — complete React UI with forge theme wired to a mock Rust backend, then replace mock with real engines one by one. Rust orchestrates concurrent conversions via Tokio semaphore, shelling out to system CLI tools (FFmpeg, ImageMagick, LibreOffice, Pandoc, Python/Pandas).

**Tech Stack:** Tauri v2 (Rust), React 18, Vite, TypeScript, Tailwind CSS v4, Tokio, serde

---

## Task 1: Install System Dependencies

**Files:**
- None (system setup only)

**Step 1: Install Rust via rustup**

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

**Step 2: Verify Rust installation**

Run: `rustc --version && cargo --version`
Expected: Version strings for both (rustc 1.x.x, cargo 1.x.x)

**Step 3: Install LibreOffice via Homebrew**

```bash
brew install --cask libreoffice
```

**Step 4: Install Python packages**

```bash
pip3 install pillow pandas openpyxl pyarrow
```

**Step 5: Verify all system dependencies**

```bash
rustc --version && cargo --version && node --version && python3 --version && ffmpeg -version 2>&1 | head -1 && magick --version | head -1 && pandoc --version | head -1 && ls /Applications/LibreOffice.app && python3 -c "import PIL, pandas, openpyxl, pyarrow; print('Python packages OK')"
```

Expected: All version strings print, no errors.

---

## Task 2: Scaffold Tauri v2 + React + Vite + TypeScript Project

**Files:**
- Create: `simurgh-forge/` project root (already exists as docs holder)
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`
- Create: `src-tauri/` with `Cargo.toml`, `tauri.conf.json`, `src/lib.rs`, `src/main.rs`

**Step 1: Initialize Vite + React + TypeScript**

```bash
cd /Users/raoof.r12/Desktop/Raouf/new_Project/simurgh-forge
npm create vite@latest . -- --template react-ts
```

If prompted about existing files (docs/), confirm overwrite is safe — only `docs/` exists.

**Step 2: Install frontend dependencies**

```bash
npm install
```

**Step 3: Install Tauri CLI and initialize**

```bash
npm install -D @tauri-apps/cli@latest
npm install @tauri-apps/api@latest
npx tauri init
```

When prompted:
- App name: `Simurgh Forge`
- Window title: `Simurgh Forge`
- Web assets path: `../dist`
- Dev server URL: `http://localhost:5173`
- Dev command: `npm run dev`
- Build command: `npm run build`

**Step 4: Install Tailwind CSS v4 for Vite**

```bash
npm install -D @tailwindcss/vite tailwindcss
```

**Step 5: Configure Vite with Tailwind plugin**

Write `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "esnext",
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
```

**Step 6: Verify scaffold compiles**

Run: `cd src-tauri && cargo build`
Expected: Compiles with no errors (warnings OK for now).

Run: `cd .. && npm run dev` (Ctrl+C after confirming it starts)
Expected: Vite dev server starts on port 5173.

**Step 7: Commit scaffold**

```bash
git init
git add -A
git commit -m "feat: scaffold Tauri v2 + React + Vite + TypeScript + Tailwind v4"
```

---

## Task 3: Configure Design System (Forge Theme)

**Files:**
- Modify: `src/index.css`
- Modify: `index.html` (add font imports)
- Create: `src/App.tsx` (replace Vite default)
- Create: `src/main.tsx` (ensure clean entry)

**Step 1: Add font imports to index.html**

Add to `<head>` in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

**Step 2: Write Tailwind v4 design tokens in index.css**

Replace `src/index.css` entirely:

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

body {
  margin: 0;
  padding: 0;
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  user-select: none;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-base);
}

::-webkit-scrollbar-thumb {
  background: var(--color-accent-dim);
  border-radius: 3px;
}
```

**Step 3: Write minimal App.tsx shell**

Replace `src/App.tsx`:

```tsx
function App() {
  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-base px-6 py-8">
      <h1 className="font-display text-3xl font-bold text-accent tracking-tight mb-1">
        Simurgh Forge
      </h1>
      <p className="font-body text-text-muted text-sm mb-8">
        Universal File Converter
      </p>
      {/* DropZone, QueuePanel, Settings will go here */}
      <div className="text-text-muted text-xs mt-auto pt-8">
        Drop files to begin forging
      </div>
    </div>
  );
}

export default App;
```

**Step 4: Clean up main.tsx**

Ensure `src/main.tsx` is:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 5: Verify theme renders**

Run: `npm run tauri dev`
Expected: Dark window with amber "Simurgh Forge" title, off-white subtitle, JetBrains Mono heading font.

**Step 6: Commit**

```bash
git add src/index.css src/App.tsx src/main.tsx index.html
git commit -m "feat: configure forge design system with Tailwind v4 theme tokens"
```

---

## Task 4: Build TypeScript Types and Format Map

**Files:**
- Create: `src/types/conversion.ts`
- Create: `src/lib/formatMap.ts`
- Create: `src/lib/ipc.ts`

**Step 1: Create type definitions**

Write `src/types/conversion.ts`:

```typescript
export type ConversionStatus = "queued" | "converting" | "done" | "error";

export interface FileItem {
  id: string;
  name: string;
  path: string;
  size: number;
  inputFormat: string;
  outputFormat: string;
  status: ConversionStatus;
  percent: number;
  errorMsg?: string;
  outputPath?: string;
}

export interface ProgressEvent {
  id: string;
  status: ConversionStatus;
  percent: number;
  errorMsg?: string;
  outputPath?: string;
}

export interface BatchCompleteEvent {
  totalFiles: number;
  succeeded: number;
  failed: number;
  outputDir: string;
  zipPath?: string;
}

export interface ConvertBatchPayload {
  files: {
    id: string;
    inputPath: string;
    outputFormat: string;
  }[];
  outputDir: string;
  maxConcurrency: number;
}

export interface AppSettings {
  outputDir: string;
  maxFileSize: number; // bytes
  maxConcurrency: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  outputDir: "",  // resolved at runtime to ~/Downloads/SimurghForge/
  maxFileSize: 500 * 1024 * 1024, // 500MB
  maxConcurrency: 4,
};
```

**Step 2: Create format routing map**

Write `src/lib/formatMap.ts`:

```typescript
// Maps input file extension → valid output formats
// Source of truth matching the blueprint's conversion routing table

export const FORMAT_MAP: Record<string, string[]> = {
  // Documents — LibreOffice Headless
  docx: ["pdf", "txt", "html", "odt", "rtf", "md"],
  pdf:  ["docx", "txt", "html"],
  odt:  ["pdf", "docx", "txt", "html"],
  rtf:  ["pdf", "docx", "txt", "html"],

  // Markup — Pandoc (+ LibreOffice for PDF)
  md:   ["docx", "pdf", "html", "txt"],
  html: ["pdf", "docx", "md", "txt"],
  txt:  ["pdf", "docx", "md", "html"],

  // Images — ImageMagick
  png:  ["jpg", "webp", "avif", "tiff", "bmp", "svg"],
  jpg:  ["png", "webp", "avif", "tiff", "bmp"],
  jpeg: ["png", "webp", "avif", "tiff", "bmp"],
  heic: ["jpg", "png", "webp"],
  svg:  ["png", "jpg", "webp", "pdf"],
  webp: ["png", "jpg", "tiff", "bmp"],
  tiff: ["png", "jpg", "webp"],
  bmp:  ["png", "jpg", "webp"],

  // Audio/Video — FFmpeg
  mp4:  ["mp3", "wav", "webm", "mov", "gif", "avi"],
  mov:  ["mp4", "mp3", "gif", "webm"],
  webm: ["mp4", "mp3", "gif"],
  avi:  ["mp4", "mp3", "webm"],
  mp3:  ["wav", "flac", "ogg", "aac", "m4a"],
  wav:  ["mp3", "flac", "ogg", "aac"],
  flac: ["mp3", "wav", "ogg", "aac"],
  ogg:  ["mp3", "wav", "flac"],
  aac:  ["mp3", "wav", "flac"],
  m4a:  ["mp3", "wav", "flac", "ogg"],

  // Data — Pandas
  csv:     ["json", "xlsx", "parquet", "tsv"],
  xlsx:    ["csv", "json", "parquet", "tsv"],
  json:    ["csv", "xlsx", "tsv"],
  parquet: ["csv", "json", "xlsx", "tsv"],
  tsv:     ["csv", "json", "xlsx", "parquet"],
};

export function getOutputFormats(filename: string): string[] {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return FORMAT_MAP[ext] ?? [];
}

export function getInputExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}
```

**Step 3: Create typed IPC wrapper**

Write `src/lib/ipc.ts`:

```typescript
import { invoke } from "@tauri-apps/api/core";
import type { ConvertBatchPayload } from "../types/conversion";

export async function convertBatch(payload: ConvertBatchPayload): Promise<void> {
  return invoke("convert_batch", { payload });
}

export async function getDefaultOutputDir(): Promise<string> {
  return invoke("get_default_output_dir");
}
```

**Step 4: Commit**

```bash
git add src/types/ src/lib/
git commit -m "feat: add TypeScript types, format routing map, and IPC wrappers"
```

---

## Task 5: Build useConversionQueue Hook

**Files:**
- Create: `src/hooks/useConversionQueue.ts`

**Step 1: Implement the queue reducer and hook**

Write `src/hooks/useConversionQueue.ts`:

```typescript
import { useReducer, useCallback } from "react";
import type { FileItem, ConversionStatus } from "../types/conversion";
import { getInputExtension, getOutputFormats } from "../lib/formatMap";

// --- Actions ---

type QueueAction =
  | { type: "ADD_FILES"; files: FileItem[] }
  | { type: "REMOVE_FILE"; id: string }
  | { type: "CLEAR_QUEUE" }
  | { type: "SET_OUTPUT_FORMAT"; id: string; format: string }
  | {
      type: "UPDATE_PROGRESS";
      id: string;
      status: ConversionStatus;
      percent: number;
      errorMsg?: string;
      outputPath?: string;
    }
  | { type: "RESET_FILE"; id: string };

// --- Reducer ---

function queueReducer(state: FileItem[], action: QueueAction): FileItem[] {
  switch (action.type) {
    case "ADD_FILES":
      return [...state, ...action.files];
    case "REMOVE_FILE":
      return state.filter((f) => f.id !== action.id);
    case "CLEAR_QUEUE":
      return [];
    case "SET_OUTPUT_FORMAT":
      return state.map((f) =>
        f.id === action.id ? { ...f, outputFormat: action.format } : f
      );
    case "UPDATE_PROGRESS":
      return state.map((f) =>
        f.id === action.id
          ? {
              ...f,
              status: action.status,
              percent: action.percent,
              errorMsg: action.errorMsg,
              outputPath: action.outputPath,
            }
          : f
      );
    case "RESET_FILE":
      return state.map((f) =>
        f.id === action.id
          ? { ...f, status: "queued", percent: 0, errorMsg: undefined, outputPath: undefined }
          : f
      );
    default:
      return state;
  }
}

// --- Hook ---

export function useConversionQueue() {
  const [files, dispatch] = useReducer(queueReducer, []);

  const addFiles = useCallback(
    (paths: string[]) => {
      const newFiles: FileItem[] = paths
        .map((path) => {
          const name = path.split("/").pop() ?? path;
          const ext = getInputExtension(name);
          const formats = getOutputFormats(name);
          if (formats.length === 0) return null;
          return {
            id: crypto.randomUUID(),
            name,
            path,
            size: 0, // populated later if needed
            inputFormat: ext,
            outputFormat: formats[0],
            status: "queued" as const,
            percent: 0,
          };
        })
        .filter((f): f is FileItem => f !== null);
      if (newFiles.length > 0) {
        dispatch({ type: "ADD_FILES", files: newFiles });
      }
    },
    []
  );

  const removeFile = useCallback(
    (id: string) => dispatch({ type: "REMOVE_FILE", id }),
    []
  );

  const clearQueue = useCallback(
    () => dispatch({ type: "CLEAR_QUEUE" }),
    []
  );

  const setOutputFormat = useCallback(
    (id: string, format: string) =>
      dispatch({ type: "SET_OUTPUT_FORMAT", id, format }),
    []
  );

  const updateProgress = useCallback(
    (
      id: string,
      status: ConversionStatus,
      percent: number,
      errorMsg?: string,
      outputPath?: string
    ) => dispatch({ type: "UPDATE_PROGRESS", id, status, percent, errorMsg, outputPath }),
    []
  );

  const resetFile = useCallback(
    (id: string) => dispatch({ type: "RESET_FILE", id }),
    []
  );

  return {
    files,
    addFiles,
    removeFile,
    clearQueue,
    setOutputFormat,
    updateProgress,
    resetFile,
  };
}
```

**Step 2: Commit**

```bash
git add src/hooks/useConversionQueue.ts
git commit -m "feat: add useConversionQueue hook with reducer-based state management"
```

---

## Task 6: Build useIPCEvents Hook

**Files:**
- Create: `src/hooks/useIPCEvents.ts`

**Step 1: Implement the IPC event listener hook**

Write `src/hooks/useIPCEvents.ts`:

```typescript
import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import type { ProgressEvent, BatchCompleteEvent, ConversionStatus } from "../types/conversion";

interface UseIPCEventsProps {
  onProgress: (
    id: string,
    status: ConversionStatus,
    percent: number,
    errorMsg?: string,
    outputPath?: string
  ) => void;
  onBatchComplete?: (event: BatchCompleteEvent) => void;
}

export function useIPCEvents({ onProgress, onBatchComplete }: UseIPCEventsProps) {
  // Listen for per-file progress events
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen<ProgressEvent>("conversion_progress", (event) => {
      const { id, status, percent, errorMsg, outputPath } = event.payload;
      onProgress(id, status, percent, errorMsg, outputPath);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [onProgress]);

  // Listen for batch completion event
  useEffect(() => {
    if (!onBatchComplete) return;
    let unlisten: (() => void) | undefined;
    listen<BatchCompleteEvent>("batch_complete", (event) => {
      onBatchComplete(event.payload);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [onBatchComplete]);
}
```

**Step 2: Commit**

```bash
git add src/hooks/useIPCEvents.ts
git commit -m "feat: add useIPCEvents hook with unlisten cleanup"
```

---

## Task 7: Build ProgressBar Component

**Files:**
- Create: `src/components/ProgressBar.tsx`

**Step 1: Implement ProgressBar with forge styling**

Write `src/components/ProgressBar.tsx`:

```tsx
interface ProgressBarProps {
  percent: number;
  isActive: boolean;
}

export function ProgressBar({ percent, isActive }: ProgressBarProps) {
  return (
    <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ease-out ${
          isActive
            ? "bg-accent shadow-[0_0_8px_var(--color-accent)] animate-pulse"
            : "bg-accent"
        }`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/ProgressBar.tsx
git commit -m "feat: add ProgressBar component with amber glow animation"
```

---

## Task 8: Build FormatSelector Component

**Files:**
- Create: `src/components/FormatSelector.tsx`

**Step 1: Implement FormatSelector dropdown**

Write `src/components/FormatSelector.tsx`:

```tsx
import { getOutputFormats } from "../lib/formatMap";

interface FormatSelectorProps {
  filename: string;
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  disabled?: boolean;
}

export function FormatSelector({
  filename,
  selectedFormat,
  onFormatChange,
  disabled = false,
}: FormatSelectorProps) {
  const formats = getOutputFormats(filename);

  return (
    <select
      value={selectedFormat}
      onChange={(e) => onFormatChange(e.target.value)}
      disabled={disabled}
      className="bg-bg-elevated text-text-primary border border-accent-dim rounded px-2 py-1 text-xs font-display
                 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
                 disabled:opacity-40 disabled:cursor-not-allowed
                 cursor-pointer appearance-none"
    >
      {formats.map((fmt) => (
        <option key={fmt} value={fmt}>
          .{fmt.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/FormatSelector.tsx
git commit -m "feat: add FormatSelector dropdown with dynamic format options"
```

---

## Task 9: Build FileCard Component

**Files:**
- Create: `src/components/FileCard.tsx`

**Step 1: Implement FileCard with all 4 states**

Write `src/components/FileCard.tsx`:

```tsx
import type { FileItem } from "../types/conversion";
import { ProgressBar } from "./ProgressBar";
import { FormatSelector } from "./FormatSelector";

interface FileCardProps {
  file: FileItem;
  onFormatChange: (id: string, format: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  queued:     "border-text-muted/30",
  converting: "border-accent shadow-[0_0_12px_var(--color-accent-dim)]",
  done:       "border-success",
  error:      "border-error",
};

const STATUS_ICONS: Record<string, string> = {
  queued:     "\u2022",     // bullet
  converting: "\u2699",     // gear
  done:       "\u2713",     // checkmark
  error:      "\u2717",     // cross
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileCard({ file, onFormatChange, onRemove, onRetry }: FileCardProps) {
  const isConverting = file.status === "converting";
  const isDone = file.status === "done";
  const isError = file.status === "error";
  const isActive = isConverting || file.status === "queued";

  return (
    <div
      className={`bg-bg-surface border rounded-lg p-4 transition-all duration-300 ${STATUS_STYLES[file.status]}`}
    >
      {/* Top row: icon, filename, format selector, remove button */}
      <div className="flex items-center gap-3 mb-2">
        <span
          className={`text-lg ${
            isDone ? "text-success" : isError ? "text-error" : isConverting ? "text-accent" : "text-text-muted"
          }`}
        >
          {STATUS_ICONS[file.status]}
        </span>

        <div className="flex-1 min-w-0">
          <p className="font-display text-sm text-text-primary truncate">
            {file.name}
          </p>
          {file.size > 0 && (
            <p className="text-xs text-text-muted">{formatFileSize(file.size)}</p>
          )}
        </div>

        <span className="text-text-muted text-xs font-display">\u2192</span>

        <FormatSelector
          filename={file.name}
          selectedFormat={file.outputFormat}
          onFormatChange={(fmt) => onFormatChange(file.id, fmt)}
          disabled={!isActive && !isError}
        />

        {isActive && (
          <button
            onClick={() => onRemove(file.id)}
            className="text-text-muted hover:text-error transition-colors text-sm px-1"
            title="Remove"
          >
            \u2715
          </button>
        )}
      </div>

      {/* Progress bar (visible during conversion) */}
      {isConverting && (
        <div className="mt-2">
          <ProgressBar percent={file.percent} isActive={true} />
          <p className="text-xs text-accent mt-1 font-display">{file.percent}%</p>
        </div>
      )}

      {/* Done state */}
      {isDone && file.outputPath && (
        <p className="text-xs text-success mt-1 font-display truncate">
          Forged \u2192 {file.outputPath.split("/").pop()}
        </p>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-error flex-1 truncate">
            {file.errorMsg ?? "Conversion failed"}
          </p>
          <button
            onClick={() => onRetry(file.id)}
            className="text-xs text-accent hover:text-text-primary border border-accent-dim rounded px-2 py-0.5 transition-colors font-display"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/FileCard.tsx
git commit -m "feat: add FileCard component with queued/forging/done/error states"
```

---

## Task 10: Build DropZone Component

**Files:**
- Create: `src/components/DropZone.tsx`

**Step 1: Implement DropZone with Tauri native file drop**

Write `src/components/DropZone.tsx`:

```tsx
import { useState, useEffect } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";

interface DropZoneProps {
  onFilesDropped: (paths: string[]) => void;
  fileCount: number;
}

export function DropZone({ onFilesDropped, fileCount }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over") {
          setIsDragging(true);
        } else if (event.payload.type === "drop") {
          setIsDragging(false);
          onFilesDropped(event.payload.paths);
        } else {
          // cancelled
          setIsDragging(false);
        }
      })
      .then((fn) => {
        unlisten = fn;
      });

    return () => {
      unlisten?.();
    };
  }, [onFilesDropped]);

  return (
    <div
      className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-default ${
        isDragging
          ? "border-accent bg-bg-elevated shadow-[0_0_24px_var(--color-accent-dim)]"
          : "border-text-muted/30 hover:border-accent-dim"
      }`}
    >
      <div className="flex flex-col items-center gap-2">
        <span className={`text-4xl transition-colors ${isDragging ? "text-accent" : "text-text-muted"}`}>
          {isDragging ? "\u2B07" : "\u2693"}
        </span>
        <p className={`font-display text-sm ${isDragging ? "text-accent" : "text-text-muted"}`}>
          {isDragging ? "Release to forge" : "Drop files here"}
        </p>
        {fileCount > 0 && (
          <span className="bg-accent text-bg-base text-xs font-display font-bold rounded-full px-2 py-0.5 mt-1">
            {fileCount} file{fileCount !== 1 ? "s" : ""} queued
          </span>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/DropZone.tsx
git commit -m "feat: add DropZone component with Tauri native onDragDropEvent"
```

---

## Task 11: Build QueuePanel Component

**Files:**
- Create: `src/components/QueuePanel.tsx`

**Step 1: Implement QueuePanel**

Write `src/components/QueuePanel.tsx`:

```tsx
import type { FileItem } from "../types/conversion";
import { FileCard } from "./FileCard";

interface QueuePanelProps {
  files: FileItem[];
  onFormatChange: (id: string, format: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onConvertAll: () => void;
  onClearQueue: () => void;
  isConverting: boolean;
}

export function QueuePanel({
  files,
  onFormatChange,
  onRemove,
  onRetry,
  onConvertAll,
  onClearQueue,
  isConverting,
}: QueuePanelProps) {
  if (files.length === 0) return null;

  const hasQueuedFiles = files.some((f) => f.status === "queued");

  return (
    <div className="w-full max-w-2xl mt-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm text-text-muted">
          Queue ({files.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onClearQueue}
            disabled={isConverting}
            className="text-xs text-text-muted hover:text-error transition-colors font-display
                       disabled:opacity-40 disabled:cursor-not-allowed px-2 py-1"
          >
            Clear
          </button>
          <button
            onClick={onConvertAll}
            disabled={!hasQueuedFiles || isConverting}
            className="bg-accent text-bg-base text-xs font-display font-bold rounded px-4 py-1.5
                       hover:bg-accent/90 transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isConverting ? "Forging..." : "Forge All"}
          </button>
        </div>
      </div>

      {/* File cards */}
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            onFormatChange={onFormatChange}
            onRemove={onRemove}
            onRetry={onRetry}
          />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/QueuePanel.tsx
git commit -m "feat: add QueuePanel component with file list and forge actions"
```

---

## Task 12: Build Settings Component

**Files:**
- Create: `src/components/Settings.tsx`

**Step 1: Implement Settings slide-out panel**

Write `src/components/Settings.tsx`:

```tsx
import type { AppSettings } from "../types/conversion";

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ settings, onSettingsChange, isOpen, onClose }: SettingsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-80 bg-bg-surface border-l border-accent-dim h-full p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg text-accent">Settings</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            \u2715
          </button>
        </div>

        {/* Output Directory */}
        <div className="mb-6">
          <label className="block font-display text-xs text-text-muted mb-2">
            Output Directory
          </label>
          <input
            type="text"
            value={settings.outputDir}
            onChange={(e) =>
              onSettingsChange({ ...settings, outputDir: e.target.value })
            }
            className="w-full bg-bg-elevated text-text-primary border border-accent-dim rounded px-3 py-2 text-xs font-display
                       focus:outline-none focus:border-accent"
            placeholder="~/Downloads/SimurghForge/"
          />
        </div>

        {/* Max File Size */}
        <div className="mb-6">
          <label className="block font-display text-xs text-text-muted mb-2">
            Max File Size: {Math.round(settings.maxFileSize / (1024 * 1024))}MB
          </label>
          <input
            type="range"
            min={10 * 1024 * 1024}
            max={2000 * 1024 * 1024}
            step={10 * 1024 * 1024}
            value={settings.maxFileSize}
            onChange={(e) =>
              onSettingsChange({ ...settings, maxFileSize: Number(e.target.value) })
            }
            className="w-full accent-accent"
          />
        </div>

        {/* Concurrency */}
        <div className="mb-6">
          <label className="block font-display text-xs text-text-muted mb-2">
            Concurrent Conversions: {settings.maxConcurrency}
          </label>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={settings.maxConcurrency}
            onChange={(e) =>
              onSettingsChange({ ...settings, maxConcurrency: Number(e.target.value) })
            }
            className="w-full accent-accent"
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/Settings.tsx
git commit -m "feat: add Settings slide-out panel with output dir, file size, and concurrency controls"
```

---

## Task 13: Wire Up App.tsx with All Components + Mock Backend

**Files:**
- Modify: `src/App.tsx`
- Modify: `src-tauri/src/lib.rs` (add mock convert_batch command)

**Step 1: Write mock Rust command**

Modify `src-tauri/src/lib.rs`:

```rust
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use std::time::Duration;

#[derive(Deserialize)]
struct FileRequest {
    id: String,
    #[allow(dead_code)]
    input_path: String,
    #[allow(dead_code)]
    output_format: String,
}

#[derive(Deserialize)]
struct ConvertBatchPayload {
    files: Vec<FileRequest>,
    #[allow(dead_code)]
    output_dir: String,
    #[allow(dead_code)]
    max_concurrency: u32,
}

#[derive(Clone, Serialize)]
struct ProgressEvent {
    id: String,
    status: String,
    percent: u8,
    error_msg: Option<String>,
    output_path: Option<String>,
}

#[tauri::command]
async fn convert_batch(app: AppHandle, payload: ConvertBatchPayload) -> Result<(), String> {
    // Mock: simulate progress for each file
    for file in &payload.files {
        let app = app.clone();
        let id = file.id.clone();
        tauri::async_runtime::spawn(async move {
            // Emit converting at 10%
            let _ = app.emit("conversion_progress", ProgressEvent {
                id: id.clone(),
                status: "converting".into(),
                percent: 10,
                error_msg: None,
                output_path: None,
            });
            tokio::time::sleep(Duration::from_millis(500)).await;

            // 50%
            let _ = app.emit("conversion_progress", ProgressEvent {
                id: id.clone(),
                status: "converting".into(),
                percent: 50,
                error_msg: None,
                output_path: None,
            });
            tokio::time::sleep(Duration::from_millis(500)).await;

            // Done at 100%
            let _ = app.emit("conversion_progress", ProgressEvent {
                id: id.clone(),
                status: "done".into(),
                percent: 100,
                error_msg: None,
                output_path: Some(format!("/tmp/mock_output_{}", id)),
            });
        });
    }
    Ok(())
}

#[tauri::command]
async fn get_default_output_dir() -> Result<String, String> {
    let home = std::env::var("HOME").map_err(|e| e.to_string())?;
    Ok(format!("{}/Downloads/SimurghForge", home))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![convert_batch, get_default_output_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 2: Add serde + tokio deps to Cargo.toml**

Ensure `src-tauri/Cargo.toml` has:

```toml
[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2", features = [] }
tokio = { version = "1", features = ["full"] }
```

**Step 3: Wire up App.tsx**

Replace `src/App.tsx`:

```tsx
import { useState, useCallback, useEffect } from "react";
import { DropZone } from "./components/DropZone";
import { QueuePanel } from "./components/QueuePanel";
import { Settings } from "./components/Settings";
import { useConversionQueue } from "./hooks/useConversionQueue";
import { useIPCEvents } from "./hooks/useIPCEvents";
import { convertBatch, getDefaultOutputDir } from "./lib/ipc";
import type { AppSettings } from "./types/conversion";
import { DEFAULT_SETTINGS } from "./types/conversion";

function App() {
  const {
    files,
    addFiles,
    removeFile,
    clearQueue,
    setOutputFormat,
    updateProgress,
    resetFile,
  } = useConversionQueue();

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Resolve default output dir on mount
  useEffect(() => {
    getDefaultOutputDir().then((dir) => {
      setSettings((prev) => ({ ...prev, outputDir: dir }));
    });
  }, []);

  // IPC event listeners
  const handleProgress = useCallback(
    (id: string, status: string, percent: number, errorMsg?: string, outputPath?: string) => {
      updateProgress(id, status as any, percent, errorMsg, outputPath);
    },
    [updateProgress]
  );

  const handleBatchComplete = useCallback(() => {
    setIsConverting(false);
  }, []);

  useIPCEvents({ onProgress: handleProgress, onBatchComplete: handleBatchComplete });

  // Convert all queued files
  const handleConvertAll = useCallback(async () => {
    const queued = files.filter((f) => f.status === "queued");
    if (queued.length === 0) return;

    setIsConverting(true);
    try {
      await convertBatch({
        files: queued.map((f) => ({
          id: f.id,
          inputPath: f.path,
          outputFormat: f.outputFormat,
        })),
        outputDir: settings.outputDir,
        maxConcurrency: settings.maxConcurrency,
      });
    } catch (err) {
      console.error("Batch conversion failed:", err);
      setIsConverting(false);
    }
  }, [files, settings]);

  // Retry: reset file then trigger conversion
  const handleRetry = useCallback(
    (id: string) => {
      resetFile(id);
    },
    [resetFile]
  );

  return (
    <div className="flex flex-col items-center min-h-screen bg-bg-base px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-1 w-full max-w-2xl">
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold text-accent tracking-tight">
            Simurgh Forge
          </h1>
          <p className="font-body text-text-muted text-sm">
            Universal File Converter
          </p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-text-muted hover:text-accent transition-colors font-display text-lg"
          title="Settings"
        >
          \u2699
        </button>
      </div>

      {/* Drop Zone */}
      <div className="mt-6 w-full flex justify-center">
        <DropZone onFilesDropped={addFiles} fileCount={files.length} />
      </div>

      {/* Queue */}
      <QueuePanel
        files={files}
        onFormatChange={setOutputFormat}
        onRemove={removeFile}
        onRetry={handleRetry}
        onConvertAll={handleConvertAll}
        onClearQueue={clearQueue}
        isConverting={isConverting}
      />

      {/* Settings */}
      <Settings
        settings={settings}
        onSettingsChange={setSettings}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
```

**Step 4: Verify the full frontend shell**

Run: `npm run tauri dev`
Expected:
- Dark forge-themed window with amber "Simurgh Forge" title
- Drop zone visible with dashed border
- Drag a file onto the window → FileCard appears with format dropdown
- Click "Forge All" → mock progress animates 10% → 50% → 100% → green checkmark
- Settings gear opens slide-out panel

**Step 5: Commit**

```bash
git add src/App.tsx src-tauri/src/lib.rs src-tauri/Cargo.toml
git commit -m "feat: wire up complete frontend shell with mock Rust backend"
```

---

## Task 14: Build Rust Utilities (mime.rs, sanitise.rs)

**Files:**
- Create: `src-tauri/src/utils/mod.rs`
- Create: `src-tauri/src/utils/mime.rs`
- Create: `src-tauri/src/utils/sanitise.rs`

**Step 1: Write tests for MIME detection**

Add to bottom of `src-tauri/src/utils/mime.rs` (we'll write implementation and tests together since Rust convention is tests in-file):

```rust
use std::path::Path;
use std::fs::File;
use std::io::Read;

/// Detects file type from magic bytes. Falls back to extension.
pub fn detect_type(path: &Path) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| format!("Cannot open file: {}", e))?;
    let mut header = [0u8; 16];
    let bytes_read = file.read(&mut header).map_err(|e| format!("Cannot read file: {}", e))?;

    if bytes_read < 4 {
        return extension_fallback(path);
    }

    // Magic byte matching
    match &header[..4] {
        // PDF: %PDF
        [0x25, 0x50, 0x44, 0x46] => Ok("pdf".into()),
        // PNG: 0x89 P N G
        [0x89, 0x50, 0x4E, 0x47] => Ok("png".into()),
        // JPEG: FF D8 FF
        [0xFF, 0xD8, 0xFF, _] => Ok("jpg".into()),
        // GIF: GIF8
        [0x47, 0x49, 0x46, 0x38] => Ok("gif".into()),
        // RIFF (WAV, AVI, WebP)
        [0x52, 0x49, 0x46, 0x46] => {
            if bytes_read >= 12 {
                match &header[8..12] {
                    [0x57, 0x41, 0x56, 0x45] => Ok("wav".into()),  // WAVE
                    [0x41, 0x56, 0x49, 0x20] => Ok("avi".into()),  // AVI
                    [0x57, 0x45, 0x42, 0x50] => Ok("webp".into()), // WEBP
                    _ => extension_fallback(path),
                }
            } else {
                extension_fallback(path)
            }
        }
        // ZIP-based (DOCX, XLSX, ODT)
        [0x50, 0x4B, 0x03, 0x04] => detect_zip_subtype(path),
        // FLAC
        [0x66, 0x4C, 0x61, 0x43] => Ok("flac".into()),
        // OGG
        [0x4F, 0x67, 0x67, 0x53] => Ok("ogg".into()),
        // MP4/MOV (ftyp at offset 4)
        _ if bytes_read >= 8 && &header[4..8] == b"ftyp" => {
            // Distinguish MP4 from MOV by brand
            if bytes_read >= 12 {
                match &header[8..12] {
                    b"qt  " => Ok("mov".into()),
                    _ => Ok("mp4".into()),
                }
            } else {
                Ok("mp4".into())
            }
        }
        // ID3 tag (MP3)
        [0x49, 0x44, 0x33, _] => Ok("mp3".into()),
        // MP3 frame sync
        [0xFF, 0xFB, _, _] | [0xFF, 0xFA, _, _] => Ok("mp3".into()),
        _ => extension_fallback(path),
    }
}

/// For ZIP-based formats, peek inside to distinguish DOCX vs XLSX vs ODT
fn detect_zip_subtype(path: &Path) -> Result<String, String> {
    // ZIP-based: check extension since peeking into ZIP entries requires more work
    // and is sufficient for our use case (we've already confirmed it IS a ZIP)
    extension_fallback(path)
}

fn extension_fallback(path: &Path) -> Result<String, String> {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .ok_or_else(|| "Unknown file type".into())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use tempfile::NamedTempFile;

    fn write_temp(ext: &str, bytes: &[u8]) -> tempfile::NamedTempFile {
        let mut f = tempfile::Builder::new()
            .suffix(&format!(".{}", ext))
            .tempfile()
            .unwrap();
        f.write_all(bytes).unwrap();
        f.flush().unwrap();
        f
    }

    #[test]
    fn test_detect_png() {
        let f = write_temp("png", &[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        assert_eq!(detect_type(f.path()).unwrap(), "png");
    }

    #[test]
    fn test_detect_jpg() {
        let f = write_temp("jpg", &[0xFF, 0xD8, 0xFF, 0xE0]);
        assert_eq!(detect_type(f.path()).unwrap(), "jpg");
    }

    #[test]
    fn test_detect_pdf() {
        let f = write_temp("pdf", b"%PDF-1.4 test content");
        assert_eq!(detect_type(f.path()).unwrap(), "pdf");
    }

    #[test]
    fn test_extension_fallback() {
        let f = write_temp("csv", b"name,age\nAlice,30");
        assert_eq!(detect_type(f.path()).unwrap(), "csv");
    }
}
```

**Step 2: Write sanitise.rs with tests**

Write `src-tauri/src/utils/sanitise.rs`:

```rust
use std::path::{Path, PathBuf};
use std::fs;

/// Validates and canonicalizes an input file path.
/// Rejects path traversal, non-existent files, and files exceeding max_size.
pub fn validate_input(path: &str, max_size: u64) -> Result<PathBuf, String> {
    // Reject obvious traversal
    if path.contains("..") {
        return Err("Path traversal detected".into());
    }

    let canonical = fs::canonicalize(path)
        .map_err(|e| format!("Invalid path '{}': {}", path, e))?;

    // Ensure it's a file
    if !canonical.is_file() {
        return Err(format!("Not a file: {}", canonical.display()));
    }

    // Check file size
    let metadata = fs::metadata(&canonical)
        .map_err(|e| format!("Cannot read metadata: {}", e))?;
    if metadata.len() > max_size {
        return Err(format!(
            "File too large: {} bytes (max: {} bytes)",
            metadata.len(),
            max_size
        ));
    }

    Ok(canonical)
}

/// Builds a safe output path inside the given output directory.
/// Ensures the output dir exists and the filename is clean.
pub fn build_output_path(
    output_dir: &str,
    input_filename: &str,
    output_format: &str,
) -> Result<PathBuf, String> {
    let dir = Path::new(output_dir);
    fs::create_dir_all(dir).map_err(|e| format!("Cannot create output dir: {}", e))?;

    // Strip extension from input filename, add output format
    let stem = Path::new(input_filename)
        .file_stem()
        .and_then(|s| s.to_str())
        .ok_or("Invalid filename")?;

    // Sanitize: only allow alphanumeric, dash, underscore, dot, space
    let clean: String = stem
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '-' || *c == '_' || *c == '.' || *c == ' ')
        .collect();

    if clean.is_empty() {
        return Err("Filename is empty after sanitization".into());
    }

    let output_file = format!("{}.{}", clean, output_format);
    let full_path = dir.join(&output_file);

    // Verify the resolved path is still inside output_dir
    let canonical_dir = fs::canonicalize(dir)
        .map_err(|e| format!("Cannot canonicalize output dir: {}", e))?;
    let canonical_file = canonical_dir.join(&output_file);

    if !canonical_file.starts_with(&canonical_dir) {
        return Err("Output path escapes output directory".into());
    }

    Ok(full_path)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_rejects_traversal() {
        let result = validate_input("../../etc/passwd", 500_000_000);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("traversal"));
    }

    #[test]
    fn test_rejects_nonexistent() {
        let result = validate_input("/nonexistent/file.txt", 500_000_000);
        assert!(result.is_err());
    }

    #[test]
    fn test_rejects_oversized() {
        let mut f = tempfile::NamedTempFile::new().unwrap();
        f.write_all(&[0u8; 1024]).unwrap();
        f.flush().unwrap();
        let result = validate_input(f.path().to_str().unwrap(), 100); // max 100 bytes
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("too large"));
    }

    #[test]
    fn test_valid_file_passes() {
        let mut f = tempfile::NamedTempFile::new().unwrap();
        f.write_all(b"hello").unwrap();
        f.flush().unwrap();
        let result = validate_input(f.path().to_str().unwrap(), 500_000_000);
        assert!(result.is_ok());
    }

    #[test]
    fn test_build_output_path() {
        let dir = tempfile::tempdir().unwrap();
        let result = build_output_path(dir.path().to_str().unwrap(), "my_file.docx", "pdf");
        assert!(result.is_ok());
        let path = result.unwrap();
        assert!(path.to_str().unwrap().ends_with("my_file.pdf"));
    }
}
```

**Step 3: Write mod.rs**

Write `src-tauri/src/utils/mod.rs`:

```rust
pub mod mime;
pub mod sanitise;
```

**Step 4: Add tempfile dev-dependency to Cargo.toml**

Add under `[dev-dependencies]`:

```toml
[dev-dependencies]
tempfile = "3"
```

**Step 5: Add `mod utils;` to lib.rs**

Add at the top of `src-tauri/src/lib.rs`:

```rust
mod utils;
```

**Step 6: Run tests**

Run: `cd src-tauri && cargo test`
Expected: All tests pass (8 tests: 4 mime + 4 sanitise + build_output_path)

**Step 7: Commit**

```bash
git add src-tauri/src/utils/ src-tauri/Cargo.toml src-tauri/src/lib.rs
git commit -m "feat: add MIME magic byte detection and path sanitization with tests"
```

---

## Task 15: Build Router and Convert Orchestrator

**Files:**
- Create: `src-tauri/src/commands/mod.rs`
- Create: `src-tauri/src/commands/router.rs`
- Create: `src-tauri/src/commands/convert.rs`
- Create: `src-tauri/src/commands/engines/mod.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Create engine enum and router**

Write `src-tauri/src/commands/router.rs`:

```rust
use std::path::Path;

#[derive(Debug, Clone, PartialEq)]
pub enum Engine {
    ImageMagick,
    FFmpeg,
    LibreOffice,
    Pandoc,
    Pandas,
}

/// Routes an input type + output format to the correct engine.
pub fn route(input_type: &str, output_format: &str) -> Result<Engine, String> {
    match input_type {
        // Images → ImageMagick
        "png" | "jpg" | "jpeg" | "heic" | "svg" | "webp" | "tiff" | "bmp" | "avif" => {
            Ok(Engine::ImageMagick)
        }

        // Audio/Video → FFmpeg
        "mp4" | "mov" | "webm" | "avi" | "mp3" | "wav" | "flac" | "ogg" | "aac" | "m4a" | "gif" => {
            Ok(Engine::FFmpeg)
        }

        // Data → Pandas
        "csv" | "xlsx" | "json" | "parquet" | "tsv" => {
            Ok(Engine::Pandas)
        }

        // Documents
        "docx" | "odt" | "rtf" => Ok(Engine::LibreOffice),
        "pdf" => Ok(Engine::LibreOffice),

        // Markup — Pandoc (chains through LibreOffice for PDF output)
        "md" | "html" | "txt" => {
            if output_format == "pdf" {
                // Pandoc handles the pipeline, but needs LibreOffice internally
                Ok(Engine::Pandoc)
            } else {
                Ok(Engine::Pandoc)
            }
        }

        _ => Err(format!("No engine for input type: {}", input_type)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_image_routing() {
        assert_eq!(route("png", "jpg").unwrap(), Engine::ImageMagick);
        assert_eq!(route("heic", "webp").unwrap(), Engine::ImageMagick);
    }

    #[test]
    fn test_video_routing() {
        assert_eq!(route("mp4", "mp3").unwrap(), Engine::FFmpeg);
        assert_eq!(route("wav", "flac").unwrap(), Engine::FFmpeg);
    }

    #[test]
    fn test_document_routing() {
        assert_eq!(route("docx", "pdf").unwrap(), Engine::LibreOffice);
        assert_eq!(route("md", "html").unwrap(), Engine::Pandoc);
    }

    #[test]
    fn test_data_routing() {
        assert_eq!(route("csv", "json").unwrap(), Engine::Pandas);
        assert_eq!(route("xlsx", "csv").unwrap(), Engine::Pandas);
    }

    #[test]
    fn test_unknown_format() {
        assert!(route("xyz", "pdf").is_err());
    }
}
```

**Step 2: Create engine module stubs**

Write `src-tauri/src/commands/engines/mod.rs`:

```rust
pub mod imagemagick;
pub mod ffmpeg;
pub mod libreoffice;
pub mod pandoc;
pub mod pandas;
```

Create stub files for each engine (will be implemented in Tasks 16-20). Each stub:

`src-tauri/src/commands/engines/imagemagick.rs`:
```rust
use std::path::Path;
use tauri::AppHandle;

pub async fn convert(
    _input_path: &Path,
    _output_path: &Path,
    _app_handle: &AppHandle,
    _file_id: &str,
) -> Result<(), String> {
    Err("ImageMagick engine not yet implemented".into())
}
```

`src-tauri/src/commands/engines/ffmpeg.rs`:
```rust
use std::path::Path;
use tauri::AppHandle;

pub async fn convert(
    _input_path: &Path,
    _output_path: &Path,
    _app_handle: &AppHandle,
    _file_id: &str,
) -> Result<(), String> {
    Err("FFmpeg engine not yet implemented".into())
}
```

`src-tauri/src/commands/engines/libreoffice.rs`:
```rust
use std::path::Path;
use tauri::AppHandle;

pub async fn convert(
    _input_path: &Path,
    _output_path: &Path,
    _app_handle: &AppHandle,
    _file_id: &str,
) -> Result<(), String> {
    Err("LibreOffice engine not yet implemented".into())
}
```

`src-tauri/src/commands/engines/pandoc.rs`:
```rust
use std::path::Path;
use tauri::AppHandle;

pub async fn convert(
    _input_path: &Path,
    _output_path: &Path,
    _app_handle: &AppHandle,
    _file_id: &str,
) -> Result<(), String> {
    Err("Pandoc engine not yet implemented".into())
}
```

`src-tauri/src/commands/engines/pandas.rs`:
```rust
use std::path::Path;
use tauri::AppHandle;

pub async fn convert(
    _input_path: &Path,
    _output_path: &Path,
    _app_handle: &AppHandle,
    _file_id: &str,
) -> Result<(), String> {
    Err("Pandas engine not yet implemented".into())
}
```

**Step 3: Write convert.rs batch orchestrator**

Write `src-tauri/src/commands/convert.rs`:

```rust
use std::path::Path;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};
use tokio::sync::Semaphore;

use super::router::{self, Engine};
use super::engines;
use crate::utils::{mime, sanitise};

#[derive(Deserialize)]
pub struct FileRequest {
    pub id: String,
    pub input_path: String,
    pub output_format: String,
}

#[derive(Deserialize)]
pub struct ConvertBatchPayload {
    pub files: Vec<FileRequest>,
    pub output_dir: String,
    pub max_concurrency: u32,
}

#[derive(Clone, Serialize)]
pub struct ProgressEvent {
    pub id: String,
    pub status: String,
    pub percent: u8,
    pub error_msg: Option<String>,
    pub output_path: Option<String>,
}

#[derive(Clone, Serialize)]
pub struct BatchCompleteEvent {
    pub total_files: usize,
    pub succeeded: usize,
    pub failed: usize,
    pub output_dir: String,
    pub zip_path: Option<String>,
}

fn emit_progress(app: &AppHandle, id: &str, status: &str, percent: u8, error_msg: Option<String>, output_path: Option<String>) {
    let _ = app.emit("conversion_progress", ProgressEvent {
        id: id.to_string(),
        status: status.to_string(),
        percent,
        error_msg,
        output_path,
    });
}

#[tauri::command]
pub async fn convert_batch(app: AppHandle, payload: ConvertBatchPayload) -> Result<(), String> {
    let semaphore = Arc::new(Semaphore::new(payload.max_concurrency as usize));
    let total = payload.files.len();
    let succeeded = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let failed = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let output_dir = payload.output_dir.clone();

    let mut handles = Vec::new();

    for file in payload.files {
        let app = app.clone();
        let sem = Arc::clone(&semaphore);
        let ok_count = Arc::clone(&succeeded);
        let err_count = Arc::clone(&failed);
        let out_dir = output_dir.clone();

        let handle = tauri::async_runtime::spawn(async move {
            let _permit = sem.acquire().await.unwrap();

            // Validate input
            let input_path = match sanitise::validate_input(&file.input_path, 500_000_000) {
                Ok(p) => p,
                Err(e) => {
                    emit_progress(&app, &file.id, "error", 0, Some(e), None);
                    err_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    return;
                }
            };

            // Detect MIME type
            let input_type = match mime::detect_type(&input_path) {
                Ok(t) => t,
                Err(e) => {
                    emit_progress(&app, &file.id, "error", 0, Some(e), None);
                    err_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    return;
                }
            };

            // Route to engine
            let engine = match router::route(&input_type, &file.output_format) {
                Ok(e) => e,
                Err(e) => {
                    emit_progress(&app, &file.id, "error", 0, Some(e), None);
                    err_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    return;
                }
            };

            // Build output path
            let input_filename = input_path.file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("output");
            let output_path = match sanitise::build_output_path(&out_dir, input_filename, &file.output_format) {
                Ok(p) => p,
                Err(e) => {
                    emit_progress(&app, &file.id, "error", 0, Some(e), None);
                    err_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    return;
                }
            };

            // Emit converting
            emit_progress(&app, &file.id, "converting", 10, None, None);

            // Dispatch to engine
            let result = match engine {
                Engine::ImageMagick => engines::imagemagick::convert(&input_path, &output_path, &app, &file.id).await,
                Engine::FFmpeg => engines::ffmpeg::convert(&input_path, &output_path, &app, &file.id).await,
                Engine::LibreOffice => engines::libreoffice::convert(&input_path, &output_path, &app, &file.id).await,
                Engine::Pandoc => engines::pandoc::convert(&input_path, &output_path, &app, &file.id).await,
                Engine::Pandas => engines::pandas::convert(&input_path, &output_path, &app, &file.id).await,
            };

            match result {
                Ok(()) => {
                    emit_progress(&app, &file.id, "done", 100, None, Some(output_path.to_string_lossy().to_string()));
                    ok_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                }
                Err(e) => {
                    emit_progress(&app, &file.id, "error", 0, Some(e), None);
                    err_count.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                }
            }
        });

        handles.push(handle);
    }

    // Wait for all tasks
    for handle in handles {
        let _ = handle.await;
    }

    // Emit batch complete
    let ok = succeeded.load(std::sync::atomic::Ordering::Relaxed);
    let err = failed.load(std::sync::atomic::Ordering::Relaxed);
    let _ = app.emit("batch_complete", BatchCompleteEvent {
        total_files: total,
        succeeded: ok,
        failed: err,
        output_dir,
        zip_path: None, // ZIP bundling added in Task 21
    });

    Ok(())
}

#[tauri::command]
pub async fn get_default_output_dir() -> Result<String, String> {
    let home = std::env::var("HOME").map_err(|e| e.to_string())?;
    Ok(format!("{}/Downloads/SimurghForge", home))
}
```

**Step 4: Write commands/mod.rs**

Write `src-tauri/src/commands/mod.rs`:

```rust
pub mod convert;
pub mod router;
pub mod engines;
```

**Step 5: Update lib.rs to use real commands module**

Replace `src-tauri/src/lib.rs`:

```rust
mod commands;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::convert::convert_batch,
            commands::convert::get_default_output_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Step 6: Run all tests**

Run: `cd src-tauri && cargo test`
Expected: All tests pass (router tests + mime tests + sanitise tests)

**Step 7: Commit**

```bash
git add src-tauri/src/commands/ src-tauri/src/lib.rs
git commit -m "feat: add conversion router, batch orchestrator, and engine stubs"
```

---

## Task 16: Implement ImageMagick Engine

**Files:**
- Modify: `src-tauri/src/commands/engines/imagemagick.rs`

**Step 1: Implement ImageMagick conversion**

Replace `src-tauri/src/commands/engines/imagemagick.rs`:

```rust
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Emitter};
use crate::commands::convert::ProgressEvent;

fn emit(app: &AppHandle, id: &str, status: &str, percent: u8) {
    let _ = app.emit("conversion_progress", ProgressEvent {
        id: id.to_string(),
        status: status.to_string(),
        percent,
        error_msg: None,
        output_path: None,
    });
}

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    emit(app_handle, file_id, "converting", 10);

    let output = Command::new("magick")
        .arg("convert")
        .arg(input_path)
        .arg(output_path)
        .output()
        .map_err(|e| format!("Failed to run ImageMagick: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ImageMagick error: {}", stderr));
    }

    emit(app_handle, file_id, "converting", 100);
    Ok(())
}
```

**Step 2: Test manually**

Run: `npm run tauri dev`
Drop a `.png` file, select `.jpg` output, click "Forge All".
Expected: File converts, progress goes 10% → 100%, green checkmark. Output file in `~/Downloads/SimurghForge/`.

**Step 3: Commit**

```bash
git add src-tauri/src/commands/engines/imagemagick.rs
git commit -m "feat: implement ImageMagick engine for image format conversion"
```

---

## Task 17: Implement FFmpeg Engine

**Files:**
- Modify: `src-tauri/src/commands/engines/ffmpeg.rs`

**Step 1: Implement FFmpeg conversion with real progress parsing**

Replace `src-tauri/src/commands/engines/ffmpeg.rs`:

```rust
use std::path::Path;
use std::process::Stdio;
use tauri::{AppHandle, Emitter};
use tokio::process::Command;
use tokio::io::{AsyncBufReadExt, BufReader};
use crate::commands::convert::ProgressEvent;

fn emit(app: &AppHandle, id: &str, status: &str, percent: u8) {
    let _ = app.emit("conversion_progress", ProgressEvent {
        id: id.to_string(),
        status: status.to_string(),
        percent,
        error_msg: None,
        output_path: None,
    });
}

/// Gets total duration of media file in microseconds using ffprobe.
async fn get_duration_us(input_path: &Path) -> Option<u64> {
    let output = Command::new("ffprobe")
        .arg("-v").arg("error")
        .arg("-show_entries").arg("format=duration")
        .arg("-of").arg("csv=p=0")
        .arg(input_path)
        .output()
        .await
        .ok()?;

    let s = String::from_utf8_lossy(&output.stdout);
    let secs: f64 = s.trim().parse().ok()?;
    Some((secs * 1_000_000.0) as u64)
}

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    emit(app_handle, file_id, "converting", 5);

    let total_us = get_duration_us(input_path).await;

    let mut child = Command::new("ffmpeg")
        .arg("-y")
        .arg("-i").arg(input_path)
        .arg("-progress").arg("pipe:1")
        .arg("-nostats")
        .arg(output_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn FFmpeg: {}", e))?;

    emit(app_handle, file_id, "converting", 10);

    // Parse progress from stdout
    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        let mut lines = reader.lines();

        while let Ok(Some(line)) = lines.next_line().await {
            if line.starts_with("out_time_us=") {
                if let Some(total) = total_us {
                    if let Ok(current_us) = line.trim_start_matches("out_time_us=").parse::<u64>() {
                        let pct = ((current_us as f64 / total as f64) * 90.0) as u8 + 10;
                        let clamped = pct.min(99);
                        emit(app_handle, file_id, "converting", clamped);
                    }
                }
            }
        }
    }

    let status = child.wait().await.map_err(|e| format!("FFmpeg process error: {}", e))?;

    if !status.success() {
        return Err("FFmpeg conversion failed".into());
    }

    Ok(())
}
```

**Step 2: Test manually**

Run: `npm run tauri dev`
Drop an `.mp4` file, select `.mp3`, click "Forge All".
Expected: Real progress bar advancing smoothly, then green checkmark.

**Step 3: Commit**

```bash
git add src-tauri/src/commands/engines/ffmpeg.rs
git commit -m "feat: implement FFmpeg engine with real-time progress parsing"
```

---

## Task 18: Implement LibreOffice Engine

**Files:**
- Modify: `src-tauri/src/commands/engines/libreoffice.rs`

**Step 1: Implement LibreOffice headless conversion**

Replace `src-tauri/src/commands/engines/libreoffice.rs`:

```rust
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Emitter};
use crate::commands::convert::ProgressEvent;

fn emit(app: &AppHandle, id: &str, status: &str, percent: u8) {
    let _ = app.emit("conversion_progress", ProgressEvent {
        id: id.to_string(),
        status: status.to_string(),
        percent,
        error_msg: None,
        output_path: None,
    });
}

/// Finds the LibreOffice binary path.
fn find_soffice() -> Result<String, String> {
    // macOS paths
    let candidates = [
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    ];

    for path in &candidates {
        if Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }

    // Fallback: try PATH
    which("soffice")
}

fn which(cmd: &str) -> Result<String, String> {
    let output = Command::new("which")
        .arg(cmd)
        .output()
        .map_err(|e| format!("Cannot find {}: {}", cmd, e))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(format!("{} not found in PATH", cmd))
    }
}

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    let soffice = find_soffice()?;

    emit(app_handle, file_id, "converting", 10);

    let output_format = output_path
        .extension()
        .and_then(|e| e.to_str())
        .ok_or("Cannot determine output format")?;

    let output_dir = output_path
        .parent()
        .ok_or("Cannot determine output directory")?;

    // LibreOffice writes to --outdir with auto-generated filename
    let output = Command::new(&soffice)
        .arg("--headless")
        .arg("--convert-to").arg(output_format)
        .arg("--outdir").arg(output_dir)
        .arg(input_path)
        .output()
        .map_err(|e| format!("Failed to run LibreOffice: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("LibreOffice error: {}", stderr));
    }

    emit(app_handle, file_id, "converting", 90);

    // LibreOffice names the output as <stem>.<format> in outdir
    // Rename to our expected output path if different
    let lo_output = output_dir.join(format!(
        "{}.{}",
        input_path.file_stem().and_then(|s| s.to_str()).unwrap_or("output"),
        output_format
    ));

    if lo_output != output_path && lo_output.exists() {
        std::fs::rename(&lo_output, output_path)
            .map_err(|e| format!("Failed to rename output: {}", e))?;
    }

    Ok(())
}
```

**Step 2: Test manually**

Run: `npm run tauri dev`
Drop a `.docx` file, select `.pdf`, click "Forge All".
Expected: Progress 10% → 90% → done. PDF output in `~/Downloads/SimurghForge/`.

**Step 3: Commit**

```bash
git add src-tauri/src/commands/engines/libreoffice.rs
git commit -m "feat: implement LibreOffice headless engine for document conversion"
```

---

## Task 19: Implement Pandoc Engine

**Files:**
- Modify: `src-tauri/src/commands/engines/pandoc.rs`

**Step 1: Implement Pandoc conversion (with LibreOffice chain for PDF)**

Replace `src-tauri/src/commands/engines/pandoc.rs`:

```rust
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Emitter};
use crate::commands::convert::ProgressEvent;

fn emit(app: &AppHandle, id: &str, status: &str, percent: u8) {
    let _ = app.emit("conversion_progress", ProgressEvent {
        id: id.to_string(),
        status: status.to_string(),
        percent,
        error_msg: None,
        output_path: None,
    });
}

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    let output_format = output_path
        .extension()
        .and_then(|e| e.to_str())
        .ok_or("Cannot determine output format")?;

    emit(app_handle, file_id, "converting", 10);

    if output_format == "pdf" {
        // Chain: Pandoc → temp DOCX → LibreOffice → PDF
        convert_via_libreoffice(input_path, output_path, app_handle, file_id).await
    } else {
        // Direct Pandoc conversion
        convert_direct(input_path, output_path, app_handle, file_id).await
    }
}

async fn convert_direct(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    let output = Command::new("pandoc")
        .arg(input_path)
        .arg("-o").arg(output_path)
        .output()
        .map_err(|e| format!("Failed to run Pandoc: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Pandoc error: {}", stderr));
    }

    emit(app_handle, file_id, "converting", 100);
    Ok(())
}

async fn convert_via_libreoffice(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    // Step 1: Pandoc → temp DOCX
    let temp_dir = std::env::temp_dir();
    let temp_docx = temp_dir.join(format!("simurgh_pandoc_{}.docx", file_id));

    let pandoc_output = Command::new("pandoc")
        .arg(input_path)
        .arg("-o").arg(&temp_docx)
        .output()
        .map_err(|e| format!("Failed to run Pandoc: {}", e))?;

    if !pandoc_output.status.success() {
        let stderr = String::from_utf8_lossy(&pandoc_output.stderr);
        return Err(format!("Pandoc error: {}", stderr));
    }

    emit(app_handle, file_id, "converting", 50);

    // Step 2: LibreOffice temp DOCX → PDF
    let result = super::libreoffice::convert(
        &temp_docx,
        output_path,
        app_handle,
        file_id,
    ).await;

    // Cleanup temp file
    let _ = std::fs::remove_file(&temp_docx);

    result
}
```

**Step 2: Test manually**

Run: `npm run tauri dev`
Drop a `.md` file, select `.pdf`, click "Forge All".
Expected: Progress through Pandoc (50%) then LibreOffice (90%) → done.

Drop a `.md` file, select `.html`, click "Forge All".
Expected: Direct Pandoc conversion, fast.

**Step 3: Commit**

```bash
git add src-tauri/src/commands/engines/pandoc.rs
git commit -m "feat: implement Pandoc engine with LibreOffice chain for PDF output"
```

---

## Task 20: Implement Pandas Engine + Python Script

**Files:**
- Create: `scripts/pandas_convert.py`
- Modify: `src-tauri/src/commands/engines/pandas.rs`

**Step 1: Write the Python conversion script**

Write `scripts/pandas_convert.py`:

```python
#!/usr/bin/env python3
"""Standalone data format converter using Pandas.
Called by Simurgh Forge Rust backend.
Usage: python3 pandas_convert.py <input_path> <output_path>
"""

import sys
import os
import pandas as pd


def read_data(input_path: str) -> pd.DataFrame:
    ext = os.path.splitext(input_path)[1].lower()
    match ext:
        case ".csv":
            return pd.read_csv(input_path)
        case ".tsv":
            return pd.read_csv(input_path, sep="\t")
        case ".xlsx":
            return pd.read_excel(input_path)
        case ".json":
            return pd.read_json(input_path)
        case ".parquet":
            return pd.read_parquet(input_path)
        case _:
            raise ValueError(f"Unsupported input format: {ext}")


def write_data(df: pd.DataFrame, output_path: str) -> None:
    ext = os.path.splitext(output_path)[1].lower()
    match ext:
        case ".csv":
            df.to_csv(output_path, index=False)
        case ".tsv":
            df.to_csv(output_path, sep="\t", index=False)
        case ".xlsx":
            df.to_excel(output_path, index=False)
        case ".json":
            df.to_json(output_path, orient="records", indent=2)
        case ".parquet":
            df.to_parquet(output_path, index=False)
        case _:
            raise ValueError(f"Unsupported output format: {ext}")


def main():
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input_path> <output_path>", file=sys.stderr)
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]

    if not os.path.exists(input_path):
        print(f"Input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    try:
        df = read_data(input_path)
        write_data(df, output_path)
        print(f"OK: Converted {input_path} -> {output_path}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
```

**Step 2: Test Python script standalone**

Run: `echo "name,age\nAlice,30\nBob,25" > /tmp/test.csv && python3 scripts/pandas_convert.py /tmp/test.csv /tmp/test.json && cat /tmp/test.json`
Expected: JSON array of records printed.

**Step 3: Implement Rust Pandas engine**

Replace `src-tauri/src/commands/engines/pandas.rs`:

```rust
use std::path::Path;
use std::process::Command;
use tauri::{AppHandle, Emitter};
use crate::commands::convert::ProgressEvent;

fn emit(app: &AppHandle, id: &str, status: &str, percent: u8) {
    let _ = app.emit("conversion_progress", ProgressEvent {
        id: id.to_string(),
        status: status.to_string(),
        percent,
        error_msg: None,
        output_path: None,
    });
}

/// Finds the pandas_convert.py script relative to the app.
fn find_script() -> Result<String, String> {
    // In dev: scripts/ is at project root
    // In prod: bundled in app resources
    let candidates = [
        "scripts/pandas_convert.py",
        "../scripts/pandas_convert.py",
    ];

    for path in &candidates {
        if Path::new(path).exists() {
            return Ok(path.to_string());
        }
    }

    // Try absolute path from CARGO_MANIFEST_DIR (dev mode)
    if let Ok(manifest) = std::env::var("CARGO_MANIFEST_DIR") {
        let dev_path = Path::new(&manifest).parent().unwrap().join("scripts/pandas_convert.py");
        if dev_path.exists() {
            return Ok(dev_path.to_string_lossy().to_string());
        }
    }

    Err("pandas_convert.py script not found".into())
}

pub async fn convert(
    input_path: &Path,
    output_path: &Path,
    app_handle: &AppHandle,
    file_id: &str,
) -> Result<(), String> {
    let script = find_script()?;

    emit(app_handle, file_id, "converting", 10);

    let output = Command::new("python3")
        .arg(&script)
        .arg(input_path)
        .arg(output_path)
        .output()
        .map_err(|e| format!("Failed to run Python: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Pandas error: {}", stderr));
    }

    emit(app_handle, file_id, "converting", 100);
    Ok(())
}
```

**Step 4: Commit**

```bash
git add scripts/pandas_convert.py src-tauri/src/commands/engines/pandas.rs
git commit -m "feat: implement Pandas engine with Python script for data format conversion"
```

---

## Task 21: Add ZIP Bundling for Batch Output

**Files:**
- Modify: `src-tauri/Cargo.toml` (add `zip` crate)
- Modify: `src-tauri/src/commands/convert.rs`

**Step 1: Add zip dependency**

Add to `[dependencies]` in `src-tauri/Cargo.toml`:

```toml
zip = "2"
```

**Step 2: Add ZIP bundling function to convert.rs**

Add to `src-tauri/src/commands/convert.rs`, after the existing imports:

```rust
use std::fs::File;
use std::io::{Read, Write};

fn create_zip_bundle(output_dir: &str, file_count: usize) -> Result<Option<String>, String> {
    if file_count < 2 {
        return Ok(None);
    }

    let dir = Path::new(output_dir);
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    let zip_path = dir.join(format!("SimurghForge_{}.zip", timestamp));
    let file = File::create(&zip_path).map_err(|e| format!("Cannot create ZIP: {}", e))?;
    let mut zip = zip::ZipWriter::new(file);

    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    // Add all non-zip files in the output directory
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|e| e.to_str()) != Some("zip") {
                let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("file");
                zip.start_file(name, options).map_err(|e| format!("ZIP error: {}", e))?;
                let mut f = File::open(&path).map_err(|e| format!("Cannot read file: {}", e))?;
                let mut buf = Vec::new();
                f.read_to_end(&mut buf).map_err(|e| format!("Read error: {}", e))?;
                zip.write_all(&buf).map_err(|e| format!("Write error: {}", e))?;
            }
        }
    }

    zip.finish().map_err(|e| format!("ZIP finalize error: {}", e))?;
    Ok(Some(zip_path.to_string_lossy().to_string()))
}
```

Then update the batch completion section in `convert_batch()` to call it:

```rust
    // After all handles complete, before emitting batch_complete:
    let zip_path = if ok > 1 {
        create_zip_bundle(&output_dir, ok).unwrap_or(None)
    } else {
        None
    };
```

And update the `BatchCompleteEvent` emit to use `zip_path`.

**Step 3: Run build**

Run: `cd src-tauri && cargo build`
Expected: Compiles with no errors.

**Step 4: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/commands/convert.rs
git commit -m "feat: add ZIP bundling for batch outputs with 2+ files"
```

---

## Task 22: Configure Tauri Permissions and Window Settings

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify or create: `src-tauri/capabilities/default.json`

**Step 1: Update tauri.conf.json**

Set app metadata, window size, and title:

```json
{
  "productName": "Simurgh Forge",
  "version": "0.1.0",
  "identifier": "com.raouf.simurghforge",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Simurgh Forge",
        "width": 720,
        "height": 800,
        "resizable": true,
        "decorations": true,
        "transparent": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

**Step 2: Configure capabilities for file system and drag-drop**

Write `src-tauri/capabilities/default.json`:

```json
{
  "identifier": "default",
  "description": "Default permissions for Simurgh Forge",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:event:default",
    "core:event:allow-listen",
    "core:event:allow-emit"
  ]
}
```

**Step 3: Verify app launches with correct window**

Run: `npm run tauri dev`
Expected: Window titled "Simurgh Forge", 720x800, full forge theme.

**Step 4: Commit**

```bash
git add src-tauri/tauri.conf.json src-tauri/capabilities/
git commit -m "feat: configure Tauri window settings and security permissions"
```

---

## Task 23: Add .gitignore and Final Project Cleanup

**Files:**
- Create: `.gitignore`
- Remove: any Vite boilerplate files (logo SVGs, default CSS)

**Step 1: Write .gitignore**

Write `.gitignore`:

```
# Dependencies
node_modules/

# Build output
dist/
src-tauri/target/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.local

# Tauri
src-tauri/gen/
```

**Step 2: Remove Vite boilerplate**

Delete default Vite assets if present:
```bash
rm -f src/assets/react.svg public/vite.svg src/App.css
```

**Step 3: Commit**

```bash
git add .gitignore
git rm --cached -r node_modules/ 2>/dev/null || true
git add -A
git commit -m "chore: add .gitignore and clean up Vite boilerplate"
```

---

## Task 24: End-to-End Integration Test

**Files:**
- None (manual verification)

**Step 1: Verify all engines work**

Run: `npm run tauri dev`

Test each conversion path:
1. **Image:** Drop `.png` → convert to `.jpg` (ImageMagick)
2. **Audio/Video:** Drop `.mp4` → convert to `.mp3` (FFmpeg)
3. **Document:** Drop `.docx` → convert to `.pdf` (LibreOffice)
4. **Markup:** Drop `.md` → convert to `.html` (Pandoc)
5. **Markup→PDF:** Drop `.md` → convert to `.pdf` (Pandoc + LibreOffice chain)
6. **Data:** Drop `.csv` → convert to `.json` (Pandas)
7. **Batch:** Drop 3+ files → "Forge All" → verify concurrent progress bars
8. **ZIP:** Batch with 2+ successful → verify ZIP created in output dir
9. **Settings:** Open settings, change output dir, verify next conversion uses it
10. **Error:** Drop an unsupported file → verify error state on FileCard

Expected: All 10 scenarios pass.

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: Simurgh Forge v0.1.0 — universal file converter with 5 engines"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Install system deps | Rust, LibreOffice, Python packages |
| 2 | Scaffold Tauri + React + Vite + TS | package.json, vite.config.ts, src-tauri/ |
| 3 | Design system (forge theme) | index.css, App.tsx, index.html |
| 4 | Types + format map + IPC | types/conversion.ts, lib/formatMap.ts, lib/ipc.ts |
| 5 | useConversionQueue hook | hooks/useConversionQueue.ts |
| 6 | useIPCEvents hook | hooks/useIPCEvents.ts |
| 7 | ProgressBar component | components/ProgressBar.tsx |
| 8 | FormatSelector component | components/FormatSelector.tsx |
| 9 | FileCard component | components/FileCard.tsx |
| 10 | DropZone component | components/DropZone.tsx |
| 11 | QueuePanel component | components/QueuePanel.tsx |
| 12 | Settings component | components/Settings.tsx |
| 13 | Wire App.tsx + mock backend | App.tsx, lib.rs |
| 14 | mime.rs + sanitise.rs | utils/mime.rs, utils/sanitise.rs |
| 15 | Router + convert orchestrator | commands/router.rs, commands/convert.rs |
| 16 | ImageMagick engine | engines/imagemagick.rs |
| 17 | FFmpeg engine (real progress) | engines/ffmpeg.rs |
| 18 | LibreOffice engine | engines/libreoffice.rs |
| 19 | Pandoc engine (+ LO chain) | engines/pandoc.rs |
| 20 | Pandas engine + Python script | engines/pandas.rs, scripts/pandas_convert.py |
| 21 | ZIP bundling | commands/convert.rs |
| 22 | Tauri permissions + window | tauri.conf.json, capabilities/ |
| 23 | .gitignore + cleanup | .gitignore |
| 24 | End-to-end integration test | Manual verification |
