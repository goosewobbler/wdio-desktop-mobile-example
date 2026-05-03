import type { Options } from '@wdio/types';
import { baseConfig, buildElectronCapability, electronService, logsDir } from './wdio.base.conf.ts';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/*.spec.ts'],
  exclude: [
    './test/window.spec.ts', // requires splash window infrastructure (follow-up)
    './test/deeplink.spec.ts', // covered by wdio.deeplink.conf.ts (separate test type)
  ],
  capabilities: [buildElectronCapability()],
  services: [electronService],
  outputDir: logsDir(),
};
