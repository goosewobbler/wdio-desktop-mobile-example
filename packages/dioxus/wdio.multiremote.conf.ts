import { baseConfig, buildMultiremoteCapabilities, dioxusService, logsDir } from './wdio.base.conf.ts';

export const config: WebdriverIO.MultiremoteConfig = {
  ...baseConfig,
  specs: ['./test/multiremote/**/*.spec.ts'],
  capabilities: buildMultiremoteCapabilities(),
  services: [dioxusService()],
  outputDir: logsDir('multiremote'),
};
