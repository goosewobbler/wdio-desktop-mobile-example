import type { Options } from '@wdio/types';
import { baseConfig, buildTauriCapability, logsDir, tauriService } from './wdio.base.conf.ts';

process.env.ENABLE_SPLASH_WINDOW = 'true';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/window.spec.ts'],
  capabilities: [buildTauriCapability()],
  services: [tauriService('crabnebula')],
  outputDir: logsDir('crabnebula', 'window'),
};
