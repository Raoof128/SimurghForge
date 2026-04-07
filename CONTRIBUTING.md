# Contributing to Simurgh Forge

Thank you for helping improve Simurgh Forge. This document describes how we work, how to set up a dev environment, and what we expect in pull requests.

## Code of conduct

All contributors must follow the [Code of Conduct](CODE_OF_CONDUCT.md). Reports may be routed through maintainers or the contact described in [SECURITY.md](SECURITY.md) for sensitive matters.

## Reporting bugs

Open a [GitHub issue](https://github.com/Raoof128/SimurghForge/issues) using the bug template when possible. Include:

- OS and version (e.g. macOS 15.x, Apple Silicon)
- App version or commit SHA
- Steps to reproduce
- Expected vs actual behaviour
- Input type and approximate size (do **not** attach confidential files)
- Relevant error text from the terminal if running `npm run tauri:dev`

## Suggesting features

Open an issue with the **enhancement** label (or use the feature template). Describe the problem, proposed solution, and alternatives you considered.

## Development setup

### Prerequisites

- [Rust](https://rustup.rs/) (1.77+)
- [Node.js](https://nodejs.org/) (22+)
- On **macOS**: [Homebrew](https://brew.sh/) for FFmpeg, ImageMagick, Pandoc, LibreOffice, and Python packages for Pandas conversions

### Install system dependencies (macOS)

```bash
brew install ffmpeg imagemagick pandoc
brew install --cask libreoffice
pip3 install pillow pandas openpyxl pyarrow
```

### Clone and run

```bash
git clone https://github.com/Raoof128/SimurghForge.git
cd SimurghForge
npm install
npm run tauri:dev
```

### Commands reference

| Command | Purpose |
|---------|---------|
| `npm run check` | **Recommended** before commit: `type-check` + `lint` + `format:check` + `build` |
| `npm run lint` / `npm run lint:fix` | ESLint (`eslint.config.js`) |
| `npm run format` / `npm run format:check` | Prettier (`.prettierrc`) |
| `npm run type-check` | TypeScript `tsc -b --noEmit` |
| `npm run build` | Vite production build |
| `npm run test:rust` | `cargo test` in `src-tauri` |
| `npm run fmt:rust` | `cargo fmt` (see `src-tauri/rustfmt.toml`) |
| `npm run clippy` | `cargo clippy --all-targets -- -D warnings` |

Editor settings: [.editorconfig](.editorconfig) enforces basic formatting; VS Code users can install recommended extensions from [.vscode/extensions.json](.vscode/extensions.json).

## Code style

### TypeScript / React

- ESLint + Prettier are authoritative; run `npm run check` before pushing.
- User-visible strings belong in `src/i18n/strings.ts` (no hardcoded copy in components).

### Rust

- `rustfmt`: run `npm run fmt:rust` (or `cd src-tauri && cargo fmt`).
- `clippy`: run `npm run clippy`; CI treats warnings as errors (`-D warnings`).
- Prefer explicit error messages returned as `Result<String, String>` for IPC-facing functions.

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add HEIC output via ImageMagick
fix: reject empty output directory before spawn
docs: refresh IPC reference for convert_batch
chore: tighten CI clippy
```

Common types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`.

## Pull request process

1. Fork and branch from `main` (`feat/…`, `fix/…`, `docs/…`).
2. Implement changes with **unit tests** for Rust when behaviour is non-trivial.
3. Run **`npm run check`** and **`npm run test:rust`** (and `npm run clippy` if you touched Rust).
4. Open a PR against `main`; fill in the PR template.
5. Keep PRs focused; unrelated refactors belong in separate PRs.

## Adding an engine

1. Add `src-tauri/src/commands/engines/<name>.rs` implementing:
   `convert(input_path, output_path, app_handle, file_id, options) -> Result<(), String>`.
2. Export the module in `src-tauri/src/commands/engines/mod.rs`.
3. Add an `Engine` variant and match arm in `router.rs` and `convert.rs`.

## Adding a format

1. Update `src/lib/formatMap.ts` (`FORMAT_MAP_DETAILED` and derived maps).
2. Add or adjust routing in `src-tauri/src/commands/router.rs`.
3. Extend `src-tauri/src/utils/mime.rs` if detection cannot rely on extension fallback.
4. Run conversions manually and add or extend Rust tests where logic is non-trivial.

Architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
