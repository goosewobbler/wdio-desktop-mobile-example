import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';
import { assertLogContains, currentLogDir, readWdioLogs, waitForLog } from './lib/utils.ts';

describe('Dioxus Logging', () => {
  const logDir = currentLogDir();

  it('should capture backend logs', async () => {
    await browser.dioxus.execute(async ({ invoke }) => {
      await invoke('generate_test_logs');
    });

    const found = await waitForLog(logDir, /\[Dioxus:Backend[^\]]*\].*test-info-log/i, 10000);
    expect(found).toBe(true);

    const logs = await readWdioLogs(logDir);
    assertLogContains(logs, /\[Dioxus:Backend[^\]]*\].*test-info-log/i);
    assertLogContains(logs, /\[Dioxus:Backend[^\]]*\].*test-warn-log/i);
    assertLogContains(logs, /\[Dioxus:Backend[^\]]*\].*test-error-log/i);
  });

  it('should capture frontend console logs', async () => {
    await browser.execute(() => {
      console.info('[Test] WDIO frontend INFO log');
      console.warn('[Test] WDIO frontend WARN log');
      console.error('[Test] WDIO frontend ERROR log');
    });

    const found = await waitForLog(logDir, /\[Dioxus:Frontend[^\]]*\].*WDIO frontend INFO/i, 10000);
    expect(found).toBe(true);

    const logs = await readWdioLogs(logDir);
    assertLogContains(logs, /\[Dioxus:Frontend[^\]]*\].*WDIO frontend INFO/i);
    assertLogContains(logs, /\[Dioxus:Frontend[^\]]*\].*WDIO frontend WARN/i);
    assertLogContains(logs, /\[Dioxus:Frontend[^\]]*\].*WDIO frontend ERROR/i);
  });
});
