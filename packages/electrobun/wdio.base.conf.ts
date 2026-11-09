import { existsSync, globSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ElectrobunCapabilities, ElectrobunServiceOptions } from '@wdio/native-types';
import type { Options, Services } from '@wdio/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const electrobunRoot = __dirname;

function resolveElectrobunAppPath(dir: string): string {
  const override = process.env.ELECTROBUN_APP_PATH;
  if (override) {
    return override;
  }

  const buildDir = join(dir, 'build');
  if (!existsSync(buildDir)) {
    throw new Error(
      `Electrobun build directory not found: ${buildDir}. Run \`electrobun build\` first (or set ELECTROBUN_APP_PATH).`,
    );
  }

  const newest = (paths: string[]): string => {
    const mtimeOf = (candidate: string): number => {
      try {
        return statSync(candidate).mtimeMs;
      } catch {
        return 0;
      }
    };
    return paths.map((candidate) => ({ candidate, mtime: mtimeOf(candidate) })).sort((a, b) => b.mtime - a.mtime)[0]
      .candidate;
  };

  if (process.platform === 'darwin') {
    const bundles = globSync(join(buildDir, '**', '*.app')).filter((candidate) => !/\.app[\\/]/.test(candidate));
    if (bundles.length > 0) {
      return newest(bundles);
    }
    throw new Error(`No Electrobun .app bundle found under ${buildDir}. Set ELECTROBUN_APP_PATH.`);
  }

  const launcherName = process.platform === 'win32' ? 'launcher.exe' : 'launcher';
  const launchers = globSync(join(buildDir, '**', 'bin', launcherName));
  if (launchers.length > 0) {
    return newest(launchers);
  }
  throw new Error(`No Electrobun launcher (bin/${launcherName}) found under ${buildDir}. Set ELECTROBUN_APP_PATH.`);
}

const appBinaryPath = resolveElectrobunAppPath(__dirname);

type ElectrobunCapability = ElectrobunCapabilities & {
  'wdio:electrobunServiceOptions': ElectrobunServiceOptions;
};

export function buildElectrobunCapability(): ElectrobunCapability {
  const options: ElectrobunServiceOptions = {
    appBinaryPath,
    appArgs: ['foo', 'bar=baz'],
    captureBackendLogs: true,
    backendLogLevel: 'info',
  };
  return {
    browserName: 'electrobun',
    ...(process.platform === 'darwin' ? { browserVersion: '156' } : { 'wdio:enforceWebDriverClassic': true }),
    'wdio:electrobunServiceOptions': options,
  };
}

export function buildMultiremoteCapabilities(): {
  instanceA: { capabilities: ElectrobunCapability };
  instanceB: { capabilities: ElectrobunCapability };
} {
  return {
    instanceA: { capabilities: buildElectrobunCapability() },
    instanceB: { capabilities: buildElectrobunCapability() },
  };
}

export const electrobunService: Services.ServiceEntry = ['electrobun', {}];

export function logsDir(name: string): string {
  return join(__dirname, 'logs', name);
}

export const baseConfig: Partial<Options.Testrunner> = {
  runner: 'local',
  logLevel: 'info',
  bail: 0,
  specFileRetries: 3,
  specFileRetriesDeferred: false,
  baseUrl: '',
  waitforTimeout: 10000,
  connectionRetryTimeout: process.platform === 'linux' ? 45_000 : 120_000,
  connectionRetryCount: 3,
  // Headless Weston never brings the WebKitGTK app up.
  displayServer: 'xvfb',
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
    retries: 2,
  },
};
