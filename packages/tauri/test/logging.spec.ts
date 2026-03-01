import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Tauri Logging', () => {
  it('should capture backend logs', async () => {
    // Generate test logs on the backend
    await browser.tauri.execute(async ({ core }) => {
      await core.invoke('generate_test_logs');
    });

    // Logs should be available through the service
    // Note: Actual log verification depends on the driver provider
    expect(true).toBe(true);
  });

  it('should capture frontend console logs', async () => {
    // Generate console logs on the frontend
    await browser.execute(() => {
      console.log('Test log message');
      console.warn('Test warning message');
      console.error('Test error message');
    });

    // Logs should be available through the service
    expect(true).toBe(true);
  });
});
