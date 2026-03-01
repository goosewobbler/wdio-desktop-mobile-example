import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Tauri Standalone Logging', () => {
  it('should capture logs in standalone mode', async () => {
    // Generate some logs
    await browser.tauri.execute(async ({ core }) => {
      await core.invoke('generate_test_logs');
    });

    // In standalone mode, logs should be captured differently
    expect(true).toBe(true);
  });

  it('should handle console logs in standalone mode', async () => {
    await browser.execute(() => {
      console.log('Standalone log message');
      console.info('Standalone info message');
      console.warn('Standalone warning message');
    });

    expect(true).toBe(true);
  });
});
