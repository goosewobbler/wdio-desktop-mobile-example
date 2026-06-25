import { appendFileSync, globSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FlutterServiceOptions } from '@wdio/native-types';
import type { Options, Services } from '@wdio/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const flutterRoot = __dirname;

// The native app is built into the gitignored .flutter-build/ by scripts/build-app.mjs (or, in CI,
// by a dedicated workflow step that exports FLUTTER_APP_PATH).
const buildDir = join(__dirname, '.flutter-build');

export type Platform = 'android' | 'ios';

/** Target platform for this run. Android by default; the iOS leg sets FLUTTER_PLATFORM=ios. */
export function currentPlatform(): Platform {
  return (process.env.FLUTTER_PLATFORM ?? 'android').toLowerCase() === 'ios' ? 'ios' : 'android';
}

const newest = (paths: string[]): string =>
  paths.map((p) => ({ p, m: statSync(p).mtimeMs })).sort((a, b) => b.m - a.m)[0].p;

/**
 * Locate the built app for `appium:app`.
 *
 * Flutter is Appium-driven (like React Native, unlike the CDP/Wry desktop services): WDIO opens
 * the Appium session from `appium:app`, and appium-flutter-driver exposes the `FLUTTER` context the
 * service drives for find/tap. CI sets `FLUTTER_APP_PATH` to the exact artifact built by the job;
 * locally we glob Flutter's standard debug-build output under `.flutter-build/`. Build it first with
 * `pnpm build` (or `FLUTTER_PLATFORM=ios pnpm build`).
 */
export function resolveAppPath(platform: Platform = currentPlatform()): string {
  const override = process.env.FLUTTER_APP_PATH;
  if (override) {
    return override;
  }
  const pattern =
    platform === 'ios'
      ? join(buildDir, 'build', 'ios', 'iphonesimulator', '*.app')
      : join(buildDir, 'build', 'app', 'outputs', 'flutter-apk', 'app-debug.apk');
  const matches = globSync(pattern);
  if (matches.length === 0) {
    throw new Error(
      `No ${platform} app artifact found at ${pattern}. ` +
        `Build the fixture first (${platform === 'ios' ? 'FLUTTER_PLATFORM=ios ' : ''}pnpm build) or set FLUTTER_APP_PATH.`,
    );
  }
  return newest(matches);
}

// appium-flutter-driver registers as automationName `Flutter` on BOTH platforms (it's a meta-driver
// that wraps UiAutomator2/XCUITest internally), so a single driver covers Android and iOS.
const AUTOMATION_NAME = 'Flutter' as const;

/**
 * Shared service options. `captureBackendLogs` forwards the native device log (logcat/syslog) into
 * the WDIO log on each test.
 *
 * `doctor: false`: the example exercises only the backend-independent surface (find/tap, contexts,
 * deeplink) while the Dart-side `wdio_flutter` contract is unpublished. The strict preflight doctor
 * would require the appium-flutter-driver `getVMServiceUrl` fork on Android — needed only by the
 * (deferred) execute/mock specs. Flip to `{ strict: true }` when re-enabling the VM-bridge specs.
 */
function flutterServiceOptions(platform: Platform): FlutterServiceOptions {
  return {
    platform: platform === 'ios' ? 'iOS' : 'Android',
    captureBackendLogs: true,
    doctor: false,
  };
}

/**
 * Build the Appium capability. The service shape is "mutate caps + attach a JS-realm bridge", so the
 * capability is Appium-shaped (`platformName` + `appium:*`) with `wdio:flutterServiceOptions`
 * carrying the service config. The iOS-only keys encode CI fixes for the WDA/simulator first-session
 * flake — see the inline notes (mirrors the upstream e2e config + the React Native package).
 *
 * No `appium:dartVmServicePort` pin: the VM Service is only needed for execute/mock (deferred), and
 * the service discovers it lazily on first use anyway.
 */
export function buildFlutterCapability(platform: Platform = currentPlatform()): WebdriverIO.Capabilities {
  const isIos = platform === 'ios';
  return {
    platformName: isIos ? 'iOS' : 'Android',
    'appium:automationName': AUTOMATION_NAME,
    'appium:app': resolveAppPath(platform),
    'appium:newCommandTimeout': 240,
    ...(isIos
      ? {
          // iOS needs a target simulator; CI sets FLUTTER_IOS_DEVICE (e.g. 'iPhone 16').
          'appium:deviceName': process.env.FLUTTER_IOS_DEVICE ?? 'iPhone 16',
          // Pin the exact simulator the workflow already booted. Without a udid, appium resolves
          // deviceName independently and — when the runner image carries duplicate device names —
          // can boot a *different* instance than CI pre-booted. CI exports FLUTTER_IOS_UDID; omitted
          // locally (appium resolves by name).
          ...(process.env.FLUTTER_IOS_UDID ? { 'appium:udid': process.env.FLUTTER_IOS_UDID } : {}),
          // wdaLaunchTimeout is a ceiling, not a delay. With a prebuilt WDA (FLUTTER_WDA_DD) the first
          // session just launches it (fast); without one, appium compiles WDA on first session
          // (minutes), so the wait must stay generous.
          'appium:wdaLaunchTimeout': process.env.FLUTTER_WDA_DD ? 120000 : 720000,
          // CI boots the sim headless (simctl). Without isHeadless, XCUITest restarts it on
          // session-create with the Simulator window visible — a slow GUI re-boot on a display-less
          // runner. Headless reuses the already-booted sim. CI-only.
          ...(process.env.CI ? { 'appium:isHeadless': true } : {}),
          'appium:simulatorStartupTimeout': 240000,
          // WDA on hosted sims often fails the first attempt (ECONNREFUSED 8100); appium defaults to
          // 2 startup retries — bump it.
          'appium:wdaStartupRetries': 5,
          'appium:wdaStartupRetryInterval': 20000,
          // CI pre-builds WDA into FLUTTER_WDA_DD; install + launch it via usePreinstalledWDA (no
          // per-session xcodebuild). Omitted locally so appium builds WDA itself.
          ...(process.env.FLUTTER_WDA_DD
            ? {
                'appium:usePreinstalledWDA': true,
                'appium:prebuiltWDAPath': `${process.env.FLUTTER_WDA_DD}/Build/Products/Debug-iphonesimulator/WebDriverAgentRunner-Runner.app`,
              }
            : {}),
        }
      : {}),
    'wdio:flutterServiceOptions': flutterServiceOptions(platform),
  } as WebdriverIO.Capabilities;
}

/**
 * `@wdio/appium-service` boots the Appium server; `@wdio/flutter-service` prepares the capabilities
 * (automationName `Flutter`) and attaches the Dart VM Service for execute/mock. Appium is composed at
 * the runner — it is a devDependency of this package, never a dependency of the service.
 *
 * `logPath` writes the full appium server output to <logDir>/wdio-appium.log (picked up by ci:logs);
 * `--log-level debug` surfaces the driver's session-create trace, the only place the iOS WDA flake
 * is diagnosable.
 */
export function appiumService(logDir: string): Services.ServiceEntry {
  return ['appium', { logPath: logDir, args: { logLevel: 'debug' } }];
}

export function flutterService(): Services.ServiceEntry {
  // Bare string: the service reads its options from the capability's wdio:flutterServiceOptions.
  return 'flutter';
}

export function logsDir(scenario?: string): string {
  return scenario ? join(__dirname, 'logs', scenario) : join(__dirname, 'logs');
}

/**
 * afterTest hook factory: on a test failure, write the Appium page source to a .log in the run's
 * output dir (uploaded by ci:logs, unlike hook stdout) so a NoSuchElement is diagnosable from the
 * actual UI hierarchy rather than re-guessing.
 */
export function pageSourceAfterTest(logDir: string) {
  return async (test: { title?: string }, _ctx: unknown, result: { error?: unknown }): Promise<void> => {
    if (!result.error) {
      return;
    }
    const out = join(logDir, 'page-source.log');
    try {
      const { browser } = await import('@wdio/globals');
      const source = await browser.getPageSource();
      mkdirSync(logDir, { recursive: true });
      appendFileSync(out, `\n===== ${test.title ?? 'test'} =====\n${source}\n`);
    } catch (err) {
      try {
        mkdirSync(logDir, { recursive: true });
        appendFileSync(out, `\ncapture failed for '${test.title ?? 'test'}': ${(err as Error).message}\n`);
      } catch {
        // best-effort diagnostic; never let it mask the real test failure
      }
    }
  };
}

const isIos = currentPlatform() === 'ios';

/**
 * Shared bits of the WDIO testrunner config. Each test-type config spreads `baseConfig` and overrides
 * `specs`, `exclude`, `capabilities`, `services`, `outputDir`, and `afterTest` (page-source capture
 * scoped to the run's output dir).
 *
 * No `autoXvfb`: there is no desktop display to set up — the Android emulator runs headless via the
 * CI emulator action, and iOS uses the simulator. Appium owns the session lifecycle.
 */
export const baseConfig: Partial<Options.Testrunner> = {
  runner: 'local',
  // One emulator/simulator per run; the device pool / multiremote is exercised by the service's own
  // unit tests upstream, not here.
  maxInstances: 1,
  logLevel: 'info',
  bail: 0,
  baseUrl: '',
  waitforTimeout: 15000,
  // iOS: generous per-command ceiling for cold WDA compile when no prebuilt WDA; Android tight.
  connectionRetryTimeout: isIos ? (process.env.FLUTTER_WDA_DD ? 420000 : 900000) : 180000,
  // 0: a failed iOS session-create otherwise retries the full timeout, ballooning runtime; the
  // deferred specFileRetry below is the recovery path instead.
  connectionRetryCount: 0,
  // Two spec retries to absorb transient mobile-CI flake (emulator/simulator boot, first-session
  // attach, WDA-not-up). Each retry is a fresh session.
  specFileRetries: 2,
  specFileRetriesDeferred: false,
  port: 4723,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
    retries: 0,
  },
  // App-ready gate: wait for the fixture to be interactive before any spec runs.
  before: async () => {
    const { browser } = await import('@wdio/globals');
    // Switch into the FLUTTER context first; some drivers throw on a redundant switch, so the
    // optional-chained catch short-circuits an already-in-FLUTTER (or missing-command) case.
    await browser.switchContext?.('FLUTTER')?.catch(() => undefined);
    // Gate on the increment button via the appium-flutter base64 finder + `flutter:waitFor` — NOT
    // browser.$('~...').waitForDisplayed: appium-flutter-driver doesn't implement findElement, and a
    // raw JSON finder string is base64-decoded to garbage. A never-ready app fails fast here instead
    // of every spec timing out later.
    const increment = Buffer.from(
      JSON.stringify({ finderType: 'ByValueKey', keyValueString: 'increment', keyValueType: 'String' }),
    ).toString('base64');
    await browser.execute('flutter:waitFor', increment, 90000);
  },
};
