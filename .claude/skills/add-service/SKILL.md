---
name: Add Service
description: Runbook for wiring a new `@wdio/<framework>-service` from the upstream wdio-desktop-mobile monorepo into this example repo as a manual-verification test target. Covers the existing desktop archetypes — CDP (Electron, with per-build-tool packages) and Wry (Tauri, single package with multiple driver providers) — and is abstracted to apply to any new desktop service. Use this skill when asked to add a new framework's test package, to bootstrap a `packages/<framework>/` for an upstream service that just shipped (e.g. Dioxus), or to extend an existing package with a new provider or build-tool variant. (Mobile frameworks are expected to introduce new patterns warranting a future revision.)
---

# Add Service

A runbook for adding a new test target for an upstream `@wdio/<framework>-service` to this manual-verification example repo. It abstracts over the **two desktop archetypes already shipped here** so the same process bootstraps any of them:

- **CDP / Electron** (`packages/electron-builder|forge|script/`) — one package per build tool, single set of test-type configs each.
- **Wry / Tauri** (`packages/tauri/`) — one package, multiple driver providers, configs fanned out per (provider × test-type).

If you follow this skill against either archetype you should land in the same place the shipped package already is, and the same process bootstraps the next desktop service.

**Scope:** this skill targets **desktop** services only. The first mobile service is expected to introduce new patterns (device/emulator management, Appium-style webview contexts) that will warrant a major revision.

**What this repo is for:** minimal realistic examples + manual verification of service usage from a user's perspective. **Not** for unit tests, not for coverage thresholds, not for re-litigating service internals. If a check belongs in the upstream service's own suite, it doesn't go here.

## When to use

- An upstream service in `wdio-desktop-mobile` has shipped (or is at MVP) and needs a manual-verification target.
- A new provider (e.g. a third Wry driver) needs adding to an existing package.
- A new build-tool variant of an existing service needs adding (e.g. a fourth Electron packager).

## When NOT to use

- Adding a service feature — that's an upstream change in `wdio-desktop-mobile`.
- Refactoring an existing fixture's visual template — it's intentionally shared (see [fixture-and-specs.md](fixture-and-specs.md)).
- Mobile services (until this skill is revised).

## Step 0 — Identify the package shape

Two questions decide the layout.

**Q1: Does the framework have multiple primary build tools the service is exercised against?**

| | Layout | Example |
|---|---|---|
| **Yes** | One package per tool: `packages/<framework>-<tool>/` | `electron-builder` / `electron-forge` / `electron-script` |
| **No** | One package: `packages/<framework>/` | `tauri`, future `dioxus` |

**Q2: Does the upstream service expose multiple driver providers the user can pick between?**

| | WDIO config fan-out | Example |
|---|---|---|
| **One** | `wdio.<test-type>.conf.ts` + `wdio.base.conf.ts` | Electron (no provider concept), Dioxus (only `embedded` initially) |
| **Many** | `wdio.<provider>.<test-type>.conf.ts` + `wdio.base.conf.ts` | Tauri (`embedded` / `official` / `crabnebula`) |

The test-type list itself is fixed regardless: **standard, multiremote, deeplink, standalone, window, visual, video** (7 types).

→ Clone the closest sibling. **CDP with multiple build tools** → `packages/electron-builder/`. **Wry / single build tool, multi-provider** → `packages/tauri/`. **Single tool, single provider** → also clone `packages/tauri/` and collapse the provider dimension out of the config filenames.

## Process

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

Mirror the canonical spec set from `packages/tauri/test/` exactly — names, file layout, and per-test-type folders. Adapt the bodies to call `browser.<framework>.*` instead of `browser.tauri.*`; everything else stays the same. The convergence principle in the upstream `add-native-service` skill applies symmetrically here: a screenshot or test name from one package's `api.spec.ts` should be largely interchangeable with the next.

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

**`pnpm-workspace.yaml`** — add the new `@wdio/<framework>-service` and any framework-runtime deps to **all three catalogs**: `default`, `next`, `minimum`. `default` and `next` use the published version (latest / next tag); `minimum` uses the lowest version still supported (typically `^1.0.0` for a freshly 1.0'd service).

**`turbo.json`** — add one task entry per `test:[<provider>:]<test-type>` shape that doesn't already exist. Use the existing Tauri entries as the template (`dependsOn: ["build"]`, `outputs: ["logs/**"]` plus `__visual__/**` for visual and `__video__/**` for video, `inputs` covering `test/**`, the relevant `wdio.*.conf.ts`, `package.json`, `../../pnpm-workspace.yaml`).

### Phase 5 — CI workflow

Add a new job (or jobs) in `.github/workflows/ci.yml`. Pattern is mandatory — copy the matching template:

- **CDP / multi-build-tool** → clone the `electron:` job. Matrix: `os × node-version × package × test-type`. Use `exclude:` for cells the framework genuinely can't run (e.g. `electron-script` has no deeplink handler upstream).
- **Wry / multi-provider** → one job per provider, cloning the `tauri-<provider>:` jobs. Matrix: `os × node-version × test-type`, with `exclude:` for platform-incompatible cells. Linux runs are wrapped in `xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x16" pnpm run test:...`; non-Linux runs do not.
- **Wry / single-provider** → one job, matrix `os × node-version × test-type`. Same Linux xvfb-run wrapping.

All jobs share: `git config --global core.autocrlf input`, Node setup, pnpm cache + install. Wry jobs additionally: `dtolnay/rust-toolchain@stable`, `Swatinem/rust-cache@v2` (with `workspaces: packages/<name>`), Linux apt deps from the existing Tauri job (add `webkit2gtk-driver` only if the provider uses it). Every job ends with a "🐛 Show Test Logs on Failure" step calling the package's `ci:logs` script.

Real platform exclusions (must be documented inline in the workflow with the *why*, like the existing Tauri jobs): no macOS support for an external driver that ships only Linux/Windows builds; CrabNebula-style Screen Recording permission gaps; etc.

### Phase 6 — Docs

- Add the new package to the root `README.md` table and the per-section run-commands block. Match the existing voice.
- Add a `packages/<name>/README.md` covering: what's in the package, prerequisites, how to run each test-type, any known platform gaps, and a link back to the upstream service.
- If a provider has known matrix exclusions (real platform constraints), document them in the package README with the *why* — same content as the CI inline comment.

## Verification checklist (per service added)

- [ ] `pnpm install` clean from the repo root.
- [ ] `pnpm --filter=@wdio-desktop-mobile-example/<name> build` succeeds locally.
- [ ] Default test-type passes locally on the current OS: `pnpm test:<framework>`.
- [ ] At least one non-default test-type passes locally (`multiremote` is the cheapest second check).
- [ ] Catalog entries present in all three catalogs (`default`, `next`, `minimum`).
- [ ] Root `package.json`, `turbo.json`, and `.github/workflows/ci.yml` all reference the new package.
- [ ] Per-package `README.md` covers prerequisites + every test-type.
- [ ] No specs duplicate upstream service-internal coverage; no unit tests in the package.

## Naming conventions

| What | Convention | Example |
|---|---|---|
| Package dir | `packages/<framework>` (one tool) or `packages/<framework>-<tool>` (many) | `packages/dioxus`, `packages/electron-forge` |
| npm name | `@wdio-desktop-mobile-example/<dir>` | `@wdio-desktop-mobile-example/dioxus` |
| WDIO config (single provider) | `wdio.<test-type>.conf.ts` + `wdio.base.conf.ts` | `wdio.multiremote.conf.ts` |
| WDIO config (multi-provider) | `wdio.<provider>.<test-type>.conf.ts` + `wdio.base.conf.ts` | `wdio.embedded.multiremote.conf.ts` |
| Package script (single provider) | `test:<test-type>` | `test:multiremote` |
| Package script (multi-provider) | `test:<provider>:<test-type>` | `test:embedded:multiremote` |
| Root script | `test:<framework>[:<provider>]:<test-type>` | `test:tauri:embedded:multiremote`, `test:dioxus:multiremote` |
| Visual baseline dir | `__visual__/<platform>/<arch>[/<provider>]/baseline` | `__visual__/darwin/arm64/embedded/baseline` |
| Logs dir | `logs[/<provider>][/<scenario>]` | `logs/embedded/multiremote` |
| CI job | `<framework>` (single) or `<framework>-<provider>` (multi) | `dioxus`, `tauri-embedded` |

For single-provider services, drop the `<provider>` segment everywhere — don't invent a placeholder like `default`.

## Common gotchas

1. **Don't add unit tests.** This repo's purpose is *manual verification* of the user-facing service surface. Coverage thresholds, mocked-boundary tests, and unit suites belong in the upstream `wdio-desktop-mobile` package — adding them here duplicates work and creates two sources of truth.
2. **All three catalogs.** Missing a `minimum` entry passes locally (resolves via `default`) but breaks the catalog-switch matrix. Add to all three at once, even if `minimum` is just `^1.0.0`.
3. **Single-provider services have no provider dimension.** Don't invent `wdio.default.conf.ts` or `test:default` scripts. Drop the segment. If a second provider lands later, *then* fan out the configs and scripts in one PR.
4. **(Wry) `autoXvfb` is `false`.** The driver launches in the WDIO launcher process (not a worker), so `autoXvfb` sets up the display too late. CI wraps the full `pnpm run …` command in `xvfb-run` on Linux. CDP services don't have this constraint.
5. **(Wry) Cargo workspace layout.** `target/` lives at the *workspace* root, `src-<framework>/` is the workspace member. The `wdio.base.conf.ts` `tauriTargetDir` lookup assumes this — replicate the layout, don't put `target/` inside `src-<framework>/`.
6. **Per-provider visual baselines.** Different providers render slightly differently (driver-wrapped vs in-process; OS title bar present/absent). Visual baseline paths must include the provider segment, or cross-provider runs overwrite each other (see VRT-SPIKE-FINDINGS.md §3 in the example repo).
7. **Document platform exclusions inline.** When a CI matrix cell is `exclude:`d for a real platform constraint (no macOS support, missing TCC permission on hosted runners, etc.), include the *why* as a comment right next to the exclude entry. The Tauri jobs in `ci.yml` are the reference voice — multi-line comments are fine.
8. **Upstream fixture patches.** If the upstream `fixtures/e2e-apps/<framework>/` has a `[patch.crates-io]` block or other version-pinning shim (Dioxus does, pending an upstream PR), copy it *with the explanatory comment*. Dropping the comment loses the signal for when the patch can come out.
9. **No protocol handler? No deeplink test type.** `electron-script` ships without one upstream, so its deeplink cell is `exclude:`d in CI and there's no `test:electron-script:deeplink` script. Same rule for any service: if the *fixture* can't register `testapp://`, drop the cell rather than shipping a spec that no-ops.
10. **Specs match upstream Tauri exactly.** Convergence is the point. If a spec needs a framework-specific tweak, it's a bug in the spec — either the spec is too coupled to Tauri's surface, or the new service is diverging from the standard API. Fix the divergence; don't fork the spec.

## Reference layouts (worked examples by archetype)

- **CDP / multi-build-tool** — `packages/electron-builder/`, `packages/electron-forge/`, `packages/electron-script/`. Clone for any new CDP-based service with multiple build tools.
- **Wry / multi-provider** — `packages/tauri/`. Clone for any new Wry-based service whose upstream exposes >1 driver provider.
- **Wry / single-provider** — none shipped yet; clone `packages/tauri/` and collapse the provider dimension. The first Dioxus pass through this skill will become the reference for this shape.

→ **Fixture template + spec inventory:** [fixture-and-specs.md](fixture-and-specs.md)
→ **Upstream service architecture context:** `~/Workspace/wdio-desktop-mobile/.claude/skills/add-native-service/SKILL.md`
