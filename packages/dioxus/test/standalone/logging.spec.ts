// Standalone Dioxus logging test — runs as a top-level Node script via
// `node ../../scripts/run-standalone.mjs`.
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import url from 'node:url';
import { cleanupWdioSession, createDioxusCapabilities, startWdioSession } from '@wdio/dioxus-service';
import { resolveDioxusBinaryPath } from '../lib/binary.ts';
import { assertLogContains, readWdioLogs, waitForLog } from '../lib/utils.ts';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

process.env.TEST = 'true';

const appDir = path.join(__dirname, '..', '..');
if (!existsSync(appDir)) {
  throw new Error(`Dioxus app directory not found: ${appDir}`);
}

const appBinaryPath = resolveDioxusBinaryPath(appDir);
if (!existsSync(appBinaryPath)) {
  throw new Error(`Dioxus binary not found: ${appBinaryPath}. Run 'pnpm build' first.`);
}

const sessionOptions = createDioxusCapabilities(appBinaryPath, {
  appArgs: ['foo', 'bar=baz'],
  driverProvider: 'embedded',
  captureBackendLogs: true,
  captureFrontendLogs: true,
});

// In standalone mode, the launcher defaults to cwd/logs/ for log output.
// The standalone script runs from the package root, so logs land in logs/.
const logDir = path.join(appDir, 'logs');

console.log('🔍 Debug: Starting Dioxus standalone logging test');
const browser = await startWdioSession(sessionOptions);

await browser.dioxus.execute(({ invoke }) => invoke('get_platform_info'));
await browser.waitUntil(
  async () => {
    const logs = await readWdioLogs(logDir);
    return logs.length > 0;
  },
  { timeout: 10000, timeoutMsg: 'Log infrastructure not ready' },
);

try {
  console.log(`[DEBUG] Reading logs from: ${logDir}`);

  // Test 1: Backend logs
  console.log('Test 1: Backend logs...');
  await browser.dioxus.execute(({ invoke }) => invoke('generate_test_logs'));
  if (!(await waitForLog(logDir, /\[Dioxus:Backend[^\]]*\].*test-info-log/i, 10000))) {
    throw new Error('Backend logs not captured within timeout');
  }
  const logs = await readWdioLogs(logDir);
  if (!logs) {
    throw new Error('No logs found in output directory');
  }
  assertLogContains(logs, /\[Dioxus:Backend[^\]]*\].*test-info-log/i);
  assertLogContains(logs, /\[Dioxus:Backend[^\]]*\].*test-warn-log/i);
  assertLogContains(logs, /\[Dioxus:Backend[^\]]*\].*test-error-log/i);
  console.log('✅ Backend logs test passed');

  // Test 2: Frontend logs
  console.log('Test 2: Frontend logs...');
  await browser.execute(() => {
    console.info('[Test] Standalone frontend INFO log');
    console.warn('[Test] Standalone frontend WARN log');
    console.error('[Test] Standalone frontend ERROR log');
  });
  if (!(await waitForLog(logDir, /\[Dioxus:Frontend[^\]]*\].*Standalone frontend INFO/i, 10000))) {
    throw new Error('Frontend logs not captured within timeout');
  }
  const logsAfterFrontend = await readWdioLogs(logDir);
  assertLogContains(logsAfterFrontend, /\[Dioxus:Frontend[^\]]*\].*Standalone frontend INFO/i);
  assertLogContains(logsAfterFrontend, /\[Dioxus:Frontend[^\]]*\].*Standalone frontend WARN/i);
  assertLogContains(logsAfterFrontend, /\[Dioxus:Frontend[^\]]*\].*Standalone frontend ERROR/i);
  console.log('✅ Frontend logs test passed');

  console.log('✅ All Dioxus standalone logging tests passed');
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
