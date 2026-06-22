---
name: Add Service
description: Runbook for wiring a new `@wdio/<framework>-service` from the upstream wdio-desktop-mobile monorepo into this example repo as a manual-verification test target. Organized around two transport families — desktop (the service spawns the app + a driver it owns: CDP/Electron, Wry/Tauri, Wry/Dioxus) and mobile (Appium owns the session; the service mutates capabilities + allocates devices + attaches a JS-realm bridge: React Native, with Flutter/Capacitor next). Use this skill when asked to add a new framework's test package, to bootstrap a `packages/<framework>/` for an upstream service that just shipped, or to extend an existing package with a new provider, build-tool variant, or platform.
---

# Add Service

A runbook for adding a manual-verification test target for an upstream `@wdio/<framework>-service` to this example repo. Everything here splits along **one decision — which transport family the service belongs to:**

- **Desktop family** — the service **spawns the app and a driver it owns** (a binary, a WebDriver port, an OS-protocol deeplink). Three archetypes ship today:
  - **CDP / Electron** (`packages/electron-builder|forge|script/`) — one package per build tool, single set of test-type configs each.
  - **Wry / Tauri** (`packages/tauri/`) — one package, multiple driver providers, configs fanned out per (provider × test-type).
  - **Wry / Dioxus** (`packages/dioxus/`) — one package, single provider, configs per test-type.
- **Mobile family** — **Appium owns the session.** `@wdio/appium-service` boots Appium, Appium installs + launches the app from `appium:*` capabilities, and the service only **mutates capabilities, allocates devices from a pool, and attaches a JS-realm bridge** (`execute`/`mock`). One archetype ships today:
  - **React Native** (`packages/react-native/`) — Android + iOS, Hermes/CDP JS realm. Flutter (Dart VM) and Capacitor (WebView) are the next mobile services.

If you follow this skill against an existing archetype you should land in the same place the shipped package already is, and the same process bootstraps the next service in that family.

**Convergence is the point.** Every package exposes as close to an identical spec set as possible — a screenshot or test name from one package's `api.spec.ts` should be largely interchangeable with the next. Mobile keeps the same *surface* with mobile *semantics* (contexts instead of windows, a device pool instead of per-worker ports, `mobile: deepLink` instead of an OS-protocol spawn).

**What this repo is for:** minimal realistic examples + manual verification of service usage from a user's perspective. **Not** for unit tests, not for coverage thresholds, not for re-litigating service internals. If a check belongs in the upstream service's own suite, it doesn't go here.

## When to use

- An upstream service in `wdio-desktop-mobile` has shipped (or is at MVP) and needs a manual-verification target.
- A new provider (e.g. a third Wry driver) needs adding to an existing desktop package.
- A new build-tool variant of an existing service needs adding (e.g. a fourth Electron packager).
- A new platform needs adding to an existing mobile package.

## When NOT to use

- Adding a service feature — that's an upstream change in `wdio-desktop-mobile`.
- Refactoring an existing fixture's visual template — it's intentionally shared (see [fixture-and-specs.md](fixture-and-specs.md)).

## Step 0 — Pick the family, then the package shape

**Q0 (the family question): does the service spawn the app + a driver it owns, or does Appium own the session?**

| | Family | Doc | Reference package |
|---|---|---|---|
| Service spawns a binary/driver | **Desktop** | this file + [fixture-and-specs.md](fixture-and-specs.md) | `packages/electron-builder`, `packages/tauri`, `packages/dioxus` |
| `services: ['appium', '<framework>']` | **Mobile** | this file + [mobile.md](mobile.md) | `packages/react-native` |

A quick tell: if the upstream service depends on `@wdio/native-mobile-core` and the config lists `services: ['appium', …]`, it's mobile. If it spawns a driver/binary (`@wdio/native-core`, a `<framework>:options` capability), it's desktop.

→ **Desktop:** continue to **[Desktop family](#desktop-family)** below.
→ **Mobile:** continue to **[Mobile family](#mobile-family)** below.

---

# Desktop family

## Step 0 (desktop) — package shape

Two questions decide the layout.

**Q1: Does the framework have multiple primary build tools the service is exercised against?**

| | Layout | Example |
|---|---|---|
| **Yes** | One package per tool: `packages/<framework>-<tool>/` | `electron-builder` / `electron-forge` / `electron-script` |
| **No** | One package: `packages/<framework>/` | `tauri`, `dioxus` |

**Q2: Does the upstream service expose multiple driver providers the user can pick between?**

| | WDIO config fan-out | Example |
|---|---|---|
| **One** | `wdio.<test-type>.conf.ts` + `wdio.base.conf.ts` | Electron (no provider concept), Dioxus (only `embedded`) |
| **Many** | `wdio.<provider>.<test-type>.conf.ts` + `wdio.base.conf.ts` | Tauri (`embedded` / `official` / `crabnebula`) |

The desktop test-type list is fixed regardless: **standard, multiremote, deeplink, standalone, window, visual, video** (7 types).

→ Clone the closest sibling. **CDP with multiple build tools** → `packages/electron-builder/`. **Wry / single tool, multi-provider** → `packages/tauri/`. **Single tool, single provider** → `packages/dioxus/`.

## Process (desktop)

### Phase 1 — Bootstrap the package

Create `packages/<framework>/` (or `packages/<framework>-<tool>/`):

```
package.json              # @wdio-desktop-mobile-example/<name>
wdio.base.conf.ts         # shared bits + builders for capabilities/services
wdio.[<provider>.]<test-type>.conf.ts   # one per (provider, test-type)
test/
├── api.spec.ts            application.spec.ts   mocking.spec.ts
├── execute-advanced.spec.ts   execute-data-types.spec.ts
├── logging.spec.ts        window.spec.ts        deeplink.spec.ts
├── lib/utils.ts           # log-reading helpers
├── multiremote/{api,advanced,logging}.spec.ts
├── standalone/{api,logging}.spec.ts
├── visual/visual.spec.ts
└── video/video.spec.ts
scripts/run-standalone.mjs # only if the upstream service has a standalone mode
src/ or src-<framework>/   # the app itself (see Phase 2)
```

**Conventions:**

- npm name: `@wdio-desktop-mobile-example/<dir>`. `"private": true`, ESM.
- All `@wdio/*` and framework deps go through `catalog:default` — never hard-code a version (see [fixture-and-specs.md](fixture-and-specs.md) for the catalog rules).
- `wdio.base.conf.ts` exports: `appBinaryPath`, `build<Framework>Capability()`, `buildMultiremoteCapabilities()`, `visualService(provider)`, `<framework>Service(provider)`, `logsDir(provider, scenario?)`, `skipOnPlatform(...)` helpers, `baseConfig`. Pattern is `packages/tauri/wdio.base.conf.ts`.
- Per-config `outputDir: logsDir(provider, 'scenario')` so logs don't collide across runs.
- Each per-test-type config sets `specs`, `exclude` (everything outside this test type), `capabilities`, `services`, `outputDir`. Pattern is `packages/tauri/wdio.embedded.conf.ts`.
- **Wry only:** `baseConfig.autoXvfb = false` (driver runs in the launcher process — too late for autoXvfb). CI wraps with `xvfb-run`. CDP services can leave `autoXvfb` on.

### Phase 2 — Fixture app

**Copy from the upstream `fixtures/e2e-apps/<framework>/` in `wdio-desktop-mobile`, then simplify.**

Carry over:

- The big-glass visual template (purple gradient, glass container, counter UI) — these are the canonical references, don't reinvent:
  - rsx / Rust: `fixtures/e2e-apps/dioxus/src/main.rs` (CSS in `SHARED_STYLES`).
  - HTML: `fixtures/e2e-apps/tauri/index.html` or `fixtures/e2e-apps/electron-builder/src/renderer/index.html`.
- Required stable selectors: `#app-title`, `#counter`, `#increment-button`, `#decrement-button`, `#reset-button`, `#status`. The spec suite depends on these.
- A splash screen (window-test specs assume one exists).
- Any framework-specific build-system files (Cargo workspace + `src-<framework>/` for Rust frameworks; build-tool config for Electron).
- Any upstream patches the fixture needs (e.g. Dioxus's `[patch.crates-io]` block for `with_background_throttling`) — copy the comment too, it explains *why* the patch exists.

Strip out:

- Anything that's only there for the upstream's E2E coverage (additional commands the spec set doesn't exercise, dev-time scaffolding).
- Anything that duplicates the service's own test suite — the fixture should be the *user-facing app*, nothing more.

Deeplink-supporting frameworks must register `testapp://`. Window-test specs assume a splash window exists.

→ **Full visual template, selector list, file layout per archetype:** [fixture-and-specs.md](fixture-and-specs.md).

### Phase 3 — Specs (mirror Tauri's full set)

Mirror the canonical spec set from `packages/tauri/test/` exactly — names, file layout, and per-test-type folders. Adapt the bodies to call `browser.<framework>.*` instead of `browser.tauri.*`; everything else stays the same.

`it('should …')` throughout — never `it('does X')` / `it('returns Y')`. Tauri's suite is the reference.

If a service genuinely lacks a concept a spec exercises (e.g. no deeplink support, no `emitEvent`), document the gap in the package README and **omit the spec file** — don't ship an empty placeholder. The corresponding `test:*` script and CI matrix cell stay out too.

→ **Full spec inventory + per-archetype notes:** [fixture-and-specs.md](fixture-and-specs.md).

### Phase 4 — Scripts, catalogs, turbo

**`packages/<name>/package.json` scripts** (mirror `packages/tauri/package.json`):

- `build` (framework-appropriate), `clean`, `format`, `lint` (+ `:fix` / `:fix:unsafe`).
- `test` aliased to the default provider's standard run.
- For each provider (or just one set if single-provider): `test:[<provider>:]<test-type>` for every test-type. Standalone uses `node ./scripts/run-standalone.mjs <provider>`.
- `ci`, `ci:<provider>` (one per provider), `ci:logs`.

**Root `package.json`** — add the fan-out:

- `test:<framework>` alias to the default provider's standard run.
- `test:<framework>[:<provider>]:<test-type>` for every (provider, test-type) cell, wired via `turbo run ... --filter=@wdio-desktop-mobile-example/<name>`.
- `ci:logs:<framework>` entry.

**`pnpm-workspace.yaml`** — add the new `@wdio/<framework>-service` and any framework-runtime deps to **all three catalogs**: `default`, `next`, `minimum`. See [fixture-and-specs.md](fixture-and-specs.md) for the catalog rules (and gotcha 10: a brand-new service's `latest` is often a stale `0.0.1` placeholder — use the `next` tag until a real stable ships).

**`turbo.json`** — add one task entry per `test:[<provider>:]<test-type>` shape that doesn't already exist. Use the existing Tauri entries as the template (`dependsOn: ["build"]`, `outputs: ["logs/**"]` plus `__visual__/**` for visual and `__video__/**` for video, `inputs` covering `test/**`, the relevant `wdio.*.conf.ts`, `package.json`, `../../pnpm-workspace.yaml`).

### Phase 5 — CI workflow

Add a new job (or jobs) in **`.github/workflows/_ci.reusable.yml`** — the shared matrix that the thin per-catalog callers (`ci.yml` → default, `ci-next.yml` → next, `ci-minimum.yml` → minimum) all invoke. A job added here runs under every catalog automatically; gate it with a job-level `if:` if it can't run under one (see the mobile note on the minimum catalog). Pattern is mandatory — copy the matching template:

- **CDP / multi-build-tool** → clone the `electron:` job. Matrix: `os × node-version × package × test-type`. Use `exclude:` for cells the framework genuinely can't run (e.g. `electron-script` has no deeplink handler upstream).
- **Wry / multi-provider** → one job per provider, cloning the `tauri-<provider>:` jobs. Matrix: `os × node-version × test-type`, with `exclude:` for platform-incompatible cells. Linux runs are wrapped in `xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x16" pnpm run test:...`; non-Linux runs do not.
- **Wry / single-provider** → one job, matrix `os × node-version × test-type`. Same Linux xvfb-run wrapping (clone the `dioxus:` job).

All jobs share: `git config --global core.autocrlf input`, Node setup, pnpm cache + install, and the `Switch to <catalog>` step. Wry jobs additionally: `dtolnay/rust-toolchain@stable`, `Swatinem/rust-cache@v2` (with `workspaces: packages/<name>`), Linux apt dependencies (see below), `xvfb`. Every job ends with a "🐛 Show Test Logs on Failure" step calling the package's `ci:logs` script.

**Linux apt dependencies (Wry jobs):** Do NOT copy the existing Tauri apt list — it is Tauri-specific and will include packages the new framework doesn't need and omit ones it does (e.g. the Dioxus job needs `libxdo-dev` and `libayatana-appindicator3-dev`, absent from Tauri's list). Instead, read `~/Workspace/wdio-desktop-mobile/.github/workflows/_ci-build-<framework>-e2e-app.reusable.yml` and copy the exact package list from its "Install … Build Dependencies (Linux)" step. Add `webkit2gtk-driver` on top only if the provider requires an external WebDriver server.

Real platform exclusions (must be documented inline in the workflow with the *why*, like the existing Tauri jobs): no macOS support for an external driver that ships only Linux/Windows builds; CrabNebula-style Screen Recording permission gaps; etc.

### Phase 6 — Docs

- Add the new package to the root `README.md` table and the per-section run-commands block. Match the existing voice.
- Add a `packages/<name>/README.md` covering: what's in the package, prerequisites, how to run each test-type, any known platform gaps, and a link back to the upstream service.
- If a provider has known matrix exclusions (real platform constraints), document them in the package README with the *why* — same content as the CI inline comment.

---

# Mobile family

Mobile is **not** a point on the desktop axes — Appium owns the session, so the patterns desktop has no analogue for (device-pool allocation, capability mutation, contexts-as-windows, a per-platform CI split, a debug-build requirement) all live here. The shipped reference is `packages/react-native/`.

**The shape, at a glance** (full worked detail in **[mobile.md](mobile.md)**):

- **Compose Appium at the runner:** `services: [['appium', { logPath, args }], '<framework>']`. `@wdio/appium-service` is a **devDependency of the package**, never of the service. The drivers (`uiautomator2`/`xcuitest`) are installed into Appium's home in CI/local setup (`appium driver install …`), not catalogued as npm deps.
- **Platform is the run dimension, not provider.** Select with an env var (`RN_PLATFORM=android|ios`); there is no `wdio.<provider>.*` fan-out. Capabilities are Appium-shaped (`platformName`, `appium:automationName`, `appium:app`, `wdio:<framework>ServiceOptions`).
- **No spawned binary, no Rust.** `build` builds the *native app* (Android APK / iOS `.app`). The native `android/`/`ios/` projects are **scaffolded at build time, not committed** — only the JS source lives in `app/`; the generated project goes in a gitignored `.rn-build/` (`scripts/build-app.mjs`). Debug/Metro build is mandatory — the Hermes inspector `execute`/`mock` attach to is debug-only.
- **Mobile test types** map the desktop set with mobile semantics: `window` → **contexts** (`switchContext`/`listContexts`), deeplink = Appium `mobile: deepLink`, two log channels (native logcat/syslog + JS console over the realm bridge). The pragmatic first slice is **standard + deeplink + contexts**; multiremote/standalone/visual/video are deferred (document the omissions in the package README).
- **JS-realm tiers** (how `execute`/`mock` reach the scripting realm): **Hermes/CDP** (React Native — reuses `@wdio/native-cdp-bridge`), **Dart VM** (Flutter — Tier-2 cooperative mock), **WebView context** (Capacitor). Pick the one matching the framework's engine.
- **CI is per-platform, not per-provider.** Android = a single combined job (the JS bundle couples to the APK at runtime): build APK → boot emulator → `adb reverse` → Metro → specs. iOS = build the simulator `.app` → boot the sim → run specs (the example repo lets Appium compile WebDriverAgent on first session and leans on the config's generous timeouts; the upstream split-and-prebuild-WDA optimization is overkill for a manual-verification target). RN requires **webdriverio 9 + Node 22**, so the wdio-8 `minimum` catalog can't run it — gate the RN jobs with `if: ${{ inputs.catalog != 'minimum' }}` (the catalog entries still exist so `switch-catalog.ts` resolves).

→ **Full mobile process (bootstrap, fixture, specs, scripts/catalogs/turbo, CI, docs) + gotchas:** [mobile.md](mobile.md).
→ **Upstream service-internals context:** `~/Workspace/wdio-desktop-mobile/.claude/skills/add-native-service/plumbing-mobile.md`.

---

## Verification checklist (per service added)

- [ ] `pnpm install` clean from the repo root; catalog entries present in all three catalogs (`default`, `next`, `minimum`).
- [ ] `pnpm --filter=@wdio-desktop-mobile-example/<name> build` succeeds locally (desktop: the binary; mobile: the native app for the host's available platform).
- [ ] Default test-type passes locally: `pnpm test:<framework>` (mobile: on one platform, e.g. `RN_PLATFORM=ios pnpm test:react-native`).
- [ ] At least one non-default test-type passes locally (desktop: `multiremote`; mobile: `contexts` is the cheapest).
- [ ] Root `package.json`, `turbo.json`, and `.github/workflows/_ci.reusable.yml` all reference the new package.
- [ ] Per-package `README.md` covers prerequisites + every test-type (and documents any omitted types with the *why*).
- [ ] No specs duplicate upstream service-internal coverage; no unit tests in the package.

## Naming conventions

| What | Convention | Example |
|---|---|---|
| Package dir | `packages/<framework>` (one tool) or `packages/<framework>-<tool>` (many) | `packages/dioxus`, `packages/electron-forge`, `packages/react-native` |
| npm name | `@wdio-desktop-mobile-example/<dir>` | `@wdio-desktop-mobile-example/react-native` |
| WDIO config (desktop, single provider) | `wdio.<test-type>.conf.ts` + `wdio.base.conf.ts` | `wdio.multiremote.conf.ts` |
| WDIO config (desktop, multi-provider) | `wdio.<provider>.<test-type>.conf.ts` + `wdio.base.conf.ts` | `wdio.embedded.multiremote.conf.ts` |
| WDIO config (mobile) | `wdio.<test-type>.conf.ts` + `wdio.base.conf.ts` (platform via env, no provider) | `wdio.contexts.conf.ts` |
| Package script (desktop single / mobile) | `test:<test-type>` | `test:multiremote`, `test:contexts` |
| Package script (desktop multi-provider) | `test:<provider>:<test-type>` | `test:embedded:multiremote` |
| Root script | `test:<framework>[:<provider>]:<test-type>` | `test:tauri:embedded:multiremote`, `test:react-native:contexts` |
| Visual baseline dir (desktop) | `__visual__/<platform>/<arch>[/<provider>]/baseline` | `__visual__/darwin/arm64/embedded/baseline` |
| Logs dir | `logs[/<provider>][/<scenario>]` | `logs/embedded/multiremote`, `logs/standard` |
| CI job | `<framework>` / `<framework>-<provider>` (desktop) or `<framework>-<platform>` (mobile) | `dioxus`, `tauri-embedded`, `react-native-android` |

For single-provider desktop services and all mobile services, drop the `<provider>` segment everywhere — don't invent a placeholder like `default`.

## Common gotchas

1. **Don't add unit tests.** This repo's purpose is *manual verification* of the user-facing service surface. Coverage thresholds, mocked-boundary tests, and unit suites belong upstream — adding them here duplicates work and creates two sources of truth.
2. **All three catalogs.** Missing an entry passes locally (resolves via `default`) but breaks the catalog-switch matrix — `switch-catalog.ts` rewrites `catalog:default`→`catalog:<name>` for every dep listed in the default catalog, and an absent target-catalog entry fails to resolve. Add to all three at once.
3. **Single-provider / mobile services have no provider dimension.** Don't invent `wdio.default.conf.ts` or `test:default`. Drop the segment. (Mobile's run dimension is *platform*, carried by an env var, not a config-filename segment.)
4. **(Desktop / Wry) `autoXvfb` is `false`.** The driver launches in the WDIO launcher process (not a worker), so `autoXvfb` sets up the display too late. CI wraps the full `pnpm run …` command in `xvfb-run` on Linux. CDP services don't have this constraint; mobile has no desktop display at all (the Android emulator runs headless via the CI emulator action).
5. **(Desktop / Wry) Cargo workspace layout.** `target/` lives at the *workspace* root, `src-<framework>/` is the workspace member. The `wdio.base.conf.ts` target lookup assumes this — replicate the layout, don't put `target/` inside `src-<framework>/`.
6. **(Desktop) Per-provider visual baselines.** Different providers render slightly differently. Visual baseline paths must include the provider segment, or cross-provider runs overwrite each other (see VRT-SPIKE-FINDINGS.md §3).
7. **Document platform exclusions inline.** When a CI matrix cell is `exclude:`d (or a whole job is `if:`-gated) for a real platform constraint, include the *why* as a comment right next to it. The Tauri jobs in `_ci.reusable.yml` are the reference voice.
8. **(Desktop) Upstream fixture patches.** If the upstream `fixtures/e2e-apps/<framework>/Cargo.toml` carries a `[patch.crates-io]` block or version-pin shim, copy it *with the explanatory comment*. Dropping the comment loses the signal for when the patch can come out.
9. **No protocol handler? No deeplink test type.** `electron-script` ships without one upstream, so its deeplink cell is `exclude:`d and there's no `test:electron-script:deeplink`. If the *fixture* can't register a scheme, drop the cell rather than shipping a no-op spec. (Mobile's RN fixture registers no scheme yet, so `deeplink.spec.ts` is trigger-only — it asserts `triggerDeeplink` resolves without throwing.)
10. **Default catalog uses `next` tag for new services, not `latest`.** A service's `latest` at integration time is often a pre-stable placeholder (`0.0.1`) with known bugs — the `next` pre-release is what you actually want to test. Use `next` until the service publishes a real stable, then flip `default` to `latest`. (Mind sibling packages with their own version lines — e.g. RN's `@wdio/native-types` ships on `2.x latest`, not `next`.)
11. **Specs match the upstream reference exactly.** Convergence is the point. If a spec needs a framework-specific tweak, it's a bug — either the spec is too coupled to one service's surface, or the new service is diverging from the standard API. Fix the divergence; don't fork the spec.
12. **(Mobile) Appium is a *runner* dep, gate on the capability's platform, connect lazily.** `@wdio/appium-service` is a devDependency of the package, never of the service. Read the target OS from the capability's `platformName`, never `process.platform`. The Hermes/CDP bridge connects on first command, not eagerly — backgrounding the app kills the inspector. See [mobile.md](mobile.md) for the full mobile gotcha list (debug-build requirement, device-pool monotonic cursor, iOS WDA, dual-arch).
13. **(CI) The workflow file is `_ci.reusable.yml`.** Add jobs there, not to `ci.yml` (which is just a thin default-catalog caller). The matching `ci-next.yml` / `ci-minimum.yml` run the same reusable workflow under the other catalogs.

## Reference layouts (worked examples by archetype)

**Desktop:**
- **CDP / multi-build-tool** — `packages/electron-builder/`, `packages/electron-forge/`, `packages/electron-script/`.
- **Wry / multi-provider** — `packages/tauri/`. Clone for any new Wry service exposing >1 driver provider.
- **Wry / single-provider** — `packages/dioxus/`. Clone for any new Wry service with one provider. Linux apt deps: read `_ci-build-dioxus-e2e-app.reusable.yml` in `wdio-desktop-mobile`.

**Mobile:**
- **Appium / React Native (Hermes/CDP)** — `packages/react-native/`. Clone for any new mobile service; see [mobile.md](mobile.md) for the per-tier divergences (Flutter's Dart VM, Capacitor's WebView).

→ **Desktop fixture template + spec inventory:** [fixture-and-specs.md](fixture-and-specs.md)
→ **Mobile fixture, specs, CI:** [mobile.md](mobile.md)
→ **Upstream service architecture context:** `~/Workspace/wdio-desktop-mobile/.claude/skills/add-native-service/SKILL.md`
