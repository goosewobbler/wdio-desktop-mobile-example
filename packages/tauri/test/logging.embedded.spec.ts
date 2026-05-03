import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';
import { currentLogDir, readWdioLogs } from './lib/utils.ts';

/**
 * Embedded WebDriver Console Limitation Tests
 *
 * Documents the known limitation that console.trace() and console.debug()
 * are NOT captured when using the embedded WebDriver provider with WKWebView.
 *
 * Root cause: WebKit's evaluateJavaScript() bypasses JavaScript property
 * overrides for console.trace/debug. See https://bugs.webkit.org/show_bug.cgi?id=22994
 *
 * Excluded from tauri-driver and CrabNebula provider configs.
 */
describe('Embedded WebDriver Console Limitations', () => {
  describe('Trace and Debug Limitation', () => {
    it('should document trace/debug limitation and console.info workaround', async () => {
      // Workaround: prefix console.info() instead of using console.trace/debug.
      await browser.execute(() => {
        console.info('[TRACE] TRACE message (using info as workaround)');
        console.info('[DEBUG] DEBUG message (using info as workaround)');
      });

      await browser.waitUntil(
        async () => {
          const logs = await readWdioLogs(currentLogDir());
          return logs.includes('[TRACE]') && logs.includes('[DEBUG]');
        },
        { timeout: 5000, timeoutMsg: 'Workaround logs not captured' },
      );

      const logs = await readWdioLogs(currentLogDir());
      expect(logs).toMatch(/\[TRACE\] TRACE message/s);
      expect(logs).toMatch(/\[DEBUG\] DEBUG message/s);
    });
  });

  describe('Working Console Methods', () => {
    it('should reliably capture console.info', async () => {
      await browser.execute(() => {
        console.info('Embedded INFO test');
      });

      await browser.waitUntil(
        async () => {
          const logs = await readWdioLogs(currentLogDir());
          return logs.includes('Embedded INFO test');
        },
        { timeout: 5000, timeoutMsg: 'Info logs not captured' },
      );

      const logs = await readWdioLogs(currentLogDir());
      expect(logs).toMatch(/Embedded INFO test/);
    });

    it('should reliably capture console.warn', async () => {
      await browser.execute(() => {
        console.warn('Embedded WARN test');
      });

      await browser.waitUntil(
        async () => {
          const logs = await readWdioLogs(currentLogDir());
          return logs.includes('Embedded WARN test');
        },
        { timeout: 5000, timeoutMsg: 'Warn logs not captured' },
      );

      const logs = await readWdioLogs(currentLogDir());
      expect(logs).toMatch(/Embedded WARN test/);
    });

    it('should reliably capture console.error', async () => {
      await browser.execute(() => {
        console.error('Embedded ERROR test');
      });

      await browser.waitUntil(
        async () => {
          const logs = await readWdioLogs(currentLogDir());
          return logs.includes('Embedded ERROR test');
        },
        { timeout: 5000, timeoutMsg: 'Error logs not captured' },
      );

      const logs = await readWdioLogs(currentLogDir());
      expect(logs).toMatch(/Embedded ERROR test/);
    });
  });
});
