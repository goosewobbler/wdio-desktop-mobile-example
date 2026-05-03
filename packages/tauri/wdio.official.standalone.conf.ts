import type { Options } from '@wdio/types';
import { baseConfig, buildTauriCapability, logsDir, skipOnMacOS, tauriService } from './wdio.base.conf.ts';

skipOnMacOS('Tauri official driver is not supported on macOS');

/** See note in wdio.embedded.standalone.conf.ts about testrunner-mode standalone. */
export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/standalone/**/*.spec.ts'],
  capabilities: [buildTauriCapability()],
  services: [tauriService('official')],
  outputDir: logsDir('official', 'standalone'),
};
