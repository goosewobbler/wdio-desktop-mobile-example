import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Dioxus Execute Data Types', () => {
  it('should handle string data type', async () => {
    const result = await browser.dioxus.execute(async ({ invoke }) => {
      const info = await invoke('get_platform_info');
      return info.os;
    });

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle object data type', async () => {
    const result = await browser.dioxus.execute(async ({ invoke }) => {
      return await invoke('get_platform_info');
    });

    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(false);
  });

  it('should handle array data type', async () => {
    const result = await browser.dioxus.execute(async ({ invoke }) => {
      return await invoke('get_command_line_args');
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle number data types', async () => {
    const result = await browser.dioxus.execute(async (_dx) => {
      return 42;
    });

    expect(typeof result).toBe('number');
    expect(result).toBe(42);
  });

  it('should handle boolean data types', async () => {
    const result = await browser.dioxus.execute(async ({ invoke }) => {
      const info = await invoke('get_platform_info');
      return {
        hasOs: typeof info.os === 'string',
        hasArch: typeof info.arch === 'string',
      };
    });

    expect(typeof result.hasOs).toBe('boolean');
    expect(typeof result.hasArch).toBe('boolean');
    expect(result.hasOs).toBe(true);
    expect(result.hasArch).toBe(true);
  });
});
