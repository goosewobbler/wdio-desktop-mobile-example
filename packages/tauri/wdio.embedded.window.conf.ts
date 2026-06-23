import { baseConfig, buildTauriCapability, logsDir, tauriService } from './wdio.base.conf.ts';

process.env.WDIO_EMBEDDED_SERVER = 'true';
// Tells main.rs to spawn the splash window before main.
process.env.ENABLE_SPLASH_WINDOW = 'true';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/window.spec.ts'],
  capabilities: [buildTauriCapability('embedded')],
  services: [tauriService('embedded')],
  outputDir: logsDir('embedded', 'window'),
};
