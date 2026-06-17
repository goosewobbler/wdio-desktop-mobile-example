import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Capabilities, Options, Services } from '@wdio/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
(globalThis as { packageJson?: unknown }).packageJson = packageJson;

// Single-crate workspace layout: target/ lives at the workspace root,
// which is this package directory. See ./Cargo.toml for the workspace
// declaration.
const dioxusTargetDir = join(__dirname, 'target', 'debug');
const productName = 'wdio-dioxus-e2e-app';

let resolvedAppBinaryPath: string;
if (process.platform === 'win32') {
  resolvedAppBinaryPath = join(dioxusTargetDir, `${productName}.exe`);
} else {
  // Binary name is already lowercase — no case conversion needed on Linux
  resolvedAppBinaryPath = join(dioxusTargetDir, productName);
}

if (!existsSync(resolvedAppBinaryPath)) {
  throw new Error(`Dioxus binary not found: ${resolvedAppBinaryPath}. Run 'pnpm build' first.`);
}

console.log(`Using Dioxus binary: ${resolvedAppBinaryPath}`);

export const appBinaryPath = resolvedAppBinaryPath;
export const dioxusRoot = __dirname;

export interface CapabilityOptions {
  appArgs?: string[];
}

export function buildDioxusCapability(opts: CapabilityOptions = {}): WebdriverIO.Capabilities {
  const appArgs = opts.appArgs ?? ['foo', 'bar=baz'];
  return {
    browserName: 'dioxus',
    'wdio:enforceWebDriverClassic': true,
    'dioxus:options': {
      application: appBinaryPath,
      args: appArgs,
    },
    // @wdio/dioxus-service reads `driverProvider` from the capability-level
    // options when deciding how to spin up the driver. Setting it here
    // alongside the service-level options makes the provider explicit in
    // every config that passes through buildDioxusCapability().
    'wdio:dioxusServiceOptions': {
      driverProvider: 'embedded',
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
  const cap = buildDioxusCapability(opts);
  return {
    browserA: { capabilities: cap },
    browserB: { capabilities: cap },
  };
}

export function visualService(): Services.ServiceEntry {
  const root = join(__dirname, '__visual__', process.platform, process.arch);
  return [
    'visual',
    {
      baselineFolder: join(root, 'baseline'),
      screenshotPath: join(root, 'actual'),
      formatImageName: '{tag}-{width}x{height}',
      // CI runners are ephemeral, so auto-saving the baseline on first run keeps
      // the matrix self-contained (each job writes once, then validates the
      // match path on the second invocation in `test:visual`).
      autoSaveBaseline: true,
    },
  ];
}

export function dioxusService(): Services.ServiceEntry {
  return [
    '@wdio/dioxus-service',
    {
      driverProvider: 'embedded',
    },
  ];
}

export function logsDir(scenario?: string): string {
  return scenario ? join(__dirname, 'logs', scenario) : join(__dirname, 'logs');
}

/**
 * Shared bits of the WDIO testrunner config. Each test-type config spreads
 * `baseConfig` and overrides `specs`, `exclude`, `capabilities`, `services`,
 * and `outputDir`.
 *
 * `autoXvfb` is intentionally `false`: the Dioxus embedded driver and the app
 * launch in the WDIO launcher process (onPrepare), not a worker, so autoXvfb
 * would set up the display too late on Linux. CI wraps the entire pnpm command
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
