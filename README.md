# wdio-desktop-mobile-example

[![CI](https://github.com/goosewobbler/wdio-desktop-mobile-example/actions/workflows/ci.yml/badge.svg)](https://github.com/goosewobbler/wdio-desktop-mobile-example/actions/workflows/ci.yml)

Comprehensive testing examples for Electron and Tauri desktop applications using WebdriverIO.

This repository provides working examples of testing desktop applications with:
- **Electron** (CommonJS and ESM builds)
- **Tauri** (with three driver provider modes: official, CrabNebula, and embedded)

## Overview

This monorepo contains four test applications, mirroring the test fixture
taxonomy from the upstream [`wdio-desktop-mobile`](https://github.com/webdriverio/desktop-mobile)
E2E suite.

| Package | Framework | Build Tool | Description |
|---------|-----------|------------|-------------|
| `electron-builder` | Electron | electron-builder | Packaged Electron app, default mode |
| `electron-forge` | Electron | electron-forge | Packaged Electron app, forge variant |
| `electron-script` | Electron | electron-vite | Direct `electron .` execution, no packaging |
| `tauri` | Tauri | tauri-cli | Rust-based Tauri app with three driver providers |

All Electron packages are ESM. CJS coverage lives in upstream's package-tests
suite (out of scope for this manual-verification example).

## Prerequisites

### All Platforms
- **Node.js** 18+ 
- **pnpm** 10.x

### Tauri-Specific Requirements
- **Rust** (latest stable) - [Install Rust](https://www.rust-lang.org/tools/install)
- **Platform-specific dependencies**:

#### macOS
- Xcode Command Line Tools: `xcode-select --install`

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libglib2.0-dev libsoup-3.0-dev libssl-dev libasound2-dev libx11-dev libxcb-shape0-dev libxcb-xfixes0-dev xvfb webkit2gtk-driver

# Fedora
sudo dnf install -y gtk3-devel webkit2gtk3-devel libappindicator-gtk3-devel librsvg2-devel patchelf
```

#### Windows
- Microsoft Visual Studio C++ Build Tools
- WebView2 runtime (usually pre-installed on Windows 10/11)

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run all tests
pnpm test
```

## Package Structure

```
packages/
├── electron-builder/      # Electron app, packaged with electron-builder
├── electron-forge/        # Electron app, packaged with electron-forge
├── electron-script/       # Electron app, direct `electron .` (no packaging)
└── tauri/                 # Tauri app, three driver providers
```

Each Electron package shares the same source layout:
```
src/main/index.ts          # Main process
src/preload/index.ts       # Preload bridge
src/renderer/index.html    # Renderer UI
src/renderer/splash.html   # Splash window
electron.vite.config.ts    # electron-vite build config
wdio.base.conf.ts          # Shared WDIO config bits
wdio.conf.ts               # Standard test type
wdio.multiremote.conf.ts   # Multiremote test type
test/                      # Specs (api, application, dom, interaction, mocking)
test/multiremote/          # Multiremote specs
```

Tauri layout:
```
src-tauri/                 # Rust backend (18 commands + splash + deeplink)
index.html                 # Frontend UI
splash.html                # Splash window
wdio.base.conf.ts          # Shared bits across providers/test-types
wdio.<provider>.conf.ts                # Standard config per provider
wdio.<provider>.<test-type>.conf.ts    # Per-(provider, test-type) configs
test/                      # Specs (api, application, deeplink, execute-*,
                           #   logging*, mocking, window)
test/multiremote/          # Multiremote specs
test/standalone/           # Standalone specs
test/lib/utils.ts          # Log-reading helpers shared by spec files
```

## Running Tests

### Electron Tests

```bash
# Each electron package has standard + multiremote test types.
pnpm test:electron-builder
pnpm test:electron-builder:multiremote

pnpm test:electron-forge
pnpm test:electron-forge:multiremote

pnpm test:electron-script
pnpm test:electron-script:multiremote
```

### Tauri Tests

The Tauri package supports three driver providers, each with four test types
(standard, multiremote, deeplink, standalone).

#### 1. Embedded Driver (Recommended)
Native WebDriver support — no external driver needed. Works on all platforms.

```bash
pnpm test:tauri:embedded                  # standard
pnpm test:tauri:embedded:multiremote
pnpm test:tauri:embedded:deeplink
pnpm test:tauri:embedded:standalone
# `pnpm test:tauri` is an alias for `test:tauri:embedded`.
```

#### 2. Official Driver
Community tauri-driver. Windows and Linux only (no macOS support — config
exits with code 78 on macOS).

```bash
pnpm test:tauri:official                  # standard
pnpm test:tauri:official:multiremote
pnpm test:tauri:official:deeplink
pnpm test:tauri:official:standalone
```

#### 3. CrabNebula Driver
Commercial driver with enhanced features. Requires `CN_API_KEY` on macOS only
(Linux/Windows work without it). Add the key to `.env` (see `.env.example`)
and the scripts will load it automatically via `dotenv`.

```bash
pnpm test:tauri:crabnebula                # standard
pnpm test:tauri:crabnebula:multiremote
pnpm test:tauri:crabnebula:deeplink
pnpm test:tauri:crabnebula:standalone
```

### CI Scripts

```bash
# Run CI for all packages
pnpm ci
```

The `test:*` scripts above already build before testing (via Turbo `dependsOn`),
so a separate `ci:*` per-package script is not needed.

## Driver Provider Comparison

| Provider | Platforms | External Driver | Notes |
|----------|-----------|-----------------|-------|
| **embedded** | All | No | Recommended. Native WebDriver support built into the app |
| **official** | Windows, Linux | Yes | Community driver. Not available on macOS |
| **crabnebula** | All | Yes | Commercial. Best for CI/CD. Requires API key on macOS |

## Tauri App Features

The Tauri test app includes:

- **Window Management**: Get/set bounds, minimize, maximize
- **Platform Info**: OS, arch, memory, CPU info
- **Clipboard**: Read/write clipboard content
- **File Operations**: Read/write/delete files
- **Deep Links**: Protocol handler testing (`testapp://`)
- **Logging**: Backend and frontend log capture
- **Mocking**: Full command mocking support via WDIO Tauri plugin

## Test Coverage

### Electron Tests (per package — builder/forge/script)
- API execution & app metadata (`api.spec.ts`)
- Application lifecycle (`application.spec.ts`)
- DOM queries (`dom.spec.ts`)
- User interactions — keyboard / click (`interaction.spec.ts`)
- Comprehensive Electron API mocking (`mocking.spec.ts` — 80+ assertions)
- Multiremote — two browser instances (`multiremote/api.spec.ts`)

### Tauri Tests
- API execution (`api.spec.ts`)
- Application launch & args (`application.spec.ts`)
- Command mocking (`mocking.spec.ts`)
- Logging — backend + frontend capture (`logging.spec.ts`)
- Logging — embedded WebDriver limitations (`logging.embedded.spec.ts`)
- Logging — tauri-driver console capture (`logging.tauri-driver.spec.ts`)
- Window management — bounds, minimize/restore (`window.spec.ts`)
- Deep links (`deeplink.spec.ts`)
- Data types (`execute-data-types.spec.ts`)
- Advanced scenarios (`execute-advanced.spec.ts`)
- Multiremote — API + advanced patterns + log integration (`multiremote/*.spec.ts`)
- Standalone — API + logging (`standalone/*.spec.ts`)

## Architecture

### Electron Apps
- **Main Process**: Node.js environment with Electron APIs
- **Preload Script**: Secure bridge between main and renderer
- **Renderer**: Chromium-based UI with test interactions

### Tauri App
- **Rust Backend**: Native commands exposed to frontend
- **Frontend**: Web-based UI with Tauri API integration
- **WDIO Plugin**: Enables mocking and backend access
- **WebDriver Plugin**: Embedded WebDriver server (embedded mode only)

## Dependencies

All dependencies are sourced from:
- **npm** - Node.js packages (@wdio/*, electron, tauri-apps/*)
- **crates.io** - Rust crates (tauri, tauri-plugin-wdio, etc.)

## Troubleshooting

### Tauri Build Issues

**Error: `cargo not found`**
- Install Rust: https://www.rust-lang.org/tools/install

**Error: Missing system libraries (Linux)**
- Install platform dependencies (see Prerequisites)

**Error: WebView2 not found (Windows)**
- Install WebView2 runtime or use Windows 10/11

### Test Issues

**Tests timeout on first run**
- Tauri apps need to be built first: `pnpm build`

**Official driver fails on macOS**
- Official driver doesn't support macOS. Use embedded or CrabNebula.

**CrabNebula tests fail on macOS**
- Set `CN_API_KEY` environment variable

## Contributing

This repository is for testing WebdriverIO desktop services. For issues or contributions:

- [@wdio/electron-service](https://github.com/webdriverio/desktop-mobile/tree/main/packages/electron-service)
- [@wdio/tauri-service](https://github.com/webdriverio/desktop-mobile/tree/main/packages/tauri-service)

## License

MIT
