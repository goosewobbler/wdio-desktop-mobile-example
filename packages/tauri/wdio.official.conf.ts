import type { Options } from '@wdio/types';
import { baseConfig, buildTauriCapability, logsDir, skipOnMacOS, tauriService } from './wdio.base.conf.ts';

skipOnMacOS('Tauri official driver is not supported on macOS');

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/multiremote/**',
    './test/standalone/**',
    './test/logging.embedded.spec.ts', // documents WKWebView-specific limitation
    './test/window.spec.ts', // requires splash window — covered by wdio.official.window.conf.ts
    './test/deeplink.spec.ts', // covered by wdio.official.deeplink.conf.ts
  ],
  capabilities: [buildTauriCapability()],
  services: [tauriService('official')],
  outputDir: logsDir('official'),
};
