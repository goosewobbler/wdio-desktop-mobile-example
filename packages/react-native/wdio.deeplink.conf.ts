import {
  appiumService,
  baseConfig,
  buildReactNativeCapability,
  logsDir,
  pageSourceAfterTest,
  reactNativeService,
} from './wdio.base.conf.ts';

const outputDir = logsDir('deeplink');

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/deeplink.spec.ts'],
  capabilities: [buildReactNativeCapability()],
  services: [appiumService(outputDir), reactNativeService()],
  outputDir,
  afterTest: pageSourceAfterTest(outputDir),
};
