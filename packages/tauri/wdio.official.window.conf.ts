import { baseConfig, buildTauriCapability, logsDir, skipOnMacOS, tauriService } from './wdio.base.conf.ts';

skipOnMacOS('Tauri official driver is not supported on macOS');

process.env.ENABLE_SPLASH_WINDOW = 'true';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/window.spec.ts'],
  capabilities: [buildTauriCapability('official')],
  services: [tauriService('official')],
  outputDir: logsDir('official', 'window'),
};
