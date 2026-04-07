# Simurgh Forge

**Universal file converter — local-first, batch-oriented, zero cloud.**

[![CI](https://github.com/Raoof128/SimurghForge/actions/workflows/ci.yml/badge.svg)](https://github.com/Raoof128/SimurghForge/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Rust](https://img.shields.io/badge/rust-1.77%2B-orange.svg)](https://www.rust-lang.org/)
[![TypeScript](https://img.shields.io/badge/typescript-6.x-blue.svg)](https://www.typescriptlang.org/)

Simurgh Forge is a **Tauri v2** desktop app with a **React 19** + **TypeScript** UI and a **Rust** backend. It converts files between compatible formats with per-file progress, quality controls, and configurable concurrency. Processing stays on your machine: no account, no upload pipeline.

**Primary target:** macOS (`.app` bundle). The Rust backend uses portable paths and cross-platform conventions where practical for future builds.

---

## Table of contents

- [Features](#features)
- [Documentation](#documentation)
- [Tech stack](#tech-stack)
- [Repository layout](#repository-layout)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Testing & quality](#testing--quality)
- [Contributing & community](#contributing--community)
- [Security](#security)
- [License](#license)

---

## Features

- **49 supported formats** — images, documents, audio, video, structured data (see tables in [docs/USAGE.md](docs/USAGE.md))
- **9 engines** — 4 native Rust + 5 CLI (FFmpeg, LibreOffice, Pandoc, ImageMagick, Python/Pandas), with automatic routing
- **Quality controls** — Presets (Low / Medium / High / Lossless) and per-format advanced options
- **Batch queue** — Up to 50 files, concurrency 1–8, real-time progress (including FFmpeg-based percentage when available)
- **UX** — Drag-and-drop, browse dialog, dark forge-themed UI, i18n-ready string keys, keyboard shortcuts (Cmd/Ctrl)
- **Settings** — Output directory, max file size, concurrency; persisted in the OS config directory

---

## Documentation

| Resource | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [docs/IPC_REFERENCE.md](docs/IPC_REFERENCE.md) | Tauri commands and events |
| [docs/USAGE.md](docs/USAGE.md) | User and developer usage |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, style, PR process |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards |
| [CHANGELOG.md](CHANGELOG.md) | Release notes |

Design history notes live under [docs/plans/](docs/plans/).

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Shell | Tauri 2 |
| UI | React 19, Vite 8, Tailwind CSS 4 |
| Desktop IPC | Tauri invoke + events |
| Backend | Rust 2021, Tokio |
| Tooling | ESLint, Prettier, rustfmt, Clippy |

---

## Repository layout

```
├── src/                 # React / TypeScript frontend
│   ├── i18n/            # UI strings (default locale)
│   ├── components/
│   ├── hooks/
│   ├── lib/             # IPC client, format map
│   └── types/
├── src-tauri/           # Rust workspace (Tauri backend)
│   ├── src/commands/    # convert, router, engines
│   ├── capabilities/    # Tauri v2 permissions
│   └── ...
├── docs/                # Architecture, IPC, usage
├── scripts/             # Helper scripts (e.g. Pandas)
├── .github/workflows/   # CI
└── AGENT.md             # Maintainer automation notes
```

---

## Getting started

### Prerequisites

- **macOS** 12+ (supported for development and release builds)
- [Rust](https://rustup.rs/) **1.77+**
- [Node.js](https://nodejs.org/) **22+**
- [Homebrew](https://brew.sh/) (for native CLIs)

### System dependencies

```bash
brew install ffmpeg imagemagick pandoc
brew install --cask libreoffice
pip3 install pillow pandas openpyxl pyarrow
```

### Clone and run (development)

```bash
git clone https://github.com/Raoof128/SimurghForge.git
cd SimurghForge
npm install
npm run tauri:dev
```

### Production build (macOS)

```bash
npm run tauri:build
```

Artifacts appear under `src-tauri/target/release/bundle/macos/`.

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server only (web UI) |
| `npm run tauri:dev` | Full Tauri app in dev mode |
| `npm run build` | Typecheck + Vite production build |
| `npm run tauri:build` | Production `.app` (macOS) |
| `npm run check` | Typecheck + ESLint + Prettier check + Vite build |
| `npm run lint` / `npm run lint:fix` | ESLint |
| `npm run format` / `npm run format:check` | Prettier |
| `npm run type-check` | `tsc -b --noEmit` |
| `npm run test:rust` | `cargo test` in `src-tauri` |
| `npm run fmt:rust` | `cargo fmt` in `src-tauri` |
| `npm run clippy` | Clippy with `-D warnings` |

---

## Testing & quality

- **Frontend:** static analysis via TypeScript, ESLint, Prettier; production build must succeed.
- **Backend:** `cargo test`, `cargo fmt --check`, `cargo clippy -- -D warnings` (see `npm run` scripts).
- **E2E:** Not part of this repository (by project policy); manual QA on macOS is recommended before releases.

CI runs on **GitHub Actions** (see [.github/workflows/ci.yml](.github/workflows/ci.yml)): frontend checks, Rust checks on Linux, macOS Tauri bundle build.

---

## Contributing & community

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for branch workflow, conventional commits, and how to add engines/formats.
- Abide by the [Code of Conduct](CODE_OF_CONDUCT.md).
- Security-sensitive reports: see [SECURITY.md](SECURITY.md) (do not file public issues for undisclosed vulnerabilities).

---

## Security

Path handling uses canonicalisation and **parent-directory component** detection (not naive substring checks). Subprocesses are invoked with structured arguments (no shell interpolation). Details and reporting: [SECURITY.md](SECURITY.md).

---

## License

[MIT License](LICENSE) — Copyright (c) 2026 Raouf Abedini.

---

## Acknowledgements

Built with [Tauri](https://tauri.app/), [React](https://react.dev/), and the open-source crates and CLI tools listed in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
