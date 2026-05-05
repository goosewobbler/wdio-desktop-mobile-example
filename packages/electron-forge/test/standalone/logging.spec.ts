// Standalone Electron logging test — runs as a top-level Node script via
// `node ../../scripts/run-standalone.mjs`.
//
// Adapted from upstream `~/Workspace/wdio-desktop-mobile/e2e/test/electron/standalone/logging.spec.ts`.
import path from 'node:path';
import url from 'node:url';
import { assertLogContains, assertLogDoesNotContain, readWdioLogs, waitForLog } from '../lib/utils.ts';
import { setupStandaloneTest } from './helpers/setup.ts';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Logs land in <package>/logs/standalone/.
const logDir = path.resolve(__dirname, '..', '..', 'logs', 'standalone');

console.log('🔍 Debug: Starting Electron standalone logging test');

const { browser, cleanup } = await setupStandaloneTest({
  logConfig: {
    captureMainProcessLogs: true,
    captureRendererLogs: true,
    mainProcessLogLevel: 'info',
    rendererLogLevel: 'info',
    logDir,
  },
});

try {
  console.log('Test 1: Main process logs...');
  await browser.electron.execute(() => {
    console.info('[Test] Standalone main process INFO log');
    console.warn('[Test] Standalone main process WARN log');
    console.error('[Test] Standalone main process ERROR log');
  });

  if (!(await waitForLog(logDir, /\[Electron:MainProcess\].*\[Test\].*INFO log/i, 10000))) {
    throw new Error('Main process logs not captured within timeout');
  }

  const logs1 = await readWdioLogs(logDir);
  if (!logs1) {
    throw new Error('No logs found in output directory');
  }
  assertLogContains(logs1, /\[Electron:MainProcess\].*\[Test\].*INFO log/i);
  assertLogContains(logs1, /\[Electron:MainProcess\].*\[Test\].*WARN log/i);
  assertLogContains(logs1, /\[Electron:MainProcess\].*\[Test\].*ERROR log/i);
  console.log('✅ Main process logs test passed');

  console.log('Test 2: Renderer logs...');
  await browser.execute(() => {
    console.info('[Test] Standalone renderer INFO log');
    console.warn('[Test] Standalone renderer WARN log');
    console.error('[Test] Standalone renderer ERROR log');
  });

  if (!(await waitForLog(logDir, /\[Electron:Renderer\].*\[Test\].*Standalone renderer INFO/i, 10000))) {
    throw new Error('Renderer logs not captured within timeout');
  }

  const logs2 = await readWdioLogs(logDir);
  assertLogContains(logs2, /\[Electron:Renderer\].*\[Test\].*Standalone renderer INFO/i);
  assertLogContains(logs2, /\[Electron:Renderer\].*\[Test\].*Standalone renderer WARN/i);
  assertLogContains(logs2, /\[Electron:Renderer\].*\[Test\].*Standalone renderer ERROR/i);
  console.log('✅ Renderer logs test passed');

  console.log('Test 3: Log level filtering...');
  await browser.electron.execute(() => {
    console.debug('[Test] This main DEBUG log should be filtered out');
    console.info('[Test] This main INFO log should appear');
  });
  await browser.execute(() => {
    console.debug('[Test] This renderer DEBUG log should be filtered out');
    console.info('[Test] This renderer INFO log should appear');
  });

  if (!(await waitForLog(logDir, /\[Electron:MainProcess\].*INFO.*should appear/i, 10000))) {
    throw new Error('Logs not captured within timeout');
  }

  const logs3 = await readWdioLogs(logDir);
  assertLogDoesNotContain(logs3, /\[Electron:MainProcess\].*DEBUG.*should be filtered/i);
  assertLogDoesNotContain(logs3, /\[Electron:Renderer\].*DEBUG.*should be filtered/i);
  assertLogContains(logs3, /\[Electron:MainProcess\].*INFO.*should appear/i);
  assertLogContains(logs3, /\[Electron:Renderer\].*INFO.*should appear/i);
  console.log('✅ Log filtering test passed');

  console.log('✅ All Electron standalone logging tests passed');
} catch (error) {
  console.error('❌ Test failed:', error);
  await cleanup();
  process.exit(1);
}

await cleanup();
console.log('✅ Cleanup complete');

process.exit();
