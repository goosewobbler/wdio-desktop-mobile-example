import { expect, multiRemoteBrowser } from '@wdio/globals';
import '@wdio/native-types';

describe('Tauri Multiremote Advanced', () => {
  it('should handle independent mock operations', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    // Set up different mocks on each instance
    const mockA = await browserA.tauri.mock('read_clipboard');
    const mockB = await browserB.tauri.mock('read_clipboard');

    await mockA.mockReturnValue('Instance A clipboard');
    await mockB.mockReturnValue('Instance B clipboard');

    // Execute on both instances
    const [resultA, resultB] = await Promise.all([
      browserA.tauri.execute(async ({ core }) => await core.invoke('read_clipboard')),
      browserB.tauri.execute(async ({ core }) => await core.invoke('read_clipboard')),
    ]);

    expect(resultA).toBe('Instance A clipboard');
    expect(resultB).toBe('Instance B clipboard');
  });

  it('should handle concurrent window operations', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    // Get bounds from both windows concurrently
    const [boundsA, boundsB] = await Promise.all([
      browserA.tauri.execute(async ({ core }) => await core.invoke('get_window_bounds')),
      browserB.tauri.execute(async ({ core }) => await core.invoke('get_window_bounds')),
    ]);

    expect(boundsA).toHaveProperty('width');
    expect(boundsA).toHaveProperty('height');
    expect(boundsB).toHaveProperty('width');
    expect(boundsB).toHaveProperty('height');
  });
});
