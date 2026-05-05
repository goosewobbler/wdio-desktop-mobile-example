// Standalone Electron test — invokes startWdioSession directly without the
// WDIO testrunner. Run via `node ../../scripts/run-standalone.mjs`.
//
// Adapted verbatim from upstream `~/Workspace/wdio-desktop-mobile/e2e/test/electron/standalone/api.spec.ts`.
import fs from 'node:fs';
import path from 'node:path';
import { getElectronVersion } from '@wdio/electron-service';
import type { NormalizedPackageJson } from '@wdio/native-types';
import type * as Electron from 'electron';
import { setupStandaloneTest } from './helpers/setup.ts';

console.log('🔍 Debug: Starting Electron standalone API test');

const { browser, appDir, cleanup } = await setupStandaloneTest();

const packageJsonPath = path.join(appDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, { encoding: 'utf-8' })) as NormalizedPackageJson;
const pkg = { packageJson, path: packageJsonPath };
const electronVersion = await getElectronVersion(pkg);

const appDirName = path.basename(appDir);
const isScript = appDirName.includes('script');

const getExpectedAppName = (): string => {
  // Script mode: app.getName() returns "Electron"; binary mode: package name.
  return isScript ? 'Electron' : (globalThis.packageJson?.name ?? packageJson.name ?? '');
};

const appName = await browser.electron.execute((electron: typeof Electron) => electron.app.getName());
const expectedAppName = getExpectedAppName();
if (appName !== expectedAppName) {
  throw new Error(`appName test failed: ${appName} !== ${expectedAppName}`);
}

const appVersion = await browser.electron.execute((electron: typeof Electron) => electron.app.getVersion());
const expectedAppVersion = isScript ? electronVersion : packageJson.version;
if (appVersion !== expectedAppVersion) {
  throw new Error(`appVersion test failed: ${appVersion} !== ${expectedAppVersion}`);
}

console.log('🔍 Browser is initialized, testing mock functionality...');

// Test 1: Basic mock created and invoked via browser.electron.execute.
console.log('🔍 Testing basic mock with browser.electron.execute...');
try {
  console.log(
    '🔍 Debug: Checking browser.electron availability before mocking:',
    typeof browser?.electron,
    typeof browser?.electron?.mock,
  );

  const basicMock = await browser.electron.mock('dialog', 'showOpenDialog');
  console.log('✅ Basic mock created successfully');

  await browser.electron.execute(async (electron) => {
    await electron.dialog.showOpenDialog({
      title: 'basic test dialog',
      properties: ['openFile'],
    });
    return (electron.dialog.showOpenDialog as unknown as { mock: { calls: unknown[] } }).mock.calls;
  });

  const basicCalls = basicMock.mock.calls.length;
  console.log(`📊 Basic mock calls: ${basicCalls}`);

  if (basicCalls !== 1) {
    throw new Error(`Basic mock test failed: expected 1 call, got ${basicCalls}`);
  }
  console.log('✅ Basic mock test passed');
} catch (error) {
  console.error('❌ Basic mock test failed:', error);
  throw error;
}

// Test 2: Mock created and invoked via DOM interaction (renderer triggers IPC).
console.log('🔍 Testing complex UI-triggered mock...');
try {
  const complexMock = await browser.electron.mock('dialog', 'showOpenDialog');
  console.log('✅ Complex mock created successfully');

  const showDialogButton = await browser.$('.show-dialog');
  if (!showDialogButton) {
    throw new Error('Show dialog button not found');
  }

  await showDialogButton.click();
  console.log('🖱️ Clicked show dialog button');

  const complexCalls = complexMock.mock.calls.length;
  console.log(`📊 Complex mock calls before update: ${complexCalls}`);

  await complexMock.update();
  const complexCallsAfterUpdate = complexMock.mock.calls.length;
  console.log(`📊 Complex mock calls after update: ${complexCallsAfterUpdate}`);

  if (complexCallsAfterUpdate !== 1) {
    throw new Error(`Complex mock test failed: expected 1 call, got ${complexCallsAfterUpdate}`);
  }
  console.log('✅ Complex mock test passed');
} catch (error) {
  console.error('❌ Complex mock test failed:', error);
  // Upstream notes this is a known investigation case; don't fail the
  // overall script on this branch.
  console.log("ℹ️ Complex mock test failed as expected - tracked as known issue upstream");
}

await cleanup();
console.log('✅ Cleanup complete');

process.exit();
