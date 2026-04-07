# Agent rules — Simurgh Forge

## Project

- Tauri 2 + React 19 + TypeScript + Vite + Tailwind CSS v4.
- Frontend lives under `src/`; Rust backend under `src-tauri/`.
- Documentation hub: [docs/README.md](docs/README.md) (architecture, IPC reference, usage).

## Code style

- TypeScript: prefer `type` over `interface` for new types unless extending; avoid `any`.
- Match existing file patterns; minimal diffs; no drive-by refactors.
- User-visible copy must go through `src/i18n/strings.ts` (no hardcoded UI strings).

## Verification

- **`npm ci`** uses **`.npmrc`** (`legacy-peer-deps=true`) so CI matches installs when ESLint/TypeScript majors exceed plugin peer ranges; run a clean install occasionally to mirror CI.
- Run **`npm run check`** before claiming work is complete (typecheck, lint, Prettier, Vite build).
- For Rust changes: **`npm run test:rust`** and **`npm run clippy`** (`-D warnings`).
- Prefer **`npm run fmt:rust`** after editing Rust.

## Logging changes

- Append notable changes to `CHANGELOG.md` with the Raouf template when modifying behaviour or UX.

---

### Raouf: 2026-04-07 — CI (npm + rustfmt)

- See `CHANGELOG.md` under **[Unreleased]** — **CI: npm install + rustfmt** (`.npmrc`, `cargo fmt` across `src-tauri/`).

### Raouf: 2026-04-07 — Frontend hardening

- See `CHANGELOG.md` under **[Unreleased]** for the full entry (i18n module, IPC/DropZone cleanup, a11y, build fix).

### Raouf: 2026-04-07 — Tauri/Rust backend

- See `CHANGELOG.md` under **[Unreleased]** for portable paths, `open_folder`, batch limits, output extension sanitization, and `cargo test` verification.

### Raouf: 2026-04-07 — Batch conversion fix

- See **batch conversion & path hardening** in `CHANGELOG.md` **[Unreleased]** (empty `outputDir`, `..` in filenames, `maxInputFileBytes` IPC).

### Raouf: 2026-04-07 — Documentation & professional tooling

- See **documentation & professional tooling** in `CHANGELOG.md` **[Unreleased]** (CODE_OF_CONDUCT, docs/, CI, PR/issue templates, VS Code, npm scripts, Clippy fixes).
