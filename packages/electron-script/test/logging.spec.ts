import path from 'node:path';
import url from 'node:url';
import { browser, expect } from '@wdio/globals';
import { assertLogContains, findLogEntries, readWdioLogs, waitForLog } from './lib/utils.ts';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const logBaseDir = path.join(__dirname, '..', 'logs');

describe('Electron Log Integration', () => {
  describe('Main Process Log Capture', () => {
    it('should capture main process logs when enabled', async () => {
      await browser.electron.execute(() => {
        console.info('[Test] Main process INFO log');
        console.warn('[Test] Main process WARN log');
        console.error('[Test] Main process ERROR log');
      });

      const logsCaptured = await waitForLog(logBaseDir, /\[Electron:MainProcess\].*\[Test\].*INFO/i, 10000);
      if (!logsCaptured) {
        throw new Error('Main process logs not captured within timeout');
      }

      const logs = await readWdioLogs(logBaseDir);
      if (!logs) {
        throw new Error('No logs found in output directory');
      }

      assertLogContains(logs, /\[Electron:MainProcess\].*\[Test\].*INFO/i);
      assertLogContains(logs, /\[Electron:MainProcess\].*\[Test\].*WARN/i);
      assertLogContains(logs, /\[Electron:MainProcess\].*\[Test\].*ERROR/i);
    });

    it('should filter main process logs by level', async () => {
      await browser.electron.execute(() => {
        console.debug('[Test] Main process DEBUG log');
        console.info('[Test] Main process INFO log for filtering test');
      });

      const logsCaptured = await waitForLog(
        logBaseDir,
        /\[Electron:MainProcess\].*INFO log for filtering test/i,
        10000,
      );
      if (!logsCaptured) {
        throw new Error('Main process logs not captured within timeout');
      }

      const logs = await readWdioLogs(logBaseDir);

      // With default 'info' level, DEBUG should be filtered out.
      const debugLogs = findLogEntries(logs, /\[Electron:MainProcess\].*DEBUG/i);
      expect(debugLogs.length).toBe(0);
    });
  });

  describe('Renderer Process Log Capture', () => {
    it('should capture renderer console logs when enabled', async () => {
      await browser.execute(() => {
        console.info('[Test] Renderer INFO log');
        console.warn('[Test] Renderer WARN log');
        console.error('[Test] Renderer ERROR log');
      });

      const logsCaptured = await waitForLog(logBaseDir, /\[Electron:Renderer\].*\[Test\].*INFO/i, 10000);
      if (!logsCaptured) {
        throw new Error('Renderer logs not captured within timeout');
      }

      const logs = await readWdioLogs(logBaseDir);
      if (!logs) {
        throw new Error('No logs found in output directory');
      }

      assertLogContains(logs, /\[Electron:Renderer\].*\[Test\].*INFO/i);
      assertLogContains(logs, /\[Electron:Renderer\].*\[Test\].*WARN/i);
      assertLogContains(logs, /\[Electron:Renderer\].*\[Test\].*ERROR/i);
    });

    it('should filter renderer logs by level', async () => {
      await browser.execute(() => {
        console.debug('[Test] Renderer DEBUG log');
        console.info('[Test] Renderer INFO log for filtering test');
      });

      const logsCaptured = await waitForLog(logBaseDir, /\[Electron:Renderer\].*INFO log for filtering test/i, 10000);
      if (!logsCaptured) {
        throw new Error('Renderer logs not captured within timeout');
      }

      const logs = await readWdioLogs(logBaseDir);

      const debugLogs = findLogEntries(logs, /\[Electron:Renderer\].*DEBUG/i);
      expect(debugLogs.length).toBe(0);
    });
  });

  describe('Combined Log Capture', () => {
    it('should capture both main and renderer logs simultaneously', async () => {
      await browser.electron.execute(() => {
        console.info('[Test] Combined main process log');
      });

      await browser.execute(() => {
        console.info('[Test] Combined renderer log');
      });

      const logsCaptured = await waitForLog(logBaseDir, /\[Electron:MainProcess\].*Combined main process/i, 10000);
      if (!logsCaptured) {
        throw new Error('Combined logs not captured within timeout');
      }

      const logs = await readWdioLogs(logBaseDir);

      assertLogContains(logs, /\[Electron:MainProcess\].*Combined main process/i);
      assertLogContains(logs, /\[Electron:Renderer\].*Combined renderer/i);
    });
  });
});
