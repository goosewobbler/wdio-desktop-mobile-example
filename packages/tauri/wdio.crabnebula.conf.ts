import type { Options } from '@wdio/types';
import { baseConfig, buildTauriCapability, logsDir, tauriService } from './wdio.base.conf.ts';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/multiremote/**',
    './test/standalone/**',
    './test/logging.spec.ts', // CrabNebula's test-runner-backend doesn't forward app stderr
  ],
  capabilities: [buildTauriCapability()],
  services: [tauriService('crabnebula')],
  outputDir: logsDir('crabnebula'),
};
