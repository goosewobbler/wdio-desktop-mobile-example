import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Tauri Execute Advanced', () => {
  it('should execute commands with complex return types', async () => {
    const result = await browser.tauri.execute(async ({ core }) => {
      return await core.invoke('get_platform_info');
    });

    // Verify complex object structure
    expect(result).toHaveProperty('os');
    expect(result).toHaveProperty('arch');
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('hostname');
    expect(result).toHaveProperty('memory');
    expect(result.memory).toHaveProperty('total');
    expect(result.memory).toHaveProperty('free');
    expect(result).toHaveProperty('cpu');
    expect(result.cpu).toHaveProperty('cores');
    expect(result.cpu).toHaveProperty('frequency');
    expect(result).toHaveProperty('disk');
    expect(result.disk).toHaveProperty('total');
    expect(result.disk).toHaveProperty('free');
  });

  it('should execute multiple commands in sequence', async () => {
    const results = await browser.tauri.execute(async ({ core }) => {
      const platformInfo = await core.invoke('get_platform_info');
      const currentDir = await core.invoke('get_current_dir');
      return { platformInfo, currentDir };
    });

    expect(results).toHaveProperty('platformInfo');
    expect(results).toHaveProperty('currentDir');
    expect(typeof results.currentDir).toBe('string');
  });

  it('should handle clipboard operations', async () => {
    const testContent = 'Test clipboard content';

    // Write to clipboard
    await browser.tauri.execute(async ({ core }) => {
      await core.invoke('write_clipboard', { content: testContent });
    });

    // Read from clipboard
    const clipboardContent = await browser.tauri.execute(async ({ core }) => {
      return await core.invoke('read_clipboard');
    });

    expect(clipboardContent).toBe(testContent);
  });
});
