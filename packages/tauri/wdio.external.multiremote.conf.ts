import { baseConfig, buildMultiremoteCapabilities, logsDir, skipOnMacOS, tauriService } from './wdio.base.conf.ts';

skipOnMacOS('Tauri external driver is not supported on macOS');

export const config: WebdriverIO.MultiRemoteConfig = {
  ...baseConfig,
  specs: ['./test/multiremote/**/*.spec.ts'],
  capabilities: buildMultiremoteCapabilities('external'),
  services: [tauriService('external')],
  outputDir: logsDir('multiremote-tauri'),
};
