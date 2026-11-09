import { baseConfig, buildElectrobunCapability, electrobunService, logsDir } from './wdio.base.conf.ts';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/window.spec.ts'],
  maxInstances: 1,
  capabilities: [buildElectrobunCapability()],
  services: [electrobunService],
  outputDir: logsDir('window-electrobun'),
};
