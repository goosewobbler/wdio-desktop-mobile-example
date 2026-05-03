import type { Options } from '@wdio/types';
import { baseConfig, buildElectronCapability, electronService, logsDir } from './wdio.base.conf.ts';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/*.spec.ts'],
  exclude: [
    './test/window.spec.ts', // requires splash window infrastructure (follow-up)
    './test/deeplink.spec.ts', // requires deeplink helper + protocol registration (follow-up)
  ],
  capabilities: [buildElectronCapability()],
  services: [electronService],
  outputDir: logsDir(),
};
