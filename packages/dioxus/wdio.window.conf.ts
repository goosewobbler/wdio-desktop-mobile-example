import { baseConfig, buildDioxusCapability, dioxusService, logsDir } from './wdio.base.conf.ts';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/window.spec.ts'],
  capabilities: [buildDioxusCapability()],
  services: [dioxusService()],
  outputDir: logsDir('window'),
};
