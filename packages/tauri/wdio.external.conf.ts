import {
  baseConfig,
  buildTauriCapability,
  logsDir,
  skipOnMacOS,
  tauriService,
  visualService,
} from './wdio.base.conf.ts';

skipOnMacOS('Tauri external driver is not supported on macOS');

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/multiremote/**',
    './test/standalone/**',
    './test/*.embedded.spec.ts', // embedded-driver-only behaviour
    './test/window.spec.ts', // requires splash window — covered by wdio.external.window.conf.ts
    './test/deeplink.spec.ts', // covered by wdio.external.deeplink.conf.ts
    './test/visual/**', // covered by `test:external:visual` (separate test type, runs via --spec)
    './test/video/**', // covered by `test:external:video` (separate test type)
  ],
  capabilities: [buildTauriCapability('external')],
  services: [tauriService('external'), visualService('external')],
  outputDir: logsDir('standard-tauri'),
};
