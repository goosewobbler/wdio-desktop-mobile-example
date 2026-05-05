import type { Options } from '@wdio/types';
import { baseConfig, buildElectronCapability, electronService, logsDir } from './wdio.base.conf.ts';

// Tells main/index.ts to spawn a splash window before showing main, so the
// `application window tests` spec can verify splash → main switching via the
// `.switch-main-window` button.
process.env.ENABLE_SPLASH_WINDOW = 'true';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/window.spec.ts'],
  capabilities: [buildElectronCapability()],
  services: [electronService],
  outputDir: logsDir('window'),
};
