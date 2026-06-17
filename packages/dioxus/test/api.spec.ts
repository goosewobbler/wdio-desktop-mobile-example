import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Dioxus API', () => {
  it('should execute basic commands', async () => {
    const result = await browser.dioxus.execute(({ invoke }) => invoke('get_platform_info'));
    expect(result).toHaveProperty('os');
    expect(result).toHaveProperty('arch');
  });

  it('should handle command errors gracefully', async () => {
    await expect(browser.dioxus.execute(({ invoke }) => invoke('invalid_command'))).rejects.toThrow();
  });

  it('should execute commands with parameters', async () => {
    const result = (await browser.dioxus.execute(({ invoke }) => invoke('get_platform_info'))) as { os: string };
    expect(result).toHaveProperty('os');
    expect(typeof result.os).toBe('string');
  });
});
