import { baseConfig, buildTauriCapability, logsDir, tauriService } from './wdio.base.conf.ts';

process.env.WDIO_EMBEDDED_SERVER = 'true';
// Activates the single-instance plugin in main.rs so the second app launch
// (triggered by browser.tauri.triggerDeeplink) forwards the deeplink to
// the original instance instead of starting a new process.
process.env.ENABLE_SINGLE_INSTANCE = 'true';

export const config: WebdriverIO.Config = {
  ...baseConfig,
  specs: ['./test/deeplink.spec.ts'],
  capabilities: [buildTauriCapability('embedded')],
  services: [tauriService('embedded')],
  outputDir: logsDir('embedded', 'deeplink'),
};
