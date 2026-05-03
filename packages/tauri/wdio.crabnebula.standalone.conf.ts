import type { Options } from '@wdio/types';
import { baseConfig, buildTauriCapability, logsDir, tauriService } from './wdio.base.conf.ts';

/** See note in wdio.embedded.standalone.conf.ts about testrunner-mode standalone. */
export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/standalone/**/*.spec.ts'],
  capabilities: [buildTauriCapability()],
  services: [tauriService('crabnebula')],
  outputDir: logsDir('crabnebula', 'standalone'),
};
