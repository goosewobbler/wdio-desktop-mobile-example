import { baseConfig, buildMultiremoteCapabilities, logsDir, skipOnMacOS, tauriService } from './wdio.base.conf.ts';

skipOnMacOS('Tauri official driver is not supported on macOS');

export const config: WebdriverIO.MultiremoteConfig = {
  ...baseConfig,
  specs: ['./test/multiremote/**/*.spec.ts'],
  capabilities: buildMultiremoteCapabilities('official'),
  services: [tauriService('official')],
  outputDir: logsDir('official', 'multiremote'),
};
