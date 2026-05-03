import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Capabilities, Options, Services } from '@wdio/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
(globalThis as { packageJson?: unknown }).packageJson = packageJson;

const tauriTargetDir = join(__dirname, 'src-tauri', 'target', 'debug');
const productName = 'wdio-desktop-mobile-example-tauri';

let resolvedAppBinaryPath: string;
if (process.platform === 'win32') {
  resolvedAppBinaryPath = join(tauriTargetDir, `${productName}.exe`);
} else if (process.platform === 'linux') {
  resolvedAppBinaryPath = join(tauriTargetDir, productName.toLowerCase());
} else {
  resolvedAppBinaryPath = join(tauriTargetDir, productName);
}

if (!existsSync(resolvedAppBinaryPath)) {
  throw new Error(`Tauri binary not found: ${resolvedAppBinaryPath}. Run 'pnpm build' first.`);
}

console.log(`Using Tauri binary: ${resolvedAppBinaryPath}`);

export const appBinaryPath = resolvedAppBinaryPath;
export const tauriRoot = __dirname;

export type DriverProvider = 'embedded' | 'official' | 'crabnebula';

export interface CapabilityOptions {
  appArgs?: string[];
}

export function buildTauriCapability(opts: CapabilityOptions = {}): WebdriverIO.Capabilities {
  const appArgs = opts.appArgs ?? ['foo', 'bar=baz'];
  return {
    browserName: 'tauri',
    'wdio:enforceWebDriverClassic': true,
    'tauri:options': {
      application: appBinaryPath,
      args: appArgs,
    },
    'wdio:tauriServiceOptions': {
      appBinaryPath,
      appArgs,
      captureBackendLogs: true,
      captureFrontendLogs: true,
      backendLogLevel: 'info',
      frontendLogLevel: 'info',
    },
  } as WebdriverIO.Capabilities;
}

export function buildMultiremoteCapabilities(
  opts: CapabilityOptions = {},
): Capabilities.RequestedMultiremoteCapabilities {
  const cap = buildTauriCapability(opts);
  return {
    browserA: { capabilities: cap },
    browserB: { capabilities: cap },
  };
}

export function tauriService(provider: DriverProvider): Services.ServiceEntry {
  // Specs in test/lib/utils.ts read DRIVER_PROVIDER to compute the log dir.
  // Set it eagerly when the config is evaluated so the env is in place
  // before any worker forks.
  process.env.DRIVER_PROVIDER = provider;
  return [
    '@wdio/tauri-service',
    {
      driverProvider: provider,
      // Only the official provider needs us to ask the service to install
      // tauri-driver via cargo on demand. The embedded provider has no
      // separate driver, and the CrabNebula driver ships as an npm package.
      autoInstallTauriDriver: provider === 'official',
    },
  ];
}

export function logsDir(provider: DriverProvider, scenario?: string): string {
  return scenario ? join(__dirname, 'logs', provider, scenario) : join(__dirname, 'logs', provider);
}

/** Skip a config on macOS (used by the official driver, which has no macOS support). */
export function skipOnMacOS(reason: string): void {
  if (process.platform === 'darwin') {
    console.log(`⚠️  Skipping: ${reason}`);
    console.log('💡 Use driverProvider: "embedded" or "crabnebula" for macOS support');
    process.exit(78); // 78 = "configuration error"; CI treats as a soft skip
  }
}

/**
 * Shared bits of the WDIO testrunner config. Each provider × test-type
 * config spreads `baseConfig` and overrides `specs`, `exclude`, `capabilities`,
 * `services`, and `outputDir`.
 *
 * `autoXvfb` is intentionally `false`: tauri-driver and the app launch in
 * the WDIO launcher process (onPrepare), not a worker, so autoXvfb would
 * set up the display too late on Linux. CI wraps the entire pnpm command
 * with `xvfb-run` instead.
 */
export const baseConfig: Partial<Options.Testrunner> = {
  runner: 'local',
  maxInstances: 1,
  logLevel: 'info',
  bail: 0,
  baseUrl: '',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  autoXvfb: false,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
    retries: 2,
  },
};
