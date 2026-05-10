import type { Options } from '@wdio/types';
import {
  baseConfig,
  buildTauriCapability,
  logsDir,
  tauriService,
  visualService,
} from './wdio.base.conf.ts';

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
    './test/window.spec.ts', // requires splash window — covered by wdio.crabnebula.window.conf.ts
    './test/deeplink.spec.ts', // covered by wdio.crabnebula.deeplink.conf.ts
    './test/visual/**', // covered by `test:crabnebula:visual` (separate test type, runs via --spec)
  ],
  capabilities: [buildTauriCapability()],
  services: [tauriService('crabnebula'), visualService('crabnebula')],
  outputDir: logsDir('crabnebula'),
};
