import { baseConfig, buildTauriCapability, logsDir, tauriService } from './wdio.base.conf.ts';

process.env.ENABLE_SPLASH_WINDOW = 'true';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/window.spec.ts'],
  capabilities: [buildTauriCapability('crabnebula')],
  services: [tauriService('crabnebula')],
  outputDir: logsDir('crabnebula', 'window'),
};
