import { baseConfig, buildDioxusCapability, dioxusService, logsDir, visualService } from './wdio.base.conf.ts';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/multiremote/**',
    './test/standalone/**',
    './test/window.spec.ts', // covered by wdio.window.conf.ts
    './test/deeplink.spec.ts', // covered by wdio.deeplink.conf.ts
    // The embedded driver refuses screenshots until webdriverio/desktop-mobile#741.
    './test/visual.spec.ts',
    './test/visual/**', // covered by `test:visual` (separate test type)
    './test/video/**', // covered by `test:video` (separate test type)
  ],
  capabilities: [buildDioxusCapability()],
  services: [dioxusService(), visualService()],
  outputDir: logsDir('embedded-standard-dioxus'),
};
