# Usage

## End users

1. **Install** dependencies listed in the [README](../README.md#prerequisites) (FFmpeg, LibreOffice, Pandoc, ImageMagick, Python packages for Pandas).
2. **Run** the app: `npm run tauri:dev` in development, or install the built `.app` from releases.
3. **Add files** via drag-and-drop or **Browse**.
4. Choose **output format** per file from the dropdown.
5. Optionally open **quality** controls (queued files).
6. Click **Forge All** to run the batch. Outputs go to the configured folder (default `~/Downloads/SimurghForge`).
7. Use **Open** on completed rows to reveal outputs; **Open Folder** on the completion banner opens the output directory.

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| **Cmd+O** / **Ctrl+O** | Browse files |
| **Cmd+Enter** / **Ctrl+Enter** | Forge all (when not busy) |
| **Cmd+,** / **Ctrl+,** | Settings |
| **Escape** | Close settings |

## Developers

### Quality gates before a PR

```bash
npm run check          # type-check + lint + Prettier check + Vite build
npm run test:rust      # cargo test
npm run clippy         # clippy -D warnings
```

### Typical workflow

```bash
npm install
npm run tauri:dev
```

### Adding a format

See [CONTRIBUTING.md](../CONTRIBUTING.md#adding-a-new-format).

### Inspecting IPC

Use Tauri devtools or add temporary `console.log` in `src/lib/ipc.ts` callers; backend logging uses the `log` crate where enabled.
