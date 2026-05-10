import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAppBuildInfo, getBinaryPath, getElectronVersion } from '@wdio/electron-service';
import type { ElectronServiceCapabilities, NormalizedPackageJson } from '@wdio/native-types';
import type { Capabilities, Options, Services } from '@wdio/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// electron-script defaults to script mode (no packaging step). Pinning the
// env var to 'false' here serves two purposes: (1) `isScript` matches the
// rest of the resolution below, and (2) the upstream test specs key off
// `process.env.BINARY !== 'false'` to decide which app-name expectation to
// assert, so this keeps the assertions aligned with the runtime.
process.env.BINARY = 'false';
const isScript = process.env.BINARY === 'false';

const packageJsonPath = join(__dirname, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as NormalizedPackageJson;
(globalThis as { packageJson?: unknown }).packageJson = packageJson;

let resolvedAppEntryPoint: string | undefined;
let resolvedAppBinaryPath: string | undefined;

if (isScript) {
  resolvedAppEntryPoint = join(__dirname, 'dist', 'main', 'index.js');
  if (!existsSync(resolvedAppEntryPoint)) {
    throw new Error(`Electron entry point not found: ${resolvedAppEntryPoint}. Run 'pnpm build' first.`);
  }
  console.log(`Using Electron entry point: ${resolvedAppEntryPoint}`);
} else {
  const pkg = { packageJson, path: packageJsonPath };
  const electronVersion = await getElectronVersion(pkg);
  const appBuildInfo = await getAppBuildInfo(pkg);
  const result = await getBinaryPath(packageJsonPath, appBuildInfo, electronVersion);
  if (!result.ok) {
    throw new Error(`Failed to resolve Electron binary path: ${JSON.stringify(result, null, 2)}`);
  }
  resolvedAppBinaryPath = result.value.binaryPath;
  console.log(`Using Electron binary: ${resolvedAppBinaryPath}`);
}

export const appEntryPoint = resolvedAppEntryPoint;
export const appBinaryPath = resolvedAppBinaryPath;
export const electronRoot = __dirname;

export interface CapabilityOptions {
  appArgs?: string[];
}

export function buildElectronCapability(opts: CapabilityOptions = {}): WebdriverIO.Capabilities {
  const appArgs = opts.appArgs ?? ['foo', 'bar=baz'];
  return {
    browserName: 'electron',
    'wdio:electronServiceOptions': {
      ...(isScript ? { appEntryPoint } : { appBinaryPath }),
      appArgs,
      apparmorAutoInstall: 'sudo',
      restoreMocks: true,
      captureMainProcessLogs: true,
      captureRendererLogs: true,
      mainProcessLogLevel: 'info',
      rendererLogLevel: 'info',
    },
  } as WebdriverIO.Capabilities;
}

export function buildMultiremoteCapabilities(): Capabilities.RequestedMultiremoteCapabilities {
  return {
    browserA: { capabilities: buildElectronCapability({ appArgs: ['foo', 'bar=baz', 'browser=A'] }) },
    browserB: { capabilities: buildElectronCapability({ appArgs: ['foo', 'bar=baz', 'browser=B'] }) },
  };
}

export const electronService: Services.ServiceEntry = ['electron', {}];

export const visualService: Services.ServiceEntry = [
  'visual',
  {
    baselineFolder: join(__dirname, '__visual__', process.platform, process.arch, 'baseline'),
    screenshotPath: join(__dirname, '__visual__', process.platform, process.arch, 'actual'),
    formatImageName: '{tag}-{width}x{height}',
    // CI runners are ephemeral, so auto-saving the baseline on first run keeps
    // the matrix self-contained (each job writes once, then validates the
    // match path on the second invocation in `test:visual`). For a real
    // downstream project you'd typically want `!process.env.CI` so missing
    // baselines fail loudly in CI and only update via an explicit flow.
    autoSaveBaseline: true,
  },
];

export function logsDir(scenario?: string): string {
  return scenario ? join(__dirname, 'logs', scenario) : join(__dirname, 'logs');
}

export const baseConfig: Partial<Options.Testrunner> = {
  runner: 'local',
  maxInstances: 1,
  logLevel: 'info',
  bail: 0,
  baseUrl: '',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  autoXvfb: true,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
};
