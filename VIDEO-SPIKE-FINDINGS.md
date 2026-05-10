# Video-recording spike findings — `wdio-video-reporter` v6.2.0 with `@wdio/electron-service` and `@wdio/tauri-service`

Phase B of the video-recording investigation, following the VRT spike pattern (PR #123 → docs PR). Validates whether [`wdio-video-reporter`](https://github.com/webdriverio-community/wdio-video-reporter) — the only viable WDIO video-recording package per the Phase A ecosystem scan — composes cleanly with the desktop services in this repo.

Spike branch: `feat/video-recording-spike`. PR: #124.

## TL;DR

**All 16 video cells passed.** No exclusions needed beyond the one we predicted (`(macos-latest, tauri-crabnebula, video)` due to Screen Recording / TCC).

| App | Provider | macOS | Linux | Windows |
|---|---|---|---|---|
| electron-builder | wdio-electron | ✅ | ✅ | ✅ |
| electron-forge | wdio-electron | ✅ | ✅ | ✅ |
| electron-script | wdio-electron | ✅ | ✅ | ✅ |
| tauri | embedded | ✅ | ✅ | ✅ |
| tauri | official | n/a (skipped on macOS) | ✅ | ✅ |
| tauri | crabnebula | n/a (excluded) | ✅ | ✅ |

**Recommendation: `wdio-video-reporter` works as-is. Document it in `wdio-desktop-mobile/docs/video-recording.md` mirroring the visual-testing doc, and flip the ROADMAP's "Cross-cutting Capabilities" video row from 🔍 to ✅.**

## Setup

Same shape as the VRT spike:

```yaml
# pnpm-workspace.yaml — added to default + next catalogs
wdio-video-reporter: ^6.2.0
```

```jsonc
// package.json — added to pnpm.onlyBuiltDependencies so the bundled
// @ffmpeg-installer binaries can run their postinstall scripts.
"pnpm": {
  "onlyBuiltDependencies": [
    "@ffmpeg-installer/darwin-arm64",
    "@ffmpeg-installer/darwin-x64",
    "@ffmpeg-installer/linux-arm",
    "@ffmpeg-installer/linux-arm64",
    "@ffmpeg-installer/linux-ia32",
    "@ffmpeg-installer/linux-x64",
    "@ffmpeg-installer/win32-ia32",
    "@ffmpeg-installer/win32-x64",
    "electron", "electron-winstaller", "esbuild"
  ]
}
```

Per-package: dedicated `wdio.video.conf.ts` (or `wdio.<provider>.video.conf.ts` for Tauri) that composes from the standard config via a workspace-root `asVideoConfig(base, outputDir, VideoReporter)` helper.

```ts
// packages/<pkg>/wdio.video.conf.ts
import VideoReporter from 'wdio-video-reporter';
import { asVideoConfig } from '../../wdio.video.shared.ts';
import { config as base } from './wdio.conf.ts';

export const config = asVideoConfig(
  base,
  join(__dirname, '__video__', process.platform, process.arch),
  VideoReporter,
);
```

The `VideoReporter` is imported per-package (where it's installed via `catalog:default`) and passed into the workspace-root helper, because the helper itself lives where the package isn't resolvable.

Specs (`test/video/video.spec.ts`) exercise a handful of clicks — the reporter captures a frame after each command in its allowlist (`click`, `setValue`, `keys`, …), so 4–5 clicks back-to-back is enough to produce a meaningful stitched video.

## What worked

1. **Drop-in install across all four packages.** The reporter's WDIO 9 peer deps line up; `@ffmpeg-installer/ffmpeg` provides a bundled binary so no host ffmpeg is needed.
2. **All 9 Electron cells** (builder/forge/script × macOS/Linux/Windows) produced `.webm` files. Capture goes through Chromedriver's `browser.saveScreenshot`, which is renderer-only — the videos show the app's HTML content, not OS chrome.
3. **All 3 Tauri-embedded cells** worked. `browser.saveScreenshot` resolves to our bespoke W3C handler in `tauri-plugin-webdriver`, which the reporter consumes fine.
4. **Both Tauri-official cells passed** (Linux + Windows). This is the most surprising result — we anticipated the Linux cell might hit the `executeAsync` hang we documented for `@wdio/visual-service` (where the visual service's `before()` hook calls `browser.execute('return window.devicePixelRatio')` which never returns on tauri-driver + WebKitGTK). **The video reporter does not run a `before()` initialisation script**, so the hang doesn't trip it. It just listens for command events and takes a screenshot after each — a fundamentally different lifecycle.
5. **Both Tauri-crabnebula cells passed** (Linux + Windows). On macOS the same Screen Recording permission limitation applies (because the reporter calls `browser.saveScreenshot`, which CrabNebula's macOS driver routes through OS-level capture); we excluded the cell upfront.
6. **Output files** are `.webm` (default; configurable to `.mp4`), per-test, filenamed after the test plus timestamp. ~30–60 KB for a 5–6 frame stitched video. Reasonable for a debugging artefact.

## What's surprising / what users need to know

### 1. Capture is screenshot-stitching, not "real" video

The reporter takes one screenshot **per command in its allowlist** (`click`, `doubleClick`, `setValue`, `keys`, navigation, etc.), plus optionally an interval timer (minimum 0.5s). Frames are stitched with bundled ffmpeg at the end of each test. Practical consequences:

- The result is a low-fps slideshow, not a smooth 30fps video. With `videoSlowdownMultiplier: 3` (default) it's roughly 3–10 fps in apparent playback.
- **No cursor tracking** ([wdio-video-reporter#588](https://github.com/webdriverio-community/wdio-video-reporter/issues/588)) — between frames, cursor motion is invisible.
- **No alert / native-dialog capture** — the reporter relies on `saveScreenshot` which is webview-scoped.
- **Real-time animations are invisible** unless they happen to be paused on a frame boundary.

This is fine for "what happened during this failed test?" debugging — which is the canonical use case for test-recording video — but **don't expect it to substitute for a real screencast**.

### 2. The Linux+tauri-official cell works (unexpectedly)

The VRT spike documented that `(ubuntu-latest, tauri-official, visual)` is broken because the visual service's `before()` hook hangs on tauri-driver + WebKitGTK + `executeAsync`. We anticipated the video reporter might trip the same issue. **It doesn't** — the reporter has no `before()` script that runs `browser.execute`. It registers command listeners passively and only triggers `saveScreenshot` after each user-initiated command. WebKitGTK's `saveScreenshot` endpoint works fine; the hang only manifests with `executeAsync`.

This is a useful data point for the broader story: the `@wdio/tauri-service × WebKitGTK × executeAsync` interaction is narrowly scoped to packages that bootstrap via `browser.execute` in a service `before()` hook.

### 3. Bundled `@ffmpeg-installer/ffmpeg` works cross-platform

Even on Windows hosted runners (where ffmpeg isn't preinstalled and we couldn't get `ddagrab` working during the screenshot investigation), the bundled binary stitches frames without issue. The reporter doesn't need any of the OS-level capture devices (`gdigrab` / `avfoundation` / `x11grab`) — it only needs ffmpeg's image-to-video encoder, which has no OS dependencies.

This sidesteps every CI footgun the build-our-own OS-level option (Phase C path 3) would have hit.

### 4. CrabNebula on macOS is the only impossible cell

Same root cause as the visual cell: CrabNebula's macOS driver routes screenshots through OS-level Screen Recording (AVFoundation / ScreenCaptureKit), which requires a TCC permission that can't be granted programmatically on hosted GitHub Actions macOS runners. The reporter ends up calling `saveScreenshot`, which times out / errors. Excluded by design; users on macOS CI should use the `embedded` provider for video coverage.

### 5. Known reporter issues that didn't bite us — but might bite other users

- [**#967 — MultiRemote broken**](https://github.com/webdriverio-community/wdio-video-reporter/issues/967): the reporter calls `browser.takeScreenshot()` on the root multiremote object instead of named instances. Our matrix doesn't exercise multiremote in the `video` test-type (we didn't wire it that way — the spike spec runs single-remote per cell). Users with multiremote setups will hit this bug.
- [**#862 — Hang on `saveAllVideos: true`**](https://github.com/webdriverio-community/wdio-video-reporter/issues/862): we explicitly use `saveAllVideos: true` for the spike, and didn't observe a hang. The reported repro mentions "dynamic sites" — our test apps are largely static, so we may be in the lucky bucket. Caveat noted in our recommended docs config: default to `saveAllVideos: false` (retain on failure only).
- [**#865 — Empty `.webm` attached to Allure on passing tests**](https://github.com/webdriverio-community/wdio-video-reporter/issues/865): we don't use Allure, so didn't observe this.

## Recommended user-facing config (for `wdio-desktop-mobile` docs)

Mirroring `docs/visual-testing.md`'s structure. The eventual docs PR will turn this into the recommended setup.

**Electron:**

```ts
// wdio.conf.ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import VideoReporter from 'wdio-video-reporter';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const config = {
  // ...
  services: ['electron'],
  capabilities: [{ browserName: 'electron' }],
  reporters: [
    'spec',
    [
      VideoReporter,
      {
        outputDir: join(__dirname, '__video__', process.platform, process.arch),
        saveAllVideos: !!process.env.CI ? false : true, // CI: retain on failure; local: keep all for debugging
        videoSlowdownMultiplier: 3,
      },
    ],
  ],
};
```

**Tauri:**

```ts
// wdio.conf.ts
const driverProvider = 'embedded';

export const config = {
  services: [['@wdio/tauri-service', { driverProvider }]],
  capabilities: [{ browserName: 'tauri', 'wdio:enforceWebDriverClassic': true }],
  reporters: [
    'spec',
    [
      VideoReporter,
      {
        outputDir: join(__dirname, '__video__', process.platform, process.arch, driverProvider),
        saveAllVideos: !!process.env.CI ? false : true,
        videoSlowdownMultiplier: 3,
      },
    ],
  ],
};
```

Add `__video__` to `.gitignore`. Per-provider output paths matter on Tauri (CrabNebula captures the OS title bar, embedded is webview-only — same partitioning rule as the visual-service finding).

## Phase C — next step

Per the Phase A decision tree: **Phase C path 1 (Works cleanly across our matrix → docs PR)**.

1. Open a docs PR on `wdio-desktop-mobile` adding `docs/video-recording.md`.
2. Cross-link from per-package READMEs' Operations / Guides sections (the user's edits to the visual docs PR suggest they may want to skip the root README + ROADMAP cross-links — defer that judgment to them).
3. Flip the ROADMAP "Cross-cutting Capabilities" video row from "🔍 Not yet planned" to "✅ Available", pointing at the new docs page.

Estimated docs PR size: ~150 lines (same as `docs/visual-testing.md`).

## References

- [`wdio-video-reporter` upstream docs](https://webdriver.io/docs/wdio-video-reporter/)
- [`wdio-video-reporter` GitHub](https://github.com/webdriverio-community/wdio-video-reporter)
- VRT cycle reference: [`VRT-SPIKE-FINDINGS.md`](./VRT-SPIKE-FINDINGS.md) in this repo, PR #123 (this repo), PR #266 (main repo).
- Phase A research: `~/Workspace/wdio-video-recording/VIDEO-RESEARCH.md` (local; not committed — superseded by this doc).
