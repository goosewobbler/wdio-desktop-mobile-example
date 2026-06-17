import type { Options } from '@wdio/types';
import { baseConfig, buildDioxusCapability, dioxusService, logsDir, visualService } from './wdio.base.conf.ts';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/multiremote/**',
    './test/standalone/**',
    './test/window.spec.ts', // requires splash window — covered by wdio.window.conf.ts
    './test/visual/**', // covered by `test:visual` (separate test type)
    './test/video/**', // covered by `test:video` (separate test type)
  ],
  capabilities: [buildDioxusCapability()],
  services: [dioxusService(), visualService()],
  outputDir: logsDir(),
};
