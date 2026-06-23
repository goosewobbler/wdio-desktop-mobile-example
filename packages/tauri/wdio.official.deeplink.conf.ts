import { baseConfig, buildTauriCapability, logsDir, skipOnMacOS, tauriService } from './wdio.base.conf.ts';

skipOnMacOS('Tauri official driver is not supported on macOS');

process.env.ENABLE_SINGLE_INSTANCE = 'true';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/deeplink.spec.ts'],
  capabilities: [buildTauriCapability('official')],
  services: [tauriService('official')],
  outputDir: logsDir('official', 'deeplink'),
};
