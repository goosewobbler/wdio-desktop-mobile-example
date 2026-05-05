import { expect, multiRemoteBrowser } from '@wdio/globals';
import '@wdio/native-types';
import { assertLogContains, currentLogDir, findLogEntries, readWdioLogs, waitForLog } from '../lib/utils.ts';

const isCrabNebula = process.env.DRIVER_PROVIDER === 'crabnebula';

describe('Tauri Log Integration - Multiremote', () => {
  it('should capture backend logs per instance with instance ID', async function () {
    if (isCrabNebula) {
      // CrabNebula's test-runner-backend doesn't forward app stderr.
      this.skip();
    }
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    await Promise.all([
      browserA.tauri.execute(({ core }) => core.invoke('generate_test_logs')),
      browserB.tauri.execute(({ core }) => core.invoke('generate_test_logs')),
    ]);

    const logDir = currentLogDir('multiremote');
    const captured = await waitForLog(logDir, /\[Tauri:Backend:(browserA|browserB)\].*INFO level log/i, 10000);
    if (!captured) {
      throw new Error('Backend logs not captured within timeout');
    }

    const logs = await readWdioLogs(logDir);
    if (!logs) {
      throw new Error('No logs found in multiremote log directory');
    }

    assertLogContains(logs, /\[Tauri:Backend:(browserA|browserB)\].*INFO level log/i);
    assertLogContains(logs, /\[Tauri:Backend:(browserA|browserB)\].*WARN level log/i);
    assertLogContains(logs, /\[Tauri:Backend:(browserA|browserB)\].*ERROR level log/i);

    const backendLogs = findLogEntries(logs, /\[Tauri:Backend:(browserA|browserB)\]/i);
    expect(backendLogs.length).toBeGreaterThan(0);
  });

  it('should capture frontend logs per instance', async function () {
    if (isCrabNebula) {
      this.skip();
    }
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    const markerA = `InstanceA_${Date.now()}_unique`;
    const markerB = `InstanceB_${Date.now()}_unique`;

    await Promise.all([
      browserA.execute((m: string) => {
        console.info(m);
      }, markerA),
      browserB.execute((m: string) => {
        console.info(m);
      }, markerB),
    ]);

    const logDir = currentLogDir('multiremote');
    const captured = await waitForLog(logDir, markerA, 10000);
    if (!captured) {
      throw new Error('Frontend logs not captured within timeout');
    }

    const logs = await readWdioLogs(logDir);
    if (!logs) {
      throw new Error('No logs found in multiremote log directory');
    }

    expect(logs).toContain(markerA);
    expect(logs).toContain(markerB);
  });

  it('should capture logs independently per instance', async function () {
    if (isCrabNebula) {
      this.skip();
    }
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    await Promise.all([
      browserA.tauri.execute(({ core }) => core.invoke('generate_test_logs')),
      browserB.execute(() => {
        console.info('browserB-only-frontend-log');
      }),
    ]);

    const logDir = currentLogDir('multiremote');
    const captured = await waitForLog(logDir, /\[Tauri:Backend:browserA\]/, 10000);
    if (!captured) {
      throw new Error('Logs not captured within timeout');
    }

    const logs = await readWdioLogs(logDir);
    if (!logs) {
      throw new Error('No logs found in multiremote log directory');
    }

    assertLogContains(logs, /\[Tauri:Backend:browserA\].*INFO level log/i);
    expect(logs).toContain('browserB-only-frontend-log');

    const backendLogs = findLogEntries(logs, /\[Tauri:Backend:(browserA|browserB)\]/i);
    expect(backendLogs.length).toBeGreaterThan(0);
  });
});
