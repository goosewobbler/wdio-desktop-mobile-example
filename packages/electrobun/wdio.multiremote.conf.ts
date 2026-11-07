import { baseConfig, buildMultiremoteCapabilities, electrobunService, logsDir } from './wdio.base.conf.ts';

export const config: WebdriverIO.MultiRemoteConfig = {
  ...baseConfig,
  specs: ['./test/multiremote/*.spec.ts'],
  exclude: [
    // No deep links: upstream #320 / blackboardsh/electrobun#465.
    './test/multiremote/deeplink.spec.ts',
  ],
  maxInstances: 1,
  capabilities: buildMultiremoteCapabilities(),
  services: [electrobunService],
  outputDir: logsDir('multiremote-electrobun'),
};
