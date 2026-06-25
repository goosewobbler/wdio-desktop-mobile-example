# @wdio-desktop-mobile-example/flutter

Manual-verification test package for [`@wdio/flutter-service`](https://github.com/webdriverio/desktop-mobile/tree/main/packages/flutter-service). It contains a Flutter counter fixture and a WebdriverIO spec suite that exercises the service's public `browser.flutter.*` API on **Android and iOS**.

This is the second **mobile** package in the repo (after `react-native`), and it shares that family's shape:

- **Appium owns the session.** `@wdio/appium-service` boots Appium; Appium installs and launches the app from `appium:*` capabilities. The service does **not** spawn the app or a driver — it mutates capabilities and drives **appium-flutter-driver**'s `FLUTTER` context for find/tap, attaching to the app's **Dart VM Service** for `execute`/`mock`.
- **Platform, not provider.** Runs are selected by `FLUTTER_PLATFORM` (`android` default / `ios`), not a driver-provider dimension.
- **The fixture is scaffolded, not committed.** Only the Dart source (`app/lib/main.dart` + `app/pubspec.yaml`) lives here; the native `android/`/`ios/` projects are generated into the gitignored `.flutter-build/` at build time (`flutter create`).
- **"Windows" are contexts.** The desktop `window` test type becomes `contexts` (`switchContext`/`listContexts`, `NATIVE_APP` ↔ `FLUTTER`).

## ⚠️ The `wdio_flutter` Dart contract is not yet on pub.dev

Flutter's `execute`/`mock`/`emitEvent` are **cooperative** (Dart is AOT-compiled — there's no runtime source eval). The app opts in via the Dart-side [`wdio_flutter`](https://github.com/webdriverio/desktop-mobile/tree/main/packages/flutter-service/wdio_flutter) package:

- `execute` invokes named handlers the app registers on `wdioHandlers`.
- `mock` overrides Dart seams the app routes through `wdioRegistry`.
- `emitEvent` pushes into the app's `wdioEvents` bus.

`wdio_flutter` is **not published to pub.dev yet**, so this fixture is **stripped** to the surface that doesn't need it — it keeps only `enableFlutterDriverExtension()` (for the `FLUTTER` context) and the `ValueKey` widget tree. The specs that drive the Dart VM bridge are **written but deferred** (kept as files, excluded from every running wdio config), so re-enabling them is a small, documented change when the package ships — see **[Re-enable path](#re-enable-path-when-wdio_flutter-publishes)**.

| Spec | Drives | Status |
|------|--------|--------|
| `api.spec.ts` | `browser.flutter` surface presence + `isMockFunction` (client-side) | ✅ runs |
| `application.spec.ts` | find/tap — `byValueKey`/`byText` + `.tap()` on the counter | ✅ runs |
| `contexts.spec.ts` | `listContexts`/`switchContext` (`NATIVE_APP` ↔ `FLUTTER`) | ✅ runs |
| `deeplink.spec.ts` | `triggerDeeplink` (Appium `mobile: deepLink`) | ✅ runs (own config; not in CI) |
| `execute.spec.ts` | named handlers via `wdioHandlers` | ⏸ deferred — needs `wdio_flutter` |
| `mocking.spec.ts` | the `wdioRegistry` seam | ⏸ deferred — needs `wdio_flutter` |
| `emitEvent.spec.ts` | the `wdioEvents` bus | ⏸ deferred — needs `wdio_flutter` |
| `logging.spec.ts` | log forwarding over the VM Service bridge | ⏸ deferred — needs `wdio_flutter` |

## What's in this package

| Path | Description |
|------|-------------|
| `app/lib/main.dart` | Committed fixture source (counter UI; stripped of the `wdio_flutter` wiring) |
| `app/pubspec.yaml` | Fixture deps — `flutter` + `flutter_driver` only (no `wdio_flutter` yet) |
| `scripts/build-app.mjs` | Scaffolds the native project into `.flutter-build/` and builds the debug artifact |
| `wdio.base.conf.ts` | Appium capability builder, `appium`/`flutter` service factories, log helpers, `baseConfig` |
| `wdio.conf.ts` | Standard test run (api, application) |
| `wdio.deeplink.conf.ts` | Deeplink test type |
| `wdio.contexts.conf.ts` | Contexts test type (window→contexts) |
| `test/` | Spec suite + `test/lib/` (log-reading helpers) |

## Prerequisites

- **Node.js 22.12+** (the service engine requirement).
- **Flutter SDK** 3.35.x (`flutter` on PATH) — [Install Flutter](https://docs.flutter.dev/get-started/install).
- **Appium Flutter driver** installed into Appium's home (one-time; it bundles uiautomator2/xcuitest):
  ```bash
  pnpm exec appium driver install --source=npm appium-flutter-driver
  ```

### Android
- Android SDK + platform-tools, an x86_64 emulator (API 35 recommended), JDK 17.

### iOS (macOS only)
- Xcode + an iOS Simulator (default device: *iPhone 16*), CocoaPods.

> **Debug build required for the deferred specs.** `execute`/`mock`/`emitEvent` attach to the Dart VM
> Service, which only debug/profile builds expose. The build script builds debug throughout; find/tap
> (the runnable subset) works regardless.

## Building the fixture

```bash
pnpm build                            # Android (default platform)
FLUTTER_PLATFORM=ios pnpm build       # iOS simulator
```

`build-app.mjs` runs `flutter create` into `.flutter-build/`, overlays `app/lib/main.dart` + `app/pubspec.yaml`, strips `ndkVersion` (no native code → no NDK), runs `flutter pub get`, and builds the debug APK / simulator `.app`. It is a no-op when `FLUTTER_APP_PATH` is set (CI builds the artifact in a dedicated step) or the artifact already exists. Run `pnpm clean` to force a fresh scaffold.

## Running tests

Install from the repo root first (`pnpm install`). Then, from the repo root or this package:

```bash
# Android (emulator booted)
pnpm test:flutter                # standard: api + application  (or `pnpm test` from here)
pnpm test:flutter:deeplink
pnpm test:flutter:contexts

# iOS (simulator)
FLUTTER_PLATFORM=ios pnpm test:flutter
FLUTTER_PLATFORM=ios pnpm test:flutter:contexts
```

## Stable selectors

The spec suite finds widgets by `ValueKey` (appium-flutter-driver): `counter`, `increment`,
`greeting`, `lastEvent`. (`greeting`/`lastEvent` are placeholders in the stripped fixture; they
become live again when the `wdio_flutter` wiring is restored.)

## Re-enable path (when `wdio_flutter` publishes)

1. **Fixture** — add `wdio_flutter: ^1.0.0` to `app/pubspec.yaml`, and restore the wiring in
   `app/lib/main.dart`: `enableWdioMocking()` before `runApp()`, the `wdioHandlers.register(...)`
   handlers (`marker`/`add`/`bindingReady`/`greetAsync`), the `GreetingService.greet` seam routed
   through `wdioRegistry.interceptAsync`, and the `wdioEvents.stream` listener that reflects events
   into the `lastEvent` widget. (The upstream fixture at `fixtures/e2e-apps/flutter/lib/main.dart`
   is the reference.)
2. **Configs** — remove `execute`/`mocking`/`emitEvent`/`logging` from `wdio.conf.ts`'s `exclude`
   (add per-type configs + `test:*` scripts if you want them isolated), and flip
   `flutterServiceOptions.doctor` to `{ strict: true }` in `wdio.base.conf.ts`.
3. **CI** — add the deferred types to the run steps in `_ci.reusable.yml`. On **Android**,
   `execute`/`mock` also need the appium-flutter-driver **`getVMServiceUrl` fork**
   (`goosewobbler/appium-flutter-driver`) until it's upstreamed — set `appium:dartVmServicePort` and
   install the fork. **iOS** works with the official driver.

## Known gaps / deferred test types

| Gap | Detail |
|-----|--------|
| `execute` / `mock` / `emitEvent` / `logging` | Deferred until `wdio_flutter` publishes to pub.dev (see above). Written-but-excluded. |
| No `multiremote` | Needs two devices/emulators; the service's device-pool path is covered by upstream unit tests. |
| No `standalone` | Deferred; the standard runner-driven flow is the primary manual-verification surface. |
| No `visual` / `video` | Mobile visual baselines are per-device/arch and screen recording needs extra permissions — deferred. |
| `deeplink` is manual-only (not in CI) | The fixture registers no URL scheme, so `triggerDeeplink` is trigger-only. The `deeplink.spec.ts` + `test:deeplink` script are kept for manual runs. |
| Not on the `minimum` catalog | The service requires webdriverio 9 + Node 22, which the wdio-8 `minimum` catalog can't satisfy — the Flutter CI jobs are gated off it. |

## Upstream service

[`@wdio/flutter-service`](https://github.com/webdriverio/desktop-mobile/tree/main/packages/flutter-service)
