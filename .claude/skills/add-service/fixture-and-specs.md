# Fixture + Spec Reference

Detail behind [SKILL.md](SKILL.md) Phases 2–4. Treat the existing `packages/tauri/` and `packages/electron-builder/` as the live source of truth; this doc is the *abstraction* across them so a new package lands shaped the same way.

## Fixture app — the user-facing surface

### Visual template ("big-glass")

Every fixture uses the same visual template so a screenshot of one is largely interchangeable with the next. Carry it over **verbatim** from the upstream `wdio-desktop-mobile/fixtures/e2e-apps/<framework>/` source; don't reinvent.

- Background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` (purple). Splash uses the same gradient.
- `.container`: `background: rgba(255, 255, 255, 0.15)`, `backdrop-filter: blur(15px)`, `border-radius: 25px`, `padding: 50px`, `max-width: 800px`, `border: 1px solid rgba(255, 255, 255, 0.25)`, `box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15)`.
- `h1`: `font-size: 3em`, `font-weight: 200`, `text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3)`.
- `button`: `rgba(255, 255, 255, 0.25)`, `border: 2px solid rgba(255, 255, 255, 0.4)`, `border-radius: 12px`, hover `translateY(-3px)`.
- `#counter`: `font-size: 4em`, `color: #61dafb`.
- `.info-section`: `background: rgba(0, 0, 0, 0.25)`, `border-radius: 15px`, SF Mono / Monaco font.
- White text throughout.

### Required stable selectors

The spec suite depends on these — name them exactly:

| Selector | Purpose |
|---|---|
| `#app-title` | App heading; presence assertion in `api.spec.ts` |
| `#counter` | Counter value display; `application.spec.ts` reads + asserts |
| `#increment-button` | Bumps counter +1; `application.spec.ts`, `multiremote/*.spec.ts` |
| `#decrement-button` | Bumps counter −1 |
| `#reset-button` | Resets counter to 0 |
| `#status` | Status text panel; `application.spec.ts` reads after actions |

CDP fixtures additionally include the Electron extras buttons (window resize, show dialog) **alongside** the counter, not in place of it. Other framework-specific buttons follow the same additive rule.

### Splash screen

`window.spec.ts` assumes a splash window exists. Add a `splash.html` (or framework equivalent) using the same gradient. The main window opens after a brief splash delay; the spec asserts the multi-window transition.

### Deeplink registration

Deeplink-supporting frameworks register the `testapp://` protocol handler at app launch. On Linux this needs build-then-register-after-install (see Tauri's `scripts/` and the CI Linux deeplink step). If the framework can't register a protocol handler (or the build tool doesn't support it — `electron-script` is the precedent), **omit deeplink everywhere**: no spec file, no `test:*` script, no CI matrix cell.

### Per-archetype fixture layout

**CDP / Electron (multi-build-tool):**

```
src/
├── main/index.ts        # Main process
├── preload/index.ts     # Preload bridge
└── renderer/
    ├── index.html       # Main window UI
    └── splash.html      # Splash window
electron.vite.config.ts  # electron-vite build config
[forge.config.js | electron-builder config]   # build-tool-specific
scripts/protocol-install.sh                   # Linux protocol handler registration
```

**Wry / Tauri (Cargo workspace):**

```
Cargo.toml               # Workspace root — target/ at this level
src-tauri/               # Workspace member: Rust backend + tauri.conf.json
├── Cargo.toml
├── src/
└── tauri.conf.json
index.html               # Frontend UI
splash.html              # Splash window
vite.config.ts           # JS bundler
target/                  # Cargo build output (gitignored)
```

**Wry / Dioxus or other single-`src-<framework>` Rust frameworks:**

```
Cargo.toml               # Workspace root
src-<framework>/         # Workspace member
├── Cargo.toml
└── src/main.rs          # rsx-based UI (CSS inlined as SHARED_STYLES const)
target/                  # Cargo build output (gitignored)
package.json             # build/clean scripts (no JS bundler needed)
```

The wrapping `wdio.base.conf.ts` resolves `appBinaryPath` from `target/debug/<productName>` (with `.exe` on Windows, lowercased on Linux for Cargo's binary-name convention). Mirror the Tauri `wdio.base.conf.ts` resolution block verbatim.

### Upstream patches

If the upstream `fixtures/e2e-apps/<framework>/Cargo.toml` carries a `[patch.crates-io]` block or version pin shim, **copy it with its full comment**. The comment names the upstream PR and the cleanup condition — losing it strands the patch.

## Catalog rules

Three catalogs in `pnpm-workspace.yaml`:

- **`default`** — current shipped stable. `latest` for `@wdio/*` and framework deps when their semver tracks the example repo's expectations; pinned versions otherwise.
- **`next`** — `latest` (or `next` tag for `@wdio/*`) across the board. Catches upcoming breaking changes early.
- **`minimum`** — lowest still-supported. For a freshly 1.0'd service, this is typically `^1.0.0`. For the framework runtime, match the upstream service's stated minimum.

Switch between catalogs with `pnpm catalog:default | next | minimum` (script in `scripts/switch-catalog.ts`). When adding a new service:

- Add every `@wdio/<framework>-*` and every framework runtime dep (e.g. `@tauri-apps/api`, `dioxus` Rust crate) to **all three**.
- Use `catalog:default` in package.jsons — never hard-code a version.
- For runtime-only deps with no `next` shape yet, point `next` at `latest` too.

## Spec inventory

Mirror Tauri's spec set exactly. Adapt the bodies to call `browser.<framework>.*`; everything else (test names, file layout, lib helpers) stays the same.

### `test/*.spec.ts` (per-(provider, test-type) standard run picks these up)

| Spec | What it covers | Required upstream API |
|---|---|---|
| `api.spec.ts` | `browser.<framework>.execute` returns from a simple call into the app's API | `execute` |
| `application.spec.ts` | App launches, title visible, counter increments via clicks, status updates | UI |
| `mocking.spec.ts` | Mock a backend command; assertions on call args, return values, reset/restore | `mock` + spy lifecycle |
| `execute-advanced.spec.ts` | Nested execute calls, error propagation, concurrent invocations | `execute` |
| `execute-data-types.spec.ts` | Serialization round-trip: primitives, arrays, objects, dates, undefined/null | `execute` |
| `logging.spec.ts` | Backend + frontend log capture via the service's log forwarder | `captureBackendLogs` / `captureFrontendLogs` (or equivalent) |
| `window.spec.ts` | Splash→main multi-window transition, `switchWindow` / `listWindows` | `switchWindow`/`listWindows` |
| `deeplink.spec.ts` | `triggerDeeplink` opens app with `testapp://...` URL | `triggerDeeplink` + fixture protocol handler |

**Provider-specific specs.** Tauri has `logging.embedded.spec.ts` and `logging.tauri-driver.spec.ts` for behaviour unique to one provider. Each per-provider config excludes the specs that don't apply via its `exclude:` list. Pattern: ship the spec, exclude it from every config except the one provider it covers.

### `test/multiremote/`

```
api.spec.ts        # browser.getInstance('browserA') / browserB happy path
advanced.spec.ts   # concurrent execute across instances, isolation checks
logging.spec.ts    # per-instance log capture
```

Each instance uses the same `buildXCapability()` builder, wrapped in `{ browserA: { capabilities }, browserB: { capabilities } }`.

### `test/standalone/`

```
api.spec.ts        # Same API surface as test/api.spec.ts but via createXCapabilities + startWdioSession (no WDIO testrunner)
logging.spec.ts    # Standalone-mode log capture (same backend, no worker process)
```

Run via `scripts/run-standalone.mjs <provider>` (or no arg for single-provider). The script:

- Walks `test/standalone/*.spec.ts` sequentially (port collisions if parallel).
- Invokes each spec through `node --import tsx` (no PATH dependency on `tsx`).
- Sets `DRIVER_PROVIDER` (and any provider-specific env, e.g. `WDIO_EMBEDDED_SERVER=true` for Tauri embedded).
- Soft-skips with `exit 0` on platform-incompatible provider × OS combos so pnpm doesn't fail the whole run.
- Hard-fails with a clear error if a required env (e.g. `CN_API_KEY`) is missing.

Copy `packages/tauri/scripts/run-standalone.mjs` and trim the provider list. If your service has only one provider, the script becomes much shorter (no `<provider>` arg, no skip logic) but keep the sequential-spawn structure.

### `test/visual/`

```
visual.spec.ts     # @wdio/visual-service screenshot comparison against per-provider baselines
```

Visual specs run twice (the package script chains `&& wdio run …` twice): first to populate the baseline, second to validate the match. `autoSaveBaseline: true` keeps CI runners self-contained. The baseline path **must** include `<platform>/<arch>[/<provider>]` to prevent cross-provider/cross-OS collisions.

### `test/video/`

```
video.spec.ts      # wdio-video-reporter ffmpeg recording smoke
```

Pulls the shared reporter config from `wdio.video.shared.ts` at the repo root.

### `test/lib/utils.ts`

Log-reading helpers shared by spec files: `currentLogDir(scenario?)`, `readWdioLogs(dir)`, `findLogEntries(logs, pattern)`, `assertLogContains(logs, expected)`, `waitForLog(dir, pattern, timeout?, interval?, settleDelay?)`. Copy from `packages/tauri/test/lib/utils.ts` and adapt the `currentLogDir` resolution if the package is single-provider (drop the `DRIVER_PROVIDER` env lookup, hard-code the path under `logs/`).

## Per-config spec inclusion rules

Every `wdio.[<provider>.]<test-type>.conf.ts` sets:

- `specs: ['./test/**/*.spec.ts']` for the *standard* config; otherwise the narrowest glob that matches the test-type (`./test/multiremote/**/*.spec.ts`, `./test/visual/**/*.spec.ts`, etc.).
- `exclude:` listing every other test-type's folder, plus any provider-specific specs that don't apply, plus `window.spec.ts` and `deeplink.spec.ts` (covered by their own dedicated configs even in the standard run — they need different fixture setup).

The Tauri `wdio.embedded.conf.ts` is the canonical reference for the exclude shape.

## Helpers from `wdio.base.conf.ts`

Every base config exports these — match the signatures:

```ts
export const appBinaryPath: string;            // resolved + existsSync-checked at module load
export const <framework>Root: string;           // package dir, used by lib/utils
export type DriverProvider = '<p1>' | '<p2>'…;  // omit if single-provider
export interface CapabilityOptions { appArgs?: string[]; /* … */ }

export function build<Framework>Capability(opts?: CapabilityOptions): WebdriverIO.Capabilities;
export function buildMultiremoteCapabilities(opts?: CapabilityOptions): Capabilities.RequestedMultiremoteCapabilities;
export function visualService(provider?: DriverProvider): Services.ServiceEntry;
export function <framework>Service(provider?: DriverProvider): Services.ServiceEntry;
export function logsDir(provider?: DriverProvider, scenario?: string): string;
export function skipOnMacOS(reason: string): void;   // if any provider lacks macOS support; uses exit 78 soft-skip
export const baseConfig: Partial<Options.Testrunner>;
```

Single-provider services drop the `provider` parameter everywhere.

## Don'ts (carry over to every package)

- **No unit tests, no coverage thresholds.** This repo verifies user-facing surface only. Push test-the-service-internals work upstream.
- **No new visual template.** Reuse the big-glass theme. Adding a different background or container style is a non-starter — it breaks the cross-package "same screenshot" property.
- **No placeholder specs.** If a service lacks a concept (no deeplink, no `emitEvent`), omit the spec entirely and document the gap in the package README.
- **No hard-coded versions in package.json.** Everything goes through `catalog:default`.
