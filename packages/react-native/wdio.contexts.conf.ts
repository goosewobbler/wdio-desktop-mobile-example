import {
  appiumService,
  baseConfig,
  buildReactNativeCapability,
  logsDir,
  pageSourceAfterTest,
  reactNativeService,
} from './wdio.base.conf.ts';

const outputDir = logsDir('contexts');

export const config: WebdriverIO.Config = {
  ...baseConfig,
  // Mobile "windows" are Appium contexts (NATIVE_APP / WEBVIEW_*) — the window→contexts rename.
  specs: ['./test/contexts.spec.ts'],
  capabilities: [buildReactNativeCapability()],
  services: [appiumService(outputDir), reactNativeService()],
  outputDir,
  afterTest: pageSourceAfterTest(outputDir),
};
