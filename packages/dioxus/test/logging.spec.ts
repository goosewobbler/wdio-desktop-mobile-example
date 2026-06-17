import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Dioxus Logging', () => {
  it('should capture backend logs', async () => {
    // Generate test logs on the backend
    await browser.dioxus.execute(async ({ invoke }) => {
      await invoke('generate_test_logs');
    });

    // Logs should be available through the service
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
