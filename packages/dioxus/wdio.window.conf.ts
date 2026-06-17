import type { Options } from '@wdio/types';
import { baseConfig, buildDioxusCapability, dioxusService, logsDir } from './wdio.base.conf.ts';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/window.spec.ts'],
  capabilities: [buildDioxusCapability()],
  services: [dioxusService()],
  outputDir: logsDir('window'),
};
