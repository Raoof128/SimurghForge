# Contributing to Simurgh Forge

Thank you for your interest in contributing. This guide covers how to report bugs, suggest features, and submit code changes.

## Reporting Bugs

Open a [GitHub Issue](https://github.com/Raoof128/SimurghForge/issues) with:

- Operating system and version (e.g., macOS 15.2, Apple M3)
- Steps to reproduce
- Expected vs actual behavior
- Input file format and size (do not attach sensitive files)
- Error messages from the app or terminal

## Suggesting Features

Open a GitHub Issue with the `enhancement` label. Describe:

- The problem you are trying to solve
- Your proposed solution
- Alternatives you considered

## Development Setup

### Prerequisites

- [Rust](https://rustup.rs/) (1.77+)
- [Node.js](https://nodejs.org/) (22+)
- [Homebrew](https://brew.sh/) (macOS)

### System Dependencies

```bash
brew install ffmpeg imagemagick pandoc
brew install --cask libreoffice
pip3 install pillow pandas openpyxl pyarrow
```

### Clone and Run

```bash
git clone https://github.com/Raoof128/SimurghForge.git
cd SimurghForge
npm install
npm run tauri dev
```

### Useful Commands

```bash
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
npm run type-check    # TypeScript type check

cd src-tauri
cargo fmt             # Rust format
cargo clippy          # Rust lint
cargo test            # Rust tests
```

## Code Style

**TypeScript/React:**
- Enforced by ESLint and Prettier (configs in repo root)
- Run `npm run lint:fix && npm run format` before committing

**Rust:**
- Enforced by `rustfmt` (config in `src-tauri/rustfmt.toml`)
- Run `cargo fmt` before committing
- Address `cargo clippy` warnings

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add HEIF image support
fix: resolve path traversal in output directory
docs: update README with new format list
chore: bump Tauri to 2.11
```

Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes with tests
4. Run all checks: `npm run lint && npm run type-check && cd src-tauri && cargo test`
5. Commit with a conventional commit message
6. Push and open a PR against `main`
7. Describe what changed and why in the PR body

## Adding a New Engine

1. Create `src-tauri/src/commands/engines/my_engine.rs`
2. Implement the standard contract:
   ```rust
   pub async fn convert(
       input_path: &Path,
       output_path: &Path,
       app_handle: &AppHandle,
       file_id: &str,
       options: &ConversionOptions,
   ) -> Result<(), String>
   ```
3. Register in `src-tauri/src/commands/engines/mod.rs`
4. Add routing in `src-tauri/src/commands/router.rs`
5. Add formats in `src/lib/formatMap.ts`

## Adding a New Format

1. Add the input-output mapping in `src/lib/formatMap.ts` (`FORMAT_MAP_DETAILED`)
2. Add MIME detection in `src-tauri/src/utils/mime.rs` (if not extension-based)
3. Add routing in `src-tauri/src/commands/router.rs`
4. Test the conversion manually

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
