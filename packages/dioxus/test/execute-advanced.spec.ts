import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Dioxus Execute Advanced', () => {
  it('should execute commands with complex return types', async () => {
    const result = await browser.dioxus.execute(async ({ invoke }) => {
      return await invoke('get_platform_info');
    });

    // Verify object structure returned by the Dioxus app's get_platform_info command
    expect(result).toHaveProperty('os');
    expect(result).toHaveProperty('arch');
    expect(typeof result.os).toBe('string');
    expect(typeof result.arch).toBe('string');
  });

  it('should execute multiple commands in sequence', async () => {
    const results = await browser.dioxus.execute(async ({ invoke }) => {
      const platformInfo = await invoke('get_platform_info');
      const args = await invoke('get_command_line_args');
      return { platformInfo, args };
    });

    expect(results).toHaveProperty('platformInfo');
    expect(results).toHaveProperty('args');
    expect(Array.isArray(results.args)).toBe(true);
  });

  it('should pass arguments to execute callbacks', async () => {
    const testValue = 42;

    const result = await browser.dioxus.execute(async (_dx, value) => {
      return value * 2;
    }, testValue);

    expect(result).toBe(84);
  });
});
