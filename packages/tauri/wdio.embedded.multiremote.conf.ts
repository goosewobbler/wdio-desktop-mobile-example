import { baseConfig, buildMultiremoteCapabilities, logsDir, tauriService } from './wdio.base.conf.ts';

process.env.WDIO_EMBEDDED_SERVER = 'true';

export const config: WebdriverIO.MultiremoteConfig = {
  ...baseConfig,
  specs: ['./test/multiremote/**/*.spec.ts'],
  capabilities: buildMultiremoteCapabilities('embedded'),
  services: [tauriService('embedded')],
  outputDir: logsDir('embedded', 'multiremote'),
};
