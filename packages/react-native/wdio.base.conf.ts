import { appendFileSync, globSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReactNativeServiceOptions } from '@wdio/native-types';
import type { Options, Services } from '@wdio/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const reactNativeRoot = __dirname;

// The native app is built into the gitignored .rn-build/ by scripts/build-app.mjs (or, in CI,
// by a dedicated workflow step that exports RN_APP_PATH).
const buildDir = join(__dirname, '.rn-build');

export type Platform = 'android' | 'ios';

/** Target platform for this run. Android by default; the iOS leg sets RN_PLATFORM=ios. */
export function currentPlatform(): Platform {
  return (process.env.RN_PLATFORM ?? 'android').toLowerCase() === 'ios' ? 'ios' : 'android';
}

const newest = (paths: string[]): string =>
  paths.map((p) => ({ p, m: statSync(p).mtimeMs })).sort((a, b) => b.m - a.m)[0].p;

/**
 * Locate the built app for `appium:app`.
 *
 * React Native is Appium-driven (unlike the CDP/Wry desktop services): WDIO opens the Appium
 * session from `appium:app`, and the service attaches to the app's Hermes realm over Metro's
 * inspector for execute/mock. CI sets `RN_APP_PATH` to the exact artifact built by the job;
 * locally we glob the standard build output under `.rn-build/`. Build it first with
 * `pnpm build` (or `RN_PLATFORM=ios pnpm build`).
 */
export function resolveAppPath(platform: Platform = currentPlatform()): string {
  const override = process.env.RN_APP_PATH;
  if (override) {
    return override;
  }
  const pattern =
    platform === 'ios'
      ? join(buildDir, 'ios', 'build', 'Build', 'Products', 'Debug-iphonesimulator', '*.app')
      : join(buildDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', '*.apk');
  const matches = globSync(pattern);
  if (matches.length === 0) {
    throw new Error(
      `No ${platform} app artifact found at ${pattern}. ` +
        `Build the fixture first (${platform === 'ios' ? 'RN_PLATFORM=ios ' : ''}pnpm build) or set RN_APP_PATH.`,
    );
  }
  return newest(matches);
}

const AUTOMATION_NAME: Record<Platform, 'UiAutomator2' | 'XCUITest'> = {
  android: 'UiAutomator2',
  ios: 'XCUITest',
};

/**
 * Shared service options. Both log channels are forwarded into the WDIO log: backend = native
 * logcat/syslog, frontend = the app's JS/Metro console (the logging spec asserts frontend capture).
 */
function reactNativeServiceOptions(platform: Platform): ReactNativeServiceOptions {
  return {
    platform: platform === 'ios' ? 'iOS' : 'Android',
    metroPort: Number(process.env.RN_METRO_PORT ?? 8081),
    captureBackendLogs: true,
    captureFrontendLogs: true,
  };
}

/**
 * Build the Appium capability. The service shape is "mutate caps + attach a JS-realm bridge", so
 * the capability is Appium-shaped (`platformName` + `appium:*`) with `wdio:reactNativeServiceOptions`
 * carrying the service config. The iOS-only keys encode CI fixes for the WDA/simulator first-session
 * flake — see the inline notes (mirrors the upstream e2e config).
 */
export function buildReactNativeCapability(platform: Platform = currentPlatform()): WebdriverIO.Capabilities {
  const isIos = platform === 'ios';
  return {
    platformName: isIos ? 'iOS' : 'Android',
    'appium:automationName': AUTOMATION_NAME[platform],
    'appium:app': resolveAppPath(platform),
    'appium:newCommandTimeout': 240,
    ...(isIos
      ? {
          // iOS needs a target simulator; CI sets RN_IOS_DEVICE (e.g. 'iPhone 16').
          'appium:deviceName': process.env.RN_IOS_DEVICE ?? 'iPhone 16',
          // Pin the exact simulator the workflow already booted. Without a udid, appium resolves
          // deviceName independently and — when the runner image carries duplicate device names —
          // can boot a *different* instance than CI pre-booted. CI exports RN_IOS_UDID; omitted
          // locally (appium resolves by name).
          ...(process.env.RN_IOS_UDID ? { 'appium:udid': process.env.RN_IOS_UDID } : {}),
          // wdaLaunchTimeout is a ceiling, not a delay. With a prebuilt WDA (RN_WDA_DD) the first
          // session just launches it (fast); without one, appium compiles WDA on first session
          // (minutes), so the wait must stay generous.
          'appium:wdaLaunchTimeout': process.env.RN_WDA_DD ? 120000 : 720000,
          // CI boots the sim headless (simctl). Without isHeadless, XCUITest restarts it on
          // session-create with the Simulator window visible — a slow GUI re-boot on a display-less
          // runner. Headless reuses the already-booted sim. CI-only.
          ...(process.env.CI ? { 'appium:isHeadless': true } : {}),
          'appium:simulatorStartupTimeout': 240000,
          // WDA on hosted sims often fails the first attempt (ECONNREFUSED 8100); appium defaults to
          // 2 startup retries — bump it.
          'appium:wdaStartupRetries': 5,
          'appium:wdaStartupRetryInterval': 20000,
          // CI pre-builds WDA into RN_WDA_DD; install + launch it via usePreinstalledWDA (no
          // per-session xcodebuild). Omitted locally so appium builds WDA itself.
          ...(process.env.RN_WDA_DD
            ? {
                'appium:usePreinstalledWDA': true,
                'appium:prebuiltWDAPath': `${process.env.RN_WDA_DD}/Build/Products/Debug-iphonesimulator/WebDriverAgentRunner-Runner.app`,
              }
            : {}),
        }
      : {}),
    'wdio:reactNativeServiceOptions': reactNativeServiceOptions(platform),
  } as WebdriverIO.Capabilities;
}

/**
 * `@wdio/appium-service` boots the Appium server; `@wdio/react-native-service` prepares the
 * capabilities and attaches the Hermes bridge for execute/mock. Appium is composed at the runner —
 * it is a devDependency of this package, never a dependency of the service.
 *
 * `logPath` writes the full appium server output to <logDir>/wdio-appium.log (picked up by ci:logs);
 * `--log-level debug` surfaces the XCUITest driver's sim-boot/WDA trace, the only place the iOS
 * session-create flake is diagnosable.
 */
export function appiumService(logDir: string): Services.ServiceEntry {
  return ['appium', { logPath: logDir, args: { logLevel: 'debug' } }];
}

export function reactNativeService(): Services.ServiceEntry {
  // Bare string: the service reads its options from the capability's wdio:reactNativeServiceOptions.
  return 'react-native';
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
  connectionRetryTimeout: isIos ? (process.env.RN_WDA_DD ? 420000 : 900000) : 180000,
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
  // App-ready gate: wait for the fixture to be interactive before any spec runs. On Android
  // New-Arch the view tree registers later, and Metro's first bundle adds latency, so the earliest
  // specs would otherwise race an empty tree.
  before: async () => {
    const { browser } = await import('@wdio/globals');
    await browser.$('~counter').waitForDisplayed({ timeout: 90000 });
  },
};
