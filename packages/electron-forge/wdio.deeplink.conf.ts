import { baseConfig, buildElectronCapability, electronService, logsDir } from './wdio.base.conf.ts';

/**
 * Deeplink test type — requires the packaged binary so the system protocol
 * handler (testapp://) can register and route URLs back via single-instance
 * lock + open-url events. Script mode is unsupported (use the binary build).
 */
export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/deeplink.spec.ts'],
  capabilities: [buildElectronCapability()],
  services: [electronService],
  outputDir: logsDir('deeplink'),
};
