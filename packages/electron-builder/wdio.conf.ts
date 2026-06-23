import {
  baseConfig,
  buildElectronCapability,
  electronService,
  logsDir,
  visualService,
} from './wdio.base.conf.ts';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/*.spec.ts'],
  exclude: [
    './test/window.spec.ts', // requires splash window infrastructure (follow-up)
    './test/deeplink.spec.ts', // covered by wdio.deeplink.conf.ts (separate test type)
    './test/visual/**', // covered by `test:visual` (separate test type)
    './test/video/**', // covered by `test:video` (separate test type)
  ],
  capabilities: [buildElectronCapability()],
  services: [electronService, visualService],
  outputDir: logsDir(),
};
