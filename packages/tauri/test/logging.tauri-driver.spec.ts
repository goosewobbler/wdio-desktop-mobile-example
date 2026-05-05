import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';
import { currentLogDir, readWdioLogs } from './lib/utils.ts';

/**
 * Tauri-Driver Console Capture Tests
 *
 * Verifies console method capture works correctly with tauri-driver, including
 * console.trace() and console.debug() which are NOT captured in embedded
 * WebDriver mode (WebKit's evaluateJavaScript() bypasses JS property overrides).
 *
 * See https://bugs.webkit.org/show_bug.cgi?id=22994 — and the embedded-only
 * limitation tests in logging.embedded.spec.ts.
 *
 * Excluded from embedded provider config.
 */
describe('Console Trace and Debug Capture', () => {
  it('should capture console.trace from browser.execute', async () => {
    await browser.execute(() => {
      console.trace('TRACE from execute');
    });

    await browser.waitUntil(
      async () => {
        const logs = await readWdioLogs(currentLogDir());
        return logs.includes('TRACE from execute');
      },
      { timeout: 5000, timeoutMsg: 'Trace logs not captured' },
    );

    const logs = await readWdioLogs(currentLogDir());
    expect(logs).toMatch(/\[Tauri:Frontend[^\]]*\].*TRACE from execute/s);
  });

  it('should capture console.debug from browser.execute', async () => {
    await browser.execute(() => {
      console.debug('DEBUG from execute');
    });

    await browser.waitUntil(
      async () => {
        const logs = await readWdioLogs(currentLogDir());
        return logs.includes('DEBUG from execute');
      },
      { timeout: 5000, timeoutMsg: 'Debug logs not captured' },
    );

    const logs = await readWdioLogs(currentLogDir());
    expect(logs).toMatch(/\[Tauri:Frontend[^\]]*\].*DEBUG from execute/s);
  });

  it('should capture all console methods in a single call', async () => {
    await browser.execute(() => {
      console.trace('ALL TRACE from execute');
      console.debug('ALL DEBUG from execute');
      console.info('ALL INFO from execute');
      console.warn('ALL WARN from execute');
      console.error('ALL ERROR from execute');
    });

    await browser.waitUntil(
      async () => {
        const logs = await readWdioLogs(currentLogDir());
        return logs.includes('ALL TRACE from execute');
      },
      { timeout: 5000, timeoutMsg: 'Console logs not captured' },
    );

    const logs = await readWdioLogs(currentLogDir());
    expect(logs).toMatch(/\[Tauri:Frontend[^\]]*\].*ALL TRACE from execute/s);
    expect(logs).toMatch(/\[Tauri:Frontend[^\]]*\].*ALL DEBUG from execute/s);
    expect(logs).toMatch(/\[Tauri:Frontend[^\]]*\].*ALL INFO from execute/s);
    expect(logs).toMatch(/\[Tauri:Frontend[^\]]*\].*ALL WARN from execute/s);
    expect(logs).toMatch(/\[Tauri:Frontend[^\]]*\].*ALL ERROR from execute/s);
  });
});
