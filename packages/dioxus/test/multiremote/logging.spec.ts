import { expect, multiRemoteBrowser } from '@wdio/globals';
import '@wdio/native-types';
import { assertLogContains, currentLogDir, findLogEntries, readWdioLogs, waitForLog } from '../lib/utils.ts';

describe('Dioxus Log Integration - Multiremote', () => {
  it('should capture backend logs per instance with instance ID', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    await Promise.all([
      browserA.dioxus.execute(({ invoke }) => invoke('generate_test_logs')),
      browserB.dioxus.execute(({ invoke }) => invoke('generate_test_logs')),
    ]);

    const logDir = currentLogDir('multiremote');
    const captured = await waitForLog(logDir, /\[Dioxus:Backend:(browserA|browserB)\].*test-info-log/i, 10000);
    if (!captured) {
      throw new Error('Backend logs not captured within timeout');
    }

    const logs = await readWdioLogs(logDir);
    if (!logs) {
      throw new Error('No logs found in multiremote log directory');
    }

    assertLogContains(logs, /\[Dioxus:Backend:(browserA|browserB)\].*test-info-log/i);
    assertLogContains(logs, /\[Dioxus:Backend:(browserA|browserB)\].*test-warn-log/i);
    assertLogContains(logs, /\[Dioxus:Backend:(browserA|browserB)\].*test-error-log/i);

    const backendLogs = findLogEntries(logs, /\[Dioxus:Backend:(browserA|browserB)\]/i);
    expect(backendLogs.length).toBeGreaterThan(0);
  });

  it('should capture frontend logs per instance', async () => {
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

  it('should capture logs independently per instance', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    await Promise.all([
      browserA.dioxus.execute(({ invoke }) => invoke('generate_test_logs')),
      browserB.execute(() => {
        console.info('browserB-only-frontend-log');
      }),
    ]);

    const logDir = currentLogDir('multiremote');
    const captured = await waitForLog(logDir, /\[Dioxus:Backend:browserA\]/, 10000);
    if (!captured) {
      throw new Error('Logs not captured within timeout');
    }

    const logs = await readWdioLogs(logDir);
    if (!logs) {
      throw new Error('No logs found in multiremote log directory');
    }

    assertLogContains(logs, /\[Dioxus:Backend:browserA\].*test-info-log/i);
    expect(logs).toContain('browserB-only-frontend-log');

    const backendLogs = findLogEntries(logs, /\[Dioxus:Backend:(browserA|browserB)\]/i);
    expect(backendLogs.length).toBeGreaterThan(0);
  });
});
