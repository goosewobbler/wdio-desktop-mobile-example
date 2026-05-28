// Standalone Tauri logging test — runs as a top-level Node script via
// `node ../../scripts/run-standalone.mjs <provider>`.
//
// Adapted from upstream `~/Workspace/wdio-desktop-mobile/e2e/test/tauri/standalone/logging.spec.ts`.
import { existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import url from 'node:url';
import { cleanupWdioSession, createTauriCapabilities, startWdioSession } from '@wdio/tauri-service';
import { xvfb } from '@wdio/xvfb';
import { resolveTauriBinaryPath } from '../lib/binary.ts';
import { assertLogContains, readWdioLogs, waitForLog } from '../lib/utils.ts';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

process.env.TEST = 'true';

const appDir = path.join(__dirname, '..', '..');
if (!existsSync(appDir)) {
  throw new Error(`Tauri app directory not found: ${appDir}`);
}

// See test/standalone/api.spec.ts for why we resolve locally instead of
// using @wdio/tauri-service's getTauriBinaryPath.
const appBinaryPath = resolveTauriBinaryPath(appDir);
if (!existsSync(appBinaryPath)) {
  throw new Error(`Tauri binary not found: ${appBinaryPath}. Run 'pnpm build' first.`);
}
const driverProvider = process.env.DRIVER_PROVIDER as 'official' | 'crabnebula' | 'embedded';

const sessionOptions = createTauriCapabilities(appBinaryPath, {
  appArgs: ['foo', 'bar=baz'],
  driverProvider,
  autoInstallTauriDriver: driverProvider === 'official',
});

// Logs land in <package>/logs/<provider>/standalone/.
const logDir = path.join(appDir, 'logs', driverProvider, 'standalone');
const tauriOpts = sessionOptions['wdio:tauriServiceOptions'];
if (tauriOpts) {
  tauriOpts.captureBackendLogs = true;
  tauriOpts.captureFrontendLogs = true;
  tauriOpts.backendLogLevel = 'info';
  tauriOpts.frontendLogLevel = 'info';
  tauriOpts.logDir = logDir;
  console.log(`[DEBUG] Setting logDir to: ${logDir}`);
}

if (process.platform === 'linux') {
  await xvfb.init();
}

console.log('🔍 Debug: Starting Tauri standalone logging test');
const browser = await startWdioSession(sessionOptions);

await browser.tauri.execute(({ core }) => core.invoke('get_platform_info'));
await browser.waitUntil(
  async () => {
    const logs = await readWdioLogs(logDir);
    return logs.length > 0;
  },
  { timeout: 10000, timeoutMsg: 'Log infrastructure not ready' },
);

const isCrabNebula = driverProvider === 'crabnebula';

try {
  console.log(`[DEBUG] Reading logs from: ${logDir}`);

  // Test 1: Backend logs — CrabNebula's test-runner-backend doesn't forward
  // app stderr, so backend log capture is unsupported there.
  console.log('Test 1: Backend logs...');
  if (!isCrabNebula) {
    await browser.tauri.execute(({ core }) => core.invoke('generate_test_logs'));
    if (!(await waitForLog(logDir, /\[Tauri:Backend[^\]]*\].*INFO level log/i, 10000))) {
      throw new Error('Backend logs not captured within timeout');
    }
    if (existsSync(logDir)) {
      const files = readdirSync(logDir, { withFileTypes: true });
      console.log(
        `[DEBUG] Files in logDir: ${files
          .map((f) => `${f.name} (${f.isDirectory() ? 'dir' : 'file'})`)
          .join(', ')}`,
      );
    }
    const logs = await readWdioLogs(logDir);
    if (!logs) {
      throw new Error('No logs found in output directory');
    }
    assertLogContains(logs, /\[Tauri:Backend[^\]]*\].*INFO level log/i);
    assertLogContains(logs, /\[Tauri:Backend[^\]]*\].*WARN level log/i);
    assertLogContains(logs, /\[Tauri:Backend[^\]]*\].*ERROR level log/i);
    console.log('✅ Backend logs test passed');
  } else {
    console.log('⚠️  Skipping backend log test for CrabNebula (test-runner-backend limitation)');
  }

  // Test 2: Frontend logs — also unsupported for CrabNebula in standalone mode.
  console.log('Test 2: Frontend logs...');
  if (!isCrabNebula) {
    await browser.execute(() => {
      console.info('[Test] Standalone frontend INFO log');
      console.warn('[Test] Standalone frontend WARN log');
      console.error('[Test] Standalone frontend ERROR log');
    });
    if (!(await waitForLog(logDir, /\[Tauri:Frontend[^\]]*\].*Standalone frontend INFO/i, 10000))) {
      throw new Error('Frontend logs not captured within timeout');
    }
    const logs = await readWdioLogs(logDir);
    assertLogContains(logs, /\[Tauri:Frontend[^\]]*\].*Standalone frontend INFO/i);
    assertLogContains(logs, /\[Tauri:Frontend[^\]]*\].*Standalone frontend WARN/i);
    assertLogContains(logs, /\[Tauri:Frontend[^\]]*\].*Standalone frontend ERROR/i);
    console.log('✅ Frontend logs test passed');
  } else {
    console.log('⚠️  Skipping frontend log test for CrabNebula (app stderr not forwarded)');
  }

  console.log('✅ All Tauri standalone logging tests passed');
} catch (error) {
  console.error('❌ Test failed:', error);
  await browser.deleteSession();
  await cleanupWdioSession(browser);
  process.exit(1);
}

await browser.deleteSession();
await cleanupWdioSession(browser);
console.log('✅ Cleanup complete');

process.exit();
