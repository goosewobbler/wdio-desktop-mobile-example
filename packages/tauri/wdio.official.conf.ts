import type { Options } from '@wdio/types';
import { baseConfig, buildTauriCapability, logsDir, skipOnMacOS, tauriService } from './wdio.base.conf.ts';

skipOnMacOS('Tauri official driver is not supported on macOS');

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: ['./test/multiremote/**', './test/standalone/**'],
  capabilities: [buildTauriCapability()],
  services: [tauriService('official')],
  outputDir: logsDir('official'),
};
