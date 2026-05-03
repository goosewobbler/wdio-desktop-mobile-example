import { expect, multiRemoteBrowser } from '@wdio/globals';
import '@wdio/native-types';
import path from 'node:path';
import url from 'node:url';
import { assertLogContains, findLogEntries, readWdioLogs, waitForLog } from '../lib/utils.ts';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Logs land in <package>/logs/multiremote/ (per wdio.multiremote.conf.ts's logsDir('multiremote')).
function getMultiremoteLogDir() {
  return path.join(__dirname, '..', '..', 'logs', 'multiremote');
}

describe('Electron Log Integration - Multiremote', () => {
  it('should capture main process logs per instance with instance ID', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    await Promise.all([
      browserA.electron.execute(() => {
        console.info('[Test] Instance browserA main process INFO log');
        console.warn('[Test] Instance browserA main process WARN log');
        console.error('[Test] Instance browserA main process ERROR log');
      }),
      browserB.electron.execute(() => {
        console.info('[Test] Instance browserB main process INFO log');
        console.warn('[Test] Instance browserB main process WARN log');
        console.error('[Test] Instance browserB main process ERROR log');
      }),
    ]);

    const logsCaptured = await waitForLog(
      getMultiremoteLogDir(),
      /\[Electron:MainProcess:browserA\].*\[Test\].*Instance browserA.*INFO/i,
      10000,
    );
    if (!logsCaptured) {
      throw new Error('Main process logs not captured within timeout');
    }

    const logs = await readWdioLogs(getMultiremoteLogDir());

    if (!logs) {
      throw new Error('No logs found in output directory');
    }

    assertLogContains(logs, /\[Electron:MainProcess:browserA\].*\[Test\].*Instance browserA.*INFO/i);
    assertLogContains(logs, /\[Electron:MainProcess:browserB\].*\[Test\].*Instance browserB.*INFO/i);

    const mainProcessLogs = findLogEntries(logs, /\[Electron:MainProcess:(browserA|browserB)\]/i);
    expect(mainProcessLogs.length).toBeGreaterThan(0);
  });

  it('should capture renderer logs per instance with instance ID', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    await Promise.all([
      browserA.execute(() => {
        console.info('[Test] Instance browserA renderer INFO log');
      }),
      browserB.execute(() => {
        console.info('[Test] Instance browserB renderer INFO log');
      }),
    ]);

    const logsCaptured = await waitForLog(
      getMultiremoteLogDir(),
      /\[Electron:Renderer:browserA\].*\[Test\].*Instance browserA renderer INFO/i,
      10000,
    );
    if (!logsCaptured) {
      throw new Error('Renderer logs not captured within timeout');
    }

    const logs = await readWdioLogs(getMultiremoteLogDir());

    if (!logs) {
      throw new Error('No logs found in output directory');
    }

    assertLogContains(logs, /\[Electron:Renderer:browserA\].*\[Test\].*Instance browserA renderer INFO/i);
    assertLogContains(logs, /\[Electron:Renderer:browserB\].*\[Test\].*Instance browserB renderer INFO/i);

    const rendererLogs = findLogEntries(logs, /\[Electron:Renderer:(browserA|browserB)\]/i);
    expect(rendererLogs.length).toBeGreaterThan(0);
  });

  it('should capture logs independently per instance', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    await Promise.all([
      browserA.electron.execute(() => {
        console.info('[Test] BrowserA main process only log');
      }),
      browserB.execute(() => {
        console.info('[Test] BrowserB renderer only log');
      }),
    ]);

    const logsCaptured = await waitForLog(
      getMultiremoteLogDir(),
      /\[Electron:MainProcess:browserA\].*\[Test\].*BrowserA main process only log/i,
      10000,
    );
    if (!logsCaptured) {
      throw new Error('Logs not captured within timeout');
    }

    const logs = await readWdioLogs(getMultiremoteLogDir());

    if (!logs) {
      throw new Error('No logs found in output directory');
    }

    assertLogContains(logs, /\[Electron:MainProcess:browserA\].*\[Test\].*BrowserA main process only log/i);
    assertLogContains(logs, /\[Electron:Renderer:browserB\].*\[Test\].*BrowserB renderer only log/i);

    const mainProcessLogs = findLogEntries(logs, /\[Electron:MainProcess:(browserA|browserB)\]/i);
    const rendererLogs = findLogEntries(logs, /\[Electron:Renderer:(browserA|browserB)\]/i);
    expect(mainProcessLogs.length).toBeGreaterThan(0);
    expect(rendererLogs.length).toBeGreaterThan(0);
  });

  it('should apply different log levels per instance', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    await Promise.all([
      browserA.electron.execute(() => {
        console.debug('[Test] BrowserA DEBUG log');
        console.info('[Test] BrowserA INFO log');
      }),
      browserB.electron.execute(() => {
        console.debug('[Test] BrowserB DEBUG log');
        console.info('[Test] BrowserB INFO log');
      }),
    ]);

    const logsCaptured = await waitForLog(getMultiremoteLogDir(), /\[Electron:MainProcess:browserA\].*INFO/i, 10000);
    if (!logsCaptured) {
      throw new Error('Logs not captured within timeout');
    }

    const logs = await readWdioLogs(getMultiremoteLogDir());

    const debugLogs = findLogEntries(logs, /\[Electron:MainProcess:(browserA|browserB)\].*DEBUG/i);
    expect(debugLogs.length).toBe(0);

    assertLogContains(logs, /\[Electron:MainProcess:browserA\].*INFO/i);
    assertLogContains(logs, /\[Electron:MainProcess:browserB\].*INFO/i);
  });
});
