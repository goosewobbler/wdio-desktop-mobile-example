import type { Options } from '@wdio/types';
import {
  appiumService,
  baseConfig,
  buildFlutterCapability,
  flutterService,
  logsDir,
  pageSourceAfterTest,
} from './wdio.base.conf.ts';

const outputDir = logsDir('contexts');

export const config: Options.Testrunner = {
  ...baseConfig,
  // Mobile "windows" are Appium contexts (NATIVE_APP / FLUTTER / WEBVIEW_*) — the window→contexts
  // rename.
  specs: ['./test/contexts.spec.ts'],
  capabilities: [buildFlutterCapability()],
  services: [appiumService(outputDir), flutterService()],
  outputDir,
  afterTest: pageSourceAfterTest(outputDir),
};
