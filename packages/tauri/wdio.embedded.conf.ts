import {
  baseConfig,
  buildTauriCapability,
  logsDir,
  tauriService,
  visualService,
} from './wdio.base.conf.ts';

// Embedded provider serves the WebDriver from inside the Tauri app via
// tauri-plugin-wdio-webdriver. Signal the plugin to start its server.
process.env.WDIO_EMBEDDED_SERVER = 'true';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/multiremote/**',
    './test/standalone/**',
    './test/logging.tauri-driver.spec.ts', // tauri-driver-only behaviour
    './test/window.spec.ts', // requires splash window — covered by wdio.embedded.window.conf.ts
    './test/deeplink.spec.ts', // covered by wdio.embedded.deeplink.conf.ts
    './test/visual/**', // covered by `test:embedded:visual` (separate test type, runs via --spec)
    './test/video/**', // covered by `test:embedded:video` (separate test type)
  ],
  capabilities: [buildTauriCapability('embedded')],
  services: [tauriService('embedded'), visualService('embedded')],
  outputDir: logsDir('embedded'),
};
