import type { Options } from '@wdio/types';
import { baseConfig, buildTauriCapability, logsDir, tauriService } from './wdio.base.conf.ts';

// Embedded provider serves the WebDriver from inside the Tauri app via
// tauri-plugin-wdio-webdriver. Signal the plugin to start its server.
process.env.WDIO_EMBEDDED_SERVER = 'true';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/multiremote/**',
    './test/standalone/**',
    './test/logging.tauri-driver.spec.ts', // tauri-driver-only behaviour
  ],
  capabilities: [buildTauriCapability()],
  services: [tauriService('embedded')],
  outputDir: logsDir('embedded'),
};
