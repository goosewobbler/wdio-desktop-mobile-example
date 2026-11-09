import { baseConfig, buildElectrobunCapability, electrobunService, logsDir } from './wdio.base.conf.ts';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/*.spec.ts'],
  exclude: [
    './test/window.spec.ts',
    // No deep links: upstream #320 / blackboardsh/electrobun#465.
    './test/deeplink.spec.ts',
    './test/multiremote/**',
  ],
  maxInstances: process.platform === 'darwin' ? 1 : 2,
  capabilities: [buildElectrobunCapability()],
  services: [electrobunService],
  outputDir: logsDir('standard-electrobun'),
};
