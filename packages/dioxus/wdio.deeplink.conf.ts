import { baseConfig, buildDioxusCapability, dioxusService, logsDir } from './wdio.base.conf.ts';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/deeplink.spec.ts'],
  capabilities: [buildDioxusCapability()],
  services: [dioxusService()],
  outputDir: logsDir('embedded-deeplink-dioxus'),
};
