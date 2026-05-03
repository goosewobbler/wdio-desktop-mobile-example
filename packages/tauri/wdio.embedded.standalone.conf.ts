import type { Options } from '@wdio/types';
import { baseConfig, buildTauriCapability, logsDir, tauriService } from './wdio.base.conf.ts';

process.env.WDIO_EMBEDDED_SERVER = 'true';

/**
 * NOTE: This runs the `test/standalone/*.spec.ts` files via the WDIO
 * testrunner — NOT through the @wdio/tauri-service standalone API
 * (`startWdioSession`/`cleanupWdioSession`). True standalone-mode
 * alignment with the upstream spec is on the follow-up roadmap.
 */
export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/standalone/**/*.spec.ts'],
  capabilities: [buildTauriCapability()],
  services: [tauriService('embedded')],
  outputDir: logsDir('embedded', 'standalone'),
};
