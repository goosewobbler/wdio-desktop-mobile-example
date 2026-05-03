import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Tauri Standalone Mode', () => {
  it('should execute basic commands in standalone mode', async () => {
    const result = await browser.tauri.execute(({ core }) => core.invoke('get_platform_info'));
    expect(result).toHaveProperty('os');
    expect(result).toHaveProperty('arch');
  });

  it('should handle clipboard operations in standalone mode', async () => {
    const testContent = 'Standalone test content';

    // Pass `testContent` through as the second arg — the function passed to
    // execute() runs in the browser context, so closure variables from the
    // test scope aren't visible inside.
    await browser.tauri.execute(
      async ({ core }, content) => {
        await core.invoke('write_clipboard', { content });
      },
      testContent,
    );

    const result = await browser.tauri.execute(async ({ core }) => {
      return await core.invoke('read_clipboard');
    });

    expect(result).toBe(testContent);
  });

  it('should handle window operations in standalone mode', async () => {
    const bounds = await browser.tauri.execute(async ({ core }) => {
      return await core.invoke('get_window_bounds');
    });

    expect(bounds).toHaveProperty('x');
    expect(bounds).toHaveProperty('y');
    expect(bounds).toHaveProperty('width');
    expect(bounds).toHaveProperty('height');
  });
});
