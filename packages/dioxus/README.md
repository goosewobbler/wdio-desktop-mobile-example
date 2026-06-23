# @wdio-desktop-mobile-example/dioxus

Manual-verification test package for [`@wdio/dioxus-service`](https://github.com/webdriverio/desktop-mobile/tree/main/packages/dioxus-service). It contains a Rust/Dioxus counter app and a full WebdriverIO spec suite that exercises the service's public API.

## What's in this package

| Path | Description |
|------|-------------|
| `Cargo.toml` / `src/main.rs` | Single-crate Dioxus desktop app (counter UI + WDIO commands) |
| `wdio.base.conf.ts` | Shared capability builder, service factory, log-dir helpers |
| `wdio.conf.ts` | Standard test run |
| `wdio.multiremote.conf.ts` | Two simultaneous browser instances |
| `wdio.window.conf.ts` | Window management tests |
| `wdio.visual.conf.ts` | Visual regression (screenshot comparison) |
| `wdio.video.conf.ts` | Video recording |
| `test/` | Full spec suite |
| `scripts/run-standalone.mjs` | Sequential standalone spec runner |

## Prerequisites

### All platforms
- **Node.js** 22.12+
- **pnpm** 10.x
- **Rust** (latest stable) — [Install Rust](https://www.rust-lang.org/tools/install)

### Linux
```bash
sudo apt-get update
sudo apt-get install -y \
  libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev \
  librsvg2-dev patchelf libglib2.0-dev libsoup-3.0-dev \
  libssl-dev libasound2-dev libx11-dev \
  libxcb-shape0-dev libxcb-xfixes0-dev xvfb
```

### macOS
```bash
xcode-select --install
```

### Windows
- Microsoft Visual Studio C++ Build Tools
- WebView2 runtime (pre-installed on Windows 10/11)

## Building the app

```bash
pnpm build          # cargo build (from the package root)
```

The binary lands at `target/debug/wdio-dioxus-e2e-app` (or `.exe` on Windows).

## Running tests

Install dependencies from the repo root first:
```bash
pnpm install
```

Then from the repo root or this package directory:

### Standard
```bash
pnpm test:dioxus               # from repo root
# or
pnpm test                      # from packages/dioxus/
```

### Multiremote (two instances)
```bash
pnpm test:dioxus:multiremote
```

### Standalone (no WDIO runner)
```bash
pnpm test:dioxus:standalone
```

### Window management
```bash
pnpm test:dioxus:window
```

> **Note:** The fixture is a single-window app (no splash screen). Tests that assert on a splash window log `[SKIP]` and return early — they do not fail.

### Visual regression
```bash
pnpm test:dioxus:visual
```

Baselines are stored in `__visual__/<platform>/<arch>/baseline/`. Run once to generate them, then again to compare.

### Video recording
```bash
pnpm test:dioxus:video
```

Videos land in `__video__/<platform>/<arch>/`.

## Linux: Xvfb

The embedded driver starts in the WDIO **launcher** process (during `onPrepare`), so `autoXvfb` fires too late to set up the display. On Linux, wrap the command in `xvfb-run`:

```bash
xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x16" pnpm test:dioxus
```

CI handles this automatically.

## Known platform gaps

| Gap | Detail |
|-----|--------|
| No deeplink test type | The fixture does not register a `testapp://` protocol handler — `wdio.deeplink.conf.ts` and `test:deeplink` are intentionally absent. |
| Window splash tests soft-skip | The fixture has a single window (no splash). Splash-specific assertions guard with an early `return` rather than throwing. |

## Upstream service

[`@wdio/dioxus-service`](https://github.com/webdriverio/desktop-mobile/tree/main/packages/dioxus-service)
