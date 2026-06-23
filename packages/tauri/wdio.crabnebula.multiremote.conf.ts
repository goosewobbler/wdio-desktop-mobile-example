import { baseConfig, buildMultiremoteCapabilities, logsDir, tauriService } from './wdio.base.conf.ts';

export const config: WebdriverIO.MultiremoteConfig = {
  ...baseConfig,
  specs: ['./test/multiremote/**/*.spec.ts'],
  // multiremote/logging.spec.ts auto-skips on CrabNebula (test-runner-backend
  // doesn't forward stderr) — kept in the spec list so the skips are visible.
  capabilities: buildMultiremoteCapabilities('crabnebula'),
  services: [tauriService('crabnebula')],
  outputDir: logsDir('crabnebula', 'multiremote'),
};
