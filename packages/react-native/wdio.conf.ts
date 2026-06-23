import {
  appiumService,
  baseConfig,
  buildReactNativeCapability,
  logsDir,
  pageSourceAfterTest,
  reactNativeService,
} from './wdio.base.conf.ts';

const outputDir = logsDir('standard');

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/deeplink.spec.ts', // covered by wdio.deeplink.conf.ts
    './test/contexts.spec.ts', // covered by wdio.contexts.conf.ts
  ],
  capabilities: [buildReactNativeCapability()],
  services: [appiumService(outputDir), reactNativeService()],
  outputDir,
  afterTest: pageSourceAfterTest(outputDir),
};
