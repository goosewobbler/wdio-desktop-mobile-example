import type { Options } from '@wdio/types';
import { baseConfig, buildMultiremoteCapabilities, electronService, logsDir } from './wdio.base.conf.ts';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/multiremote/**/*.spec.ts'],
  capabilities: buildMultiremoteCapabilities(),
  services: [electronService],
  outputDir: logsDir('multiremote'),
};
