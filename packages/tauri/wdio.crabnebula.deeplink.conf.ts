import type { Options } from '@wdio/types';
import { baseConfig, buildTauriCapability, logsDir, tauriService } from './wdio.base.conf.ts';

process.env.ENABLE_SINGLE_INSTANCE = 'true';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/deeplink.spec.ts'],
  capabilities: [buildTauriCapability('crabnebula')],
  services: [tauriService('crabnebula')],
  outputDir: logsDir('crabnebula', 'deeplink'),
};
