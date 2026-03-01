# wdio-desktop-mobile-example

Comprehensive testing examples for Electron and Tauri desktop applications using WebdriverIO.

This repository provides working examples of testing desktop applications with:
- **Electron** (CommonJS and ESM builds)
- **Tauri** (with three driver provider modes: official, CrabNebula, and embedded)

## Overview

This monorepo contains three test applications:

| Package | Framework | Module System | Description |
|---------|-----------|---------------|-------------|
| `electron-cjs` | Electron | CommonJS | Traditional Electron app with CJS modules |
| `electron-esm` | Electron | ESM | Modern Electron app with ES modules |
| `tauri` | Tauri | ESM | Rust-based Tauri app with WebDriver support |

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
sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libappindicator3-dev librsvg2-dev patchelf

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
├── electron-cjs/          # Electron app (CommonJS)
│   ├── src/               # Main process, preload, and renderer
│   ├── test/              # WebdriverIO tests
│   └── wdio.conf.js       # WDIO configuration
├── electron-esm/          # Electron app (ESM)
│   ├── src/               # Main process, preload, and renderer
│   ├── test/              # WebdriverIO tests
│   └── wdio.conf.js       # WDIO configuration
└── tauri/                 # Tauri app
    ├── src-tauri/         # Rust backend
    ├── index.html         # Frontend UI
    ├── test/              # WebdriverIO tests
    ├── wdio.official.conf.ts    # Official tauri-driver config
    ├── wdio.crabnebula.conf.ts  # CrabNebula driver config
    └── wdio.embedded.conf.ts    # Embedded driver config
```

## Running Tests

### Electron Tests

```bash
# Test Electron CJS app
pnpm test:electron-cjs

# Test Electron ESM app
pnpm test:electron-esm
```

### Tauri Tests

The Tauri package supports three driver providers:

#### 1. Embedded Driver (Recommended)
Native WebDriver support - no external driver needed. Works on all platforms.

```bash
pnpm test:tauri:embedded
# or
pnpm test:tauri  # default
```

#### 2. Official Driver
Community tauri-driver. Windows and Linux only (no macOS support).

```bash
pnpm test:tauri:official
```

#### 3. CrabNebula Driver
Commercial driver with enhanced features. Requires `CN_API_KEY` for macOS.

```bash
# Linux/Windows (no API key needed)
pnpm test:tauri:crabnebula

# macOS (requires API key)
CN_API_KEY=your_key_here pnpm test:tauri:crabnebula
```

### CI Scripts

```bash
# Run CI for all packages
pnpm ci

# Run CI for specific packages
pnpm ci:electron-cjs
pnpm ci:electron-esm
pnpm ci:tauri:embedded
pnpm ci:tauri:official
pnpm ci:tauri:crabnebula
```

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

### Electron Tests
- API mocking and execution
- Application lifecycle
- DOM interactions
- User interactions

### Tauri Tests
- API execution (`api.spec.ts`)
- Command mocking (`mocking.spec.ts`)
- Logging (`logging.spec.ts`)
- Window management (`window.spec.ts`)
- Deep links (`deeplink.spec.ts`)
- Data types (`execute-data-types.spec.ts`)
- Advanced scenarios (`execute-advanced.spec.ts`)
- Multiremote testing (`multiremote/*.spec.ts`)
- Standalone mode (`standalone/*.spec.ts`)

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
