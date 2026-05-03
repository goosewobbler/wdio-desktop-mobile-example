import type { Options } from '@wdio/types';
import { baseConfig, buildMultiremoteCapabilities, logsDir, skipOnMacOS, tauriService } from './wdio.base.conf.ts';

skipOnMacOS('Tauri official driver is not supported on macOS');

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/multiremote/**/*.spec.ts'],
  capabilities: buildMultiremoteCapabilities(),
  services: [tauriService('official')],
  outputDir: logsDir('official', 'multiremote'),
};
