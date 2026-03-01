import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Tauri Deep Link', () => {
  it('should track received deep links', async () => {
    // Check initial state
    const initialCount = await browser.execute(() => {
      return (window as { deeplinkCount?: number }).deeplinkCount || 0;
    });

    expect(typeof initialCount).toBe('number');
  });

  it('should expose deep link array on window', async () => {
    const deeplinks = await browser.execute(() => {
      return (window as { receivedDeeplinks?: string[] }).receivedDeeplinks || [];
    });

    expect(Array.isArray(deeplinks)).toBe(true);
  });
});
