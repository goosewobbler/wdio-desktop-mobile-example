// Standalone Tauri test: invokes startWdioSession directly without the
// WDIO testrunner. Run via `node ../../scripts/run-standalone.mjs <provider>`
// (each spec is a self-contained Node script).
//
// Adapted from upstream `~/Workspace/wdio-desktop-mobile/e2e/test/tauri/standalone/api.spec.ts`.
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import url from 'node:url';
import { cleanupWdioSession, createTauriCapabilities, getTauriBinaryPath, startWdioSession } from '@wdio/tauri-service';
import { xvfb } from '@wdio/xvfb';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

process.env.TEST = 'true';

console.log('🔍 Debug: Starting standalone test for Tauri');

// `appDir` is the package root: test/standalone/<spec.ts> → 2 levels up.
const appDir = path.join(__dirname, '..', '..');

if (!existsSync(appDir)) {
  throw new Error(`Tauri app directory not found: ${appDir}`);
}

const appBinaryPath = await getTauriBinaryPath(appDir);
console.log(`🔍 Using Tauri binary: ${appBinaryPath}`);

const driverProvider = process.env.DRIVER_PROVIDER as 'official' | 'crabnebula' | 'embedded';
const sessionOptions = createTauriCapabilities(appBinaryPath, {
  appArgs: ['foo', 'bar=baz'],
  driverProvider,
  autoInstallTauriDriver: driverProvider === 'official',
});

if (process.platform === 'linux') {
  console.log('🔍 Linux detected: initializing xvfb for standalone tests...');
  await xvfb.init();
}

console.log('🔍 Debug: Starting session with options:', JSON.stringify(sessionOptions, null, 2));
const browser = await startWdioSession(sessionOptions);

// Small settle to make sure the service capabilities are wired up.
await new Promise((resolve) => setTimeout(resolve, 1000));

const platformInfo = await browser.tauri.execute(({ core }) => core.invoke('get_platform_info'));

if (!platformInfo || typeof platformInfo !== 'object') {
  throw new Error(`Platform info test failed: expected object, got ${typeof platformInfo}`);
}
if (!('os' in platformInfo)) {
  throw new Error("Platform info test failed: missing 'os' property");
}
if (!('arch' in platformInfo)) {
  throw new Error("Platform info test failed: missing 'arch' property");
}
console.log('✅ Platform info test passed:', platformInfo);

const simpleResult = await browser.tauri.execute(() => 1 + 2);
if (simpleResult !== 3) {
  throw new Error(`Simple execute test failed: expected 3, got ${simpleResult}`);
}
console.log('✅ Simple execute test passed');

await browser.deleteSession();
await cleanupWdioSession(browser);
console.log('✅ Cleanup complete');

// On Windows, webdriverio's remote() leaves internal handles that prevent Node
// from exiting naturally. process.exit() ensures clean termination on all OSes.
process.exit();
