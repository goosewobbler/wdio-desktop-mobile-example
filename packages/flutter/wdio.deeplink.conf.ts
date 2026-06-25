import type { Options } from '@wdio/types';
import {
  appiumService,
  baseConfig,
  buildFlutterCapability,
  flutterService,
  logsDir,
  pageSourceAfterTest,
} from './wdio.base.conf.ts';

const outputDir = logsDir('deeplink');

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/deeplink.spec.ts'],
  capabilities: [buildFlutterCapability()],
  services: [appiumService(outputDir), flutterService()],
  outputDir,
  afterTest: pageSourceAfterTest(outputDir),
};
