import { baseConfig, buildMultiremoteCapabilities, electronService, logsDir } from './wdio.base.conf.ts';

export const config: WebdriverIO.MultiRemoteConfig = {
  ...baseConfig,
  specs: ['./test/multiremote/**/*.spec.ts'],
  capabilities: buildMultiremoteCapabilities(),
  services: [electronService],
  outputDir: logsDir('multiremote-electron-builder'),
};
