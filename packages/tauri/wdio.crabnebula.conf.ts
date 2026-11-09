import { baseConfig, buildTauriCapability, logsDir, tauriService, visualService } from './wdio.base.conf.ts';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/multiremote/**',
    './test/standalone/**',
    './test/*.embedded.spec.ts', // embedded-driver-only behaviour
    './test/window.spec.ts', // requires splash window — covered by wdio.crabnebula.window.conf.ts
    './test/deeplink.spec.ts', // covered by wdio.crabnebula.deeplink.conf.ts
    './test/visual/**', // covered by `test:crabnebula:visual` (separate test type, runs via --spec)
    './test/video/**', // covered by `test:crabnebula:video` (separate test type)
  ],
  capabilities: [buildTauriCapability('crabnebula')],
  services: [tauriService('crabnebula'), visualService('crabnebula')],
  outputDir: logsDir('crabnebula-standard-tauri'),
};
