import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Tauri Execute Data Types', () => {
  it('should handle string data type', async () => {
    const result = await browser.tauri.execute(async ({ core }) => {
      return await core.invoke('get_current_dir');
    });

    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle object data type', async () => {
    const result = await browser.tauri.execute(async ({ core }) => {
      return await core.invoke('get_platform_info');
    });

    expect(typeof result).toBe('object');
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(false);
  });

  it('should handle array data type', async () => {
    const result = await browser.tauri.execute(async ({ core }) => {
      return await core.invoke('get_deep_links');
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle number data types', async () => {
    const result = await browser.tauri.execute(async ({ core }) => {
      const info = await core.invoke('get_platform_info');
      return info.memory.total;
    });

    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('should handle boolean data types', async () => {
    // Tauri doesn't return booleans directly in our commands,
    // but we can verify the structure contains expected values
    const result = await browser.tauri.execute(async ({ core }) => {
      const info = await core.invoke('get_platform_info');
      return {
        hasMemory: info.memory.total > 0,
        hasCpu: info.cpu.cores > 0,
      };
    });

    expect(typeof result.hasMemory).toBe('boolean');
    expect(typeof result.hasCpu).toBe('boolean');
    expect(result.hasMemory).toBe(true);
    expect(result.hasCpu).toBe(true);
  });
});
