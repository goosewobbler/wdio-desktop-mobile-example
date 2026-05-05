import type { Options } from '@wdio/types';
import { baseConfig, buildMultiremoteCapabilities, logsDir, tauriService } from './wdio.base.conf.ts';

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/multiremote/**/*.spec.ts'],
  // multiremote/logging.spec.ts auto-skips on CrabNebula (test-runner-backend
  // doesn't forward stderr) — kept in the spec list so the skips are visible.
  capabilities: buildMultiremoteCapabilities(),
  services: [tauriService('crabnebula')],
  outputDir: logsDir('crabnebula', 'multiremote'),
};
