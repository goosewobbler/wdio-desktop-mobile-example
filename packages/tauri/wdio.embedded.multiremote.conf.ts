import type { Options } from '@wdio/types';
import { baseConfig, buildMultiremoteCapabilities, logsDir, tauriService } from './wdio.base.conf.ts';

process.env.WDIO_EMBEDDED_SERVER = 'true';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/multiremote/**/*.spec.ts'],
  capabilities: buildMultiremoteCapabilities(),
  services: [tauriService('embedded')],
  outputDir: logsDir('embedded', 'multiremote'),
};
