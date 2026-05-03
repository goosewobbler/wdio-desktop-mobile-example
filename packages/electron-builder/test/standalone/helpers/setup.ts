// Standalone test session helper for Electron — adapted from upstream
// `~/Workspace/wdio-desktop-mobile/e2e/test/electron/standalone/helpers/setup.ts`.
//
// Wires startWdioSession against this package's own packaged binary (or
// dist/main/index.js entry-point for the script-mode app).
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import url from 'node:url';
import {
  cleanupWdioSession,
  createElectronCapabilities,
  getElectronBinaryPath,
  startWdioSession,
} from '@wdio/electron-service';
import type { ElectronStandaloneCapability } from '@wdio/native-types';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export interface StandaloneTestOptions {
  logConfig?: {
    captureMainProcessLogs?: boolean;
    captureRendererLogs?: boolean;
    mainProcessLogLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
    rendererLogLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
    logDir?: string;
  };
}

export interface StandaloneTestSession {
  browser: WebdriverIO.Browser;
  appDir: string;
  cleanup: () => Promise<void>;
}

export async function setupStandaloneTest(options: StandaloneTestOptions = {}): Promise<StandaloneTestSession> {
  process.env.TEST = 'true';

  // appDir = the package root (3 ups from test/standalone/helpers/setup.ts).
  const appDir = path.resolve(__dirname, '..', '..', '..');

  if (!existsSync(appDir)) {
    throw new Error(`Electron app directory not found: ${appDir}`);
  }

  const appDirName = path.basename(appDir);
  const isScript = appDirName.includes('script');
  const entryPoint = path.join(appDir, 'dist', 'main', 'index.js');

  let sessionOptions: ElectronStandaloneCapability;

  if (isScript && existsSync(entryPoint)) {
    sessionOptions = createElectronCapabilities({
      appEntryPoint: entryPoint,
      appArgs: ['foo', 'bar=baz'],
      ...options.logConfig,
    });
  } else {
    const appBinaryPath = await getElectronBinaryPath(appDir);
    sessionOptions = createElectronCapabilities({
      appBinaryPath,
      appArgs: ['foo', 'bar=baz'],
      ...options.logConfig,
    });
  }

  const browser = await startWdioSession([sessionOptions]);

  // Settle for service capabilities to attach.
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    browser,
    appDir,
    cleanup: async () => {
      await browser.deleteSession();
      await cleanupWdioSession(browser);
    },
  };
}
