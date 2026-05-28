# @wdio-desktop-mobile-example/tauri

Tauri test application for WebdriverIO desktop testing.

## Overview

This package provides a Tauri application with comprehensive WebdriverIO testing support across three driver providers:
- **embedded** - Native WebDriver (recommended)
- **official** - Community tauri-driver (Windows/Linux only)
- **crabnebula** - Commercial driver (all platforms)

## Prerequisites

- Node.js 18+
- Rust (latest stable)
- Platform-specific dependencies (see main README)

## Installation

```bash
pnpm install
```

## Development

```bash
# Run development server
pnpm dev

# Build the app
pnpm build

# Build just the frontend
pnpm build:js

# Build just the Rust backend
pnpm build:rust
```

## Testing

### Run Tests

```bash
# Default (embedded driver)
pnpm test

# Specific drivers
pnpm test:embedded
pnpm test:official      # Windows/Linux only
pnpm test:crabnebula    # Requires CN_API_KEY on macOS
```

### CI

```bash
pnpm ci
pnpm ci:embedded
pnpm ci:official
pnpm ci:crabnebula
```

## Project Structure

The Tauri example is laid out as a **Cargo workspace** with `target/` at the workspace root and the Rust crate nested under `src-tauri/`. This is the realistic shape most non-trivial Tauri apps take. `@wdio/tauri-service` trusts the user-supplied binary path verbatim, so any layout works, but this is the canonical reference (see [webdriverio/desktop-mobile#295](https://github.com/webdriverio/desktop-mobile/issues/295) for the rationale).

```
.
├── Cargo.toml           # Workspace root: [workspace] members = ["src-tauri"]
├── src-tauri/           # Rust backend (workspace member)
│   ├── src/
│   │   └── main.rs     # Tauri commands and setup
│   ├── capabilities/   # Tauri permissions
│   ├── Cargo.toml      # Member crate
│   └── tauri.conf.json # Tauri configuration
├── target/              # Cargo workspace build output
├── src/                # Frontend source (if needed)
├── index.html          # Main UI
├── splash.html         # Splash screen
├── test/               # WebdriverIO tests
│   ├── api.spec.ts
│   ├── mocking.spec.ts
│   ├── logging.spec.ts
│   ├── window.spec.ts
│   ├── deeplink.spec.ts
│   ├── multiremote/
│   └── standalone/
├── wdio.official.conf.ts
├── wdio.crabnebula.conf.ts
└── wdio.embedded.conf.ts
```

## Available Tauri Commands

- `get_platform_info` - Get OS, arch, memory, CPU info
- `get_window_bounds` / `set_window_bounds` - Window management
- `minimize_window` / `maximize_window` / `unmaximize_window` - Window state
- `read_clipboard` / `write_clipboard` - Clipboard operations
- `read_file` / `write_file` / `delete_file` - File operations
- `get_current_dir` - Get current working directory
- `generate_test_logs` - Generate test log output
- `get_deep_links` - Get received deep links
- `switch_to_main` - Switch from splash to main window

## Environment Variables

- `ENABLE_SPLASH_WINDOW` - Enable splash screen mode
- `ENABLE_SINGLE_INSTANCE` - Enable single-instance mode (for deeplink tests)
- `WDIO_EMBEDDED_SERVER` - Enable embedded WebDriver server
- `DRIVER_PROVIDER` - Set driver provider (official, crabnebula, embedded)
- `CN_API_KEY` - CrabNebula API key (required for macOS)

## Troubleshooting

### Build Failures

**Rust compilation errors**
- Ensure Rust is up to date: `rustup update`

**Missing dependencies**
- Install platform-specific dependencies (see main README)

### Test Failures

**Binary not found**
- Run `pnpm build` first

**Driver connection errors**
- Check that the correct driver provider is configured
- For CrabNebula, ensure `CN_API_KEY` is set on macOS

## License

MIT
