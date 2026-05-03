import type { Options } from '@wdio/types';
import { baseConfig, buildTauriCapability, logsDir, tauriService } from './wdio.base.conf.ts';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/multiremote/**',
    './test/standalone/**',
    // CrabNebula's test-runner-backend doesn't forward app stderr, so any
    // log-capture spec that asserts on backend/frontend log content fails.
    './test/logging.spec.ts',
    './test/logging.tauri-driver.spec.ts',
    './test/logging.embedded.spec.ts',
  ],
  capabilities: [buildTauriCapability()],
  services: [tauriService('crabnebula')],
  outputDir: logsDir('crabnebula'),
};
