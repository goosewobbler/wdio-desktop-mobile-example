# @wdio-desktop-mobile-example/react-native

Manual-verification test package for [`@wdio/react-native-service`](https://github.com/webdriverio/desktop-mobile/tree/main/packages/react-native-service). It contains a React Native "big-glass counter" fixture and a WebdriverIO spec suite that exercises the service's public `browser.reactNative.*` API on **Android and iOS**.

This is the first **mobile** package in the repo, and it diverges from the desktop ones (Electron/Tauri/Dioxus) in fundamental ways:

- **Appium owns the session.** `@wdio/appium-service` boots Appium; Appium installs and launches the app from `appium:*` capabilities. The service does **not** spawn the app or a driver — it mutates capabilities and attaches to the app's **Hermes JS realm over CDP** (via Metro's inspector) for `execute`/`mock`.
- **Platform, not provider.** Runs are selected by `RN_PLATFORM` (`android` default / `ios`), not a driver-provider dimension.
- **The fixture is scaffolded, not committed.** Only the JS source (`app/`) lives here; the native `android/`/`ios/` projects are generated into the gitignored `.rn-build/` at build time.
- **"Windows" are contexts.** The desktop `window` test type becomes `contexts` (`switchContext`/`listContexts`).

## What's in this package

| Path | Description |
|------|-------------|
| `app/` | Committed fixture source overlay — `App.tsx` (counter UI + `globalThis.greet` + `DeviceEventEmitter` hook) + RN config |
| `scripts/build-app.mjs` | Scaffolds the native RN project into `.rn-build/` and builds the debug artifact |
| `wdio.base.conf.ts` | Appium capability builder, `appium`/`react-native` service factories, log-dir helpers, `baseConfig` |
| `wdio.conf.ts` | Standard test run (api, application, execute, mocking, logging) |
| `wdio.deeplink.conf.ts` | Deeplink test type |
| `wdio.contexts.conf.ts` | Contexts test type (window→contexts) |
| `test/` | Spec suite + `test/lib/` (the `~`-selector helper and log-reading helpers) |

## Prerequisites

- **Node.js 22.12+** (the service engine requirement; the WDIO config uses `fs.globSync`).
- **Appium drivers** installed into Appium's home (one-time):
  ```bash
  pnpm exec appium driver install uiautomator2   # Android
  pnpm exec appium driver install xcuitest        # iOS (macOS only)
  ```

### Android
- Android SDK + platform-tools, an x86_64 emulator (API 35 recommended), JDK 17.

### iOS (macOS only)
- Xcode + an iOS Simulator (default device: *iPhone 16*), CocoaPods.

> **Debug / Metro build required.** `execute`, `mock`, and `emitEvent` drive the app's JS realm over
> the Hermes inspector exposed by Metro, which is only present in debug builds. Native find/tap works
> with any build.

## Building the fixture

```bash
pnpm build                       # Android (default platform)
RN_PLATFORM=ios pnpm build       # iOS simulator
```

`build-app.mjs` scaffolds a fresh RN project (pinned to the `react-native` version in `app/package.json`) into `.rn-build/`, overlays `app/App.tsx` etc., and builds the debug APK (`assembleDebug`) or simulator `.app` (`xcodebuild`). It is a no-op when `RN_APP_PATH` is set (CI builds the artifact in a dedicated step) or the artifact already exists. Run `pnpm clean` to force a fresh scaffold.

## Running tests

Install from the repo root first (`pnpm install`). Then, from the repo root or this package:

```bash
# Android (emulator booted)
pnpm test:react-native               # standard  (or `pnpm test` from here)
pnpm test:react-native:deeplink
pnpm test:react-native:contexts

# iOS (simulator)
RN_PLATFORM=ios pnpm test:react-native
RN_PLATFORM=ios pnpm test:react-native:contexts
```

Without a prebuilt WebDriverAgent (`RN_WDA_DD`), the first iOS session lets Appium compile WDA — the config's generous `wdaLaunchTimeout`/`connectionRetryTimeout` absorb this (slower first run, fewer moving parts).

## Stable selectors

The spec suite depends on these fixture ids (Appium `~` accessibility-id selector):
`app-title`, `counter`, `increment-button`, `decrement-button`, `reset-button`, `status`.

## Known gaps / deferred test types

| Gap | Detail |
|-----|--------|
| No `multiremote` | Needs two devices/emulators; the service's device-pool path is covered by the upstream service's own unit tests. |
| No `standalone` | Deferred; the standard runner-driven flow is the primary manual-verification surface. |
| No `visual` / `video` | Mobile visual baselines are per-device/arch and screen recording needs extra permissions — deferred. |
| `deeplink` is manual-only (not in CI) | The fixture registers no URL scheme, so `triggerDeeplink`'s `am start` fallback can't resolve (and needs Appium relaxed-security). Mirrors upstream, which excludes Android deeplink from its required matrix. The `deeplink.spec.ts` + `test:deeplink` script are kept for manual runs; a scheme-handling fixture is a fast-follow. |
| Single architecture | The fixture builds with the Old Architecture (Paper) for faster, less flaky inspector registration. The dual Paper/Fabric matrix lives upstream. |
| Not on the `minimum` catalog | The service requires webdriverio 9 + Node 22, which the wdio-8 `minimum` catalog can't satisfy — the RN CI jobs are gated off it. |

## Upstream service

[`@wdio/react-native-service`](https://github.com/webdriverio/desktop-mobile/tree/main/packages/react-native-service)
