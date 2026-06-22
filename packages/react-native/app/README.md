# React Native E2E fixture (source overlay)

This directory is the **committed source** of the fixture app driven by
`@wdio/react-native-service` — the big-glass counter, in `App.tsx`.

The native `android/` and `ios/` projects are **not** committed. `scripts/build-app.mjs`
scaffolds a fresh React Native project into the gitignored `../.rn-build/` (via
`@react-native-community/cli init`, pinned to the `react-native` version in `package.json`),
overlays the files here (`App.tsx`, `index.js`, `app.json`), and builds the debug artifact.

## Stable selectors

Every interactive element exposes a stable accessibility id (Appium `~` selector) and `testID`:

| Selector | Element |
|----------|---------|
| `app-title` | Title text |
| `counter` | The current count |
| `increment-button` | `+` |
| `decrement-button` | `−` |
| `reset-button` | `Reset` |
| `status` | Last-action status line |

## Hooks for `execute` / `mock` / `emitEvent`

- `globalThis.greet(name)` — a plain function in the Hermes realm, exercised by
  `browser.reactNative.execute` and `browser.reactNative.mock('greet')`.
- `DeviceEventEmitter.emit('wdio:setCount', n)` — sets the counter, exercised by
  `browser.reactNative.emitEvent('wdio:setCount', n)`.

> **Hermes + Metro required.** `execute`/`mock`/`emitEvent` drive the app's JS realm over the
> Hermes inspector exposed by Metro (debug builds only). Release builds support native find/tap
> only.
