# Agent rules — Simurgh Forge

## Project

- Tauri 2 + React 19 + TypeScript + Vite + Tailwind CSS v4.
- Frontend lives under `src/`; Rust backend under `src-tauri/`.

## Code style

- TypeScript: prefer `type` over `interface` for new types unless extending; avoid `any`.
- Match existing file patterns; minimal diffs; no drive-by refactors.
- User-visible copy must go through `src/i18n/strings.ts` (no hardcoded UI strings).

## Verification

- Run `npm run lint`, `npm run type-check`, and `npm run build` before claiming work is complete.
- For Rust changes: `cargo test` (and `cargo clippy` when practical) in `src-tauri/`.

## Logging changes

- Append notable changes to `CHANGELOG.md` with the Raouf template when modifying behaviour or UX.

---

### Raouf: 2026-04-07 — Frontend hardening

- See `CHANGELOG.md` under **[Unreleased]** for the full entry (i18n module, IPC/DropZone cleanup, a11y, build fix).

### Raouf: 2026-04-07 — Tauri/Rust backend

- See `CHANGELOG.md` under **[Unreleased]** for portable paths, `open_folder`, batch limits, output extension sanitization, and `cargo test` verification.

### Raouf: 2026-04-07 — Batch conversion fix

- See **batch conversion & path hardening** in `CHANGELOG.md` **[Unreleased]** (empty `outputDir`, `..` in filenames, `maxInputFileBytes` IPC).
