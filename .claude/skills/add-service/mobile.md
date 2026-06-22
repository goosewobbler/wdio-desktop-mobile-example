# Mobile Reference (Appium family)

Detail behind [SKILL.md](SKILL.md) for the **mobile family** — services where **Appium owns the session** (UiAutomator2 on Android, XCUITest on iOS over W3C WebDriver). The shipped reference is `packages/react-native/`; treat it as the live source of truth, this doc is the abstraction so the next mobile service (Flutter, Capacitor) lands shaped the same way.

For desktop services that spawn their own app + driver, see [fixture-and-specs.md](fixture-and-specs.md) instead. For the upstream service-internals view (how the bridges actually work), read `~/Workspace/wdio-desktop-mobile/.claude/skills/add-native-service/plumbing-mobile.md`.

## How mobile differs from desktop (the whole reason this doc exists)

| Concern | Desktop | Mobile |
|---|---|---|
| Who launches the app | the service (spawns a binary/driver it owns) | **Appium** (the service only mutates caps + attaches a JS-realm bridge) |
| Composition | `services: [<framework>Service(provider)]` | `services: [['appium', {…}], '<framework>']` — `@wdio/appium-service` is a **package devDep**, not a service dep |
| Run dimension | provider (`embedded`/`official`/…) | **platform** (`android`/`ios`), via an env var — no provider fan-out |
| Capability | `<framework>:options` + a binary path | `platformName` + `appium:automationName` + `appium:app` + `wdio:<framework>ServiceOptions` |
| `build` | compiles a binary (cargo / electron-vite) | builds a **native app** (APK / `.app`) from a **scaffolded** project |
| Committed app source | full fixture (HTML/rsx/Rust) | **JS only** (`app/App.tsx` + config); native project scaffolded at build time |
| "Windows" | `switchWindow`/`listWindows` | **contexts** — `switchContext`/`listContexts` (`NATIVE_APP` ↔ `WEBVIEW_*`) |
| Deeplink | OS-protocol spawn (`xdg-open`/`open`/`rundll32`) | Appium **`mobile: deepLink`** |
| Logs | one channel (driver) | **two** — native device logs (logcat/syslog) + JS console over the realm bridge |
| CI | per provider, one OS matrix | **per platform** — Android (emulator) and iOS (simulator) are structurally different jobs |
| Build for execute/mock | any build | **debug/Metro build only** (the Hermes inspector / VM Service is debug-only) |

## Package shape

One package per framework: `packages/<framework>/`. No provider dimension. Platform is selected by an env var (`RN_PLATFORM=android|ios`, default android), so the configs are `wdio.<test-type>.conf.ts` + `wdio.base.conf.ts` — the same single-dimension shape as a single-provider desktop service, with platform carried at runtime, not in the filename.

```
packages/<framework>/
├── package.json            # @wdio-desktop-mobile-example/<name>; deps below
├── tsconfig.json           # exclude app/ and .rn-build/ from the package typecheck
├── .gitignore              # ignore /.rn-build and /logs
├── wdio.base.conf.ts       # Appium capability builder + service factories + baseConfig
├── wdio.conf.ts            # standard
├── wdio.<test-type>.conf.ts  # one per non-standard test type (deeplink, contexts, …)
├── app/                    # COMMITTED fixture source overlay (App.tsx + JS config)
├── .rn-build/              # GENERATED native project (gitignored)
├── scripts/build-app.mjs   # scaffold native project + build debug artifact
├── test/
│   ├── api.spec.ts  application.spec.ts  execute.spec.ts  mocking.spec.ts
│   ├── logging.spec.ts  contexts.spec.ts  deeplink.spec.ts
│   └── lib/{helpers,utils}.ts
└── README.md
```

### Phase 1 — Bootstrap

- npm name `@wdio-desktop-mobile-example/<dir>`, `"private": true`, ESM. **`engines.node >= 22.12`** (the service engine; the WDIO config uses `fs.globSync`).
- **devDependencies** (all `@wdio/*` + `appium` via `catalog:default`): `@wdio/appium-service`, `@wdio/<framework>-service`, `@wdio/native-types` (the `browser.<framework>` type augmentation the specs import), `appium`, plus the usual `@wdio/cli|globals|local-runner|mocha-framework|types`, `webdriverio`, `tsx`, `typescript`. **No** `@wdio/xvfb`, `@wdio/visual-service`, `wdio-video-reporter` (no visual/video in the pragmatic mobile slice). **Do NOT** add the Appium drivers as deps — they install into Appium's home (`appium driver install …`) in CI/local setup.
- `build` → `node ./scripts/build-app.mjs` (platform from `RN_PLATFORM`). `clean` removes `.rn-build`, `logs`, `node_modules`. `test`/`test:<type>` → `wdio run ./wdio.<…>.conf.ts`. `ci:logs` same shell as dioxus.

`wdio.base.conf.ts` exports (pattern: `packages/react-native/wdio.base.conf.ts`, itself adapted from upstream `e2e/wdio.react-native.conf.ts`):

```ts
export function currentPlatform(): 'android' | 'ios';            // from RN_PLATFORM, default android
export function resolveAppPath(platform?): string;               // RN_APP_PATH override else glob .rn-build
export function build<Framework>Capability(platform?): WebdriverIO.Capabilities;  // platformName + appium:* + wdio:<…>ServiceOptions
export function appiumService(logDir): Services.ServiceEntry;     // ['appium', { logPath: logDir, args: { logLevel: 'debug' } }]
export function <framework>Service(): Services.ServiceEntry;      // bare '<framework>' string; reads options from the capability
export function logsDir(scenario?): string;                       // logs[/<scenario>]
export function pageSourceAfterTest(logDir);                      // afterTest factory: dumps Appium page source on failure
export const baseConfig: Partial<Options.Testrunner>;             // see below
```

`baseConfig` carries the mobile-tuned runner config: `runner: 'local'`, `maxInstances: 1`, `specFileRetries: 2` (absorb emulator/sim boot + first-attach flake), an app-ready `before` gate (`browser.$('~counter').waitForDisplayed`), `port: 4723`, `mochaOpts.timeout: 120000`, and the iOS-aware `connectionRetryTimeout` (`isIos ? (RN_WDA_DD ? 420000 : 900000) : 180000`). **No `autoXvfb`** — there's no desktop display. Each per-test-type config spreads `baseConfig` and sets `specs`, `capabilities: [build<Framework>Capability()]`, `services: [appiumService(outputDir), <framework>Service()]`, `outputDir`, and `afterTest: pageSourceAfterTest(outputDir)`.

**Capability shaping** (port the iOS WDA/simulator block verbatim from `packages/react-native/wdio.base.conf.ts` — it encodes hard-won first-session-flake fixes): per-platform `appium:automationName` from `{ android: 'UiAutomator2', ios: 'XCUITest' }`; `appium:app` from `resolveAppPath`; iOS-only `appium:udid` (pin the booted sim), `wdaLaunchTimeout`, `simulatorStartupTimeout`, `wdaStartupRetries`, `isHeadless` (CI), and `usePreinstalledWDA`/`prebuiltWDAPath` (only when `RN_WDA_DD` is set). Gate every branch on the capability's platform, **never `process.platform`**.

### Phase 2 — Fixture (scaffold-in-CI)

**Copy the JS source verbatim** from upstream `fixtures/e2e-apps/<framework>/` into `app/` — `App.tsx` (the big-glass counter), `index.js`, `app.json`, `babel.config.js`, `metro.config.js`, `tsconfig.json`, `package.json`, `.gitignore`. Do **not** commit `android/`/`ios/`.

- **The visual-template guidance is different from desktop.** RN renders via `StyleSheet`, not HTML/CSS — carry the upstream `App.tsx` as-is rather than reproducing the big-glass CSS. The required **selectors are the same set** (`app-title`, `counter`, `increment-button`, `decrement-button`, `reset-button`, `status`) but exposed as `testID`/accessibility ids and selected with `$('~<id>')` (the `el()` helper). Keep the iOS caveat in `sel()`: set `accessibilityLabel` only on Android, never iOS (it shadows a value-bearing element's text).
- Keep the realm hooks: `globalThis.greet()` (for execute/mock) and the `DeviceEventEmitter('wdio:setCount')` listener (for `emitEvent`).
- **`scripts/build-app.mjs`** is the new piece: it scaffolds a fresh project with `@react-native-community/cli init` (pinned to the `react-native` version in `app/package.json`) into the gitignored `.rn-build/`, overlays `app/App.tsx`/`index.js`/`app.json`, and builds the **debug** artifact (`assembleDebug` / `xcodebuild -sdk iphonesimulator`). Make it **idempotent**: no-op when `RN_APP_PATH` is set (CI builds in a dedicated step) or the artifact already exists, so it's a cheap `turbo build` dependency. Debug is mandatory — `execute`/`mock` attach to the Hermes inspector, which is debug-only.

### Phase 3 — Specs (mirror upstream RN's set)

Port the upstream `e2e/test/<framework>/*.spec.ts` set; they already call `browser.<framework>.*` and use `~`-accessibility-id selectors, so they transfer almost verbatim. Mobile inventory:

| Spec | Covers | Notes |
|---|---|---|
| `api.spec.ts` | `browser.<framework>` surface present; basic `execute` | |
| `application.spec.ts` | native find/tap over Appium — counter via `el()` | assert deltas, not absolutes (retries reuse the session) |
| `execute.spec.ts` | execute statement/function/JSON round-trip/error | folds the desktop `execute-advanced`+`execute-data-types` into one |
| `mocking.spec.ts` | `mock` + call history + restore | |
| `logging.spec.ts` | frontend JS console capture + `emitEvent` | reads the run's `logs/<scenario>` via `currentLogDir` |
| `contexts.spec.ts` | `listContexts`/`switchContext` (`NATIVE_APP`) | **the window→contexts rename** |
| `deeplink.spec.ts` | `triggerDeeplink` resolves | trigger-only unless the fixture registers a scheme |

`it('should …')` throughout. Pragmatic first slice: **standard** (api/application/execute/mocking/logging) + **deeplink** + **contexts**. Defer `multiremote` (needs 2 devices), `standalone`, `visual` (per-device baselines), `video` — and **document the omissions in the package README with the *why***. `test/lib/utils.ts` is the dioxus log-helper set (`currentLogDir`/`readWdioLogs`/…); `test/lib/helpers.ts` is the `el()` `~`-selector.

### The JS-realm sub-axis (how `execute`/`mock` reach the scripting realm)

Independent of find/tap. Pick the channel matching the framework's engine (confirm in the upstream service):

- **Hermes / CDP** (React Native) — reuses `@wdio/native-cdp-bridge` over Metro's inspector. Synchronous IIFEs only (Hermes can't eval `async`). Connect **lazily** on first command. **Tier 1** mock (transparent script-builder injection).
- **Dart VM** (Flutter) — its own VM Service protocol; `evaluate` RPC for `execute`. Mock is **Tier 2** (cooperative contract — the app opts in via a Dart package; no transparent monkeypatch).
- **WebView context** (Capacitor) — the realm *is* the webview; `execute`/`mock` run via W3C `browser.execute` in the `WEBVIEW_*` context. Tier 1, minimal new plumbing beyond context switching.

The converged **surface** (`execute`, `mock`, `clear/reset/restoreAllMocks`, `switchContext`, `triggerDeeplink`, `emitEvent`) stays identical — only the inner mechanism differs. Full detail: upstream `plumbing-mobile.md`.

### Phase 4 — Scripts, catalogs, turbo

- **Root `package.json`:** `test:<framework>` (alias → standard) + `test:<framework>:<test-type>` for each type, wired via `turbo run test[:<type>] --filter=…`. Platform is env-driven, so **no per-platform script fan-out** — CI sets `RN_PLATFORM`; document `RN_PLATFORM=ios pnpm test:<framework>` for the iOS leg. Add `ci:logs:<framework>`.
- **`turbo.json`:** reuse the shared `test`/`test:deeplink` tasks; add any new test-type task (e.g. `test:contexts`, cloned from `test:deeplink`). Add the RN env keys (`RN_PLATFORM`, `RN_APP_PATH`, `RN_IOS_UDID`, `RN_IOS_DEVICE`, `RN_WDA_DD`, `RN_METRO_PORT`) to the `env` of those tasks so android/ios runs don't cross-cache, and add `app/**` + `scripts/build-app.mjs` to the `build` task inputs.
- **`pnpm-workspace.yaml`** — add to **all three catalogs**: `@wdio/<framework>-service` (`next` — pre-1.0), `@wdio/native-types` (**watch the version line** — it ships on `2.x latest`, not `next`), `@wdio/appium-service` (track the wdio v9 line, e.g. `^9.19.1`), `appium` (`^3.5.0` — the drivers need Appium 3). Pin to exactly what the upstream `e2e/package.json` and `npm view <service>@next dependencies` use. The Appium **drivers** are NOT catalogued — they install into Appium's home.

### Phase 5 — CI (per platform)

Add jobs to `.github/workflows/_ci.reusable.yml`, **gated off the minimum catalog** (`if: ${{ inputs.catalog != 'minimum' }}` — the service needs webdriverio 9 + Node 22, which the wdio-8 minimum catalog can't satisfy; the catalog entries still exist so `switch-catalog.ts` resolves). Use **Node 22.x** (the rest of the matrix is 20.x). Share the standard setup block (checkout, setup-node, pnpm cache, action-setup, the frozen/refresh install, the `Switch to <catalog>` step), then:

- **Android** (`ubuntu-latest`, single combined job — the JS bundle couples to the APK at runtime): free disk → enable KVM → JDK 17 → scaffold `.rn-build` + overlay `app/App.tsx` + `gradlew assembleDebug -PreactNativeArchitectures=x86_64` (export `RN_APP_PATH`) → `appium driver install uiautomator2` (idempotent) → `reactivecircus/android-emulator-runner` (pin the SHA; API 35, x86_64, `-gpu swiftshader_indirect`): `adb reverse tcp:8081 tcp:8081`, start Metro, `wait-on tcp:8081`, run the test types.
- **iOS** (`macos-latest`): scaffold → `pod install` (`RCT_NEW_ARCH_ENABLED=0`) → `xcodebuild -sdk iphonesimulator` (export `RN_APP_PATH`) → warm Xcode toolchain → boot a concrete simulator UDID (export `RN_IOS_UDID`) → `appium driver install xcuitest` → start Metro + pre-bundle (`curl …/index.bundle`) → run the test types. The example repo **lets Appium compile WebDriverAgent on first session** (don't set `RN_WDA_DD`) and relies on the config's generous timeouts — simpler than the upstream split-build + prebuilt-WDA optimization, which exists for a high-volume matrix this manual-verification target doesn't have.
- Both jobs end with a Metro-log tail + `ci:logs:<framework>` on failure. Default to a **single architecture** (Paper: `newArchEnabled=false` / `RCT_NEW_ARCH_ENABLED=0`) — the inspector registers sooner than under Fabric. The dual Paper/Fabric matrix lives upstream; note the Fabric-registers-later caveat inline if you ever add it.

### Phase 6 — Docs

Same as desktop: root `README.md` table row + run-commands block (note the `RN_PLATFORM` switch + the Appium-driver/SDK prerequisites), and a `packages/<name>/README.md` covering prerequisites, the build (scaffold) flow, each test type, and the **deferred test types** with the *why*. Link back to the upstream `@wdio/<framework>-service`.

## Mobile gotchas (in addition to the SKILL.md list)

1. **Appium is a *runner* dep, not a service dep.** List `@wdio/appium-service` in the package's devDependencies and compose `['appium', '<framework>']` at the config. Never add it to a service's own `package.json`.
2. **Gate on the capability's `platformName`, never `process.platform`.** One host drives either OS over Appium; the discriminator lives on the cap.
3. **Connect to the JS realm lazily.** The `before` warm-up races the inspector's post-launch registration; do the real connect on first `execute`/`mock`/`emitEvent`. Backgrounding the app kills the Hermes inspector — the bridge must re-attach on the next command.
4. **Debug/Metro build is mandatory for execute/mock.** Release builds have no inspector/VM Service. Say so in the README; the fixture build script builds debug.
5. **Drivers live in Appium's home, not node_modules.** Install with `appium driver install <name>` (idempotent — appium exits 1 if already registered). Don't catalog them as npm deps. (This is also why the upstream's prebuilt-WDA `find node_modules/.pnpm …` step doesn't translate here — let Appium build WDA instead.)
6. **Node 22 + wdio 9.** The service won't run on the wdio-8 minimum catalog — gate the CI jobs off it, and bump the RN jobs' matrix to Node 22.x.
7. **Device pool uses a monotonic cursor.** If you wire multiremote/parallel later, allocate from `#nextIndex++ % devices.length`, not `claimed.size` (which shrinks on release and re-hands a live index).
8. **iOS first-session flake is real.** Pin `appium:udid` to the sim you booted, bump `wdaStartupRetries`, set `isHeadless` in CI, and keep `connectionRetryTimeout` generous when WDA isn't prebuilt. These are ported verbatim from upstream because they encode fixes, not preferences — don't trim them.

→ **Upstream service-internals (bridges, mock tiers, extraction):** `~/Workspace/wdio-desktop-mobile/.claude/skills/add-native-service/plumbing-mobile.md`
→ **Back to the runbook:** [SKILL.md](SKILL.md) · **Desktop reference:** [fixture-and-specs.md](fixture-and-specs.md)
