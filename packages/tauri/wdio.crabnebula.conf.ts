import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Options } from '@wdio/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load package.json
const packageJsonPath = join(__dirname, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
(globalThis as { packageJson?: unknown }).packageJson = packageJson;

// Determine binary path
const tauriTargetDir = join(__dirname, 'src-tauri', 'target', 'debug');
const productName = 'wdio-desktop-mobile-example-tauri';

let appBinaryPath: string;
if (process.platform === 'win32') {
  appBinaryPath = join(tauriTargetDir, `${productName}.exe`);
} else if (process.platform === 'linux') {
  appBinaryPath = join(tauriTargetDir, productName.toLowerCase());
} else {
  appBinaryPath = join(tauriTargetDir, productName);
}

if (!existsSync(appBinaryPath)) {
  throw new Error(`Tauri binary not found: ${appBinaryPath}. Run 'pnpm build' first.`);
}

console.log(`Using Tauri binary: ${appBinaryPath}`);

export const config: Options.Testrunner = {
  runner: 'local',
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/multiremote/**',
    './test/standalone/**',
    './test/logging.spec.ts', // CrabNebula doesn't forward app stderr
  ],
  maxInstances: 1,
  capabilities: [
    {
      browserName: 'tauri',
      'wdio:enforceWebDriverClassic': true,
      'tauri:options': {
        application: appBinaryPath,
        args: ['foo', 'bar=baz'],
      },
      'wdio:tauriServiceOptions': {
        appBinaryPath: appBinaryPath,
        appArgs: ['foo', 'bar=baz'],
        captureBackendLogs: true,
        captureFrontendLogs: true,
        backendLogLevel: 'info',
        frontendLogLevel: 'info',
      },
    },
  ],
  logLevel: 'info',
  bail: 0,
  baseUrl: '',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  autoXvfb: false,
  services: [
    [
      '@wdio/tauri-service',
      {
        driverProvider: 'crabnebula',
        autoInstallTauriDriver: false,
      },
    ],
  ],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
    retries: 2,
  },
  outputDir: join(__dirname, 'logs', 'crabnebula'),
};
