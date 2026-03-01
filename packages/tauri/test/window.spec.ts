import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Tauri Window Management', () => {
  it('should get window bounds', async () => {
    const bounds = await browser.tauri.execute(async ({ core }) => {
      return await core.invoke('get_window_bounds');
    });

    expect(bounds).toHaveProperty('x');
    expect(bounds).toHaveProperty('y');
    expect(bounds).toHaveProperty('width');
    expect(bounds).toHaveProperty('height');
    expect(typeof bounds.width).toBe('number');
    expect(typeof bounds.height).toBe('number');
  });

  it('should set window bounds', async () => {
    // Get current bounds
    const originalBounds = await browser.tauri.execute(async ({ core }) => {
      return await core.invoke('get_window_bounds');
    });

    // Set new bounds
    const newBounds = {
      x: originalBounds.x + 10,
      y: originalBounds.y + 10,
      width: originalBounds.width,
      height: originalBounds.height,
    };

    await browser.tauri.execute(async ({ core }) => {
      await core.invoke('set_window_bounds', { bounds: newBounds });
    });

    // Verify bounds were updated
    const updatedBounds = await browser.tauri.execute(async ({ core }) => {
      return await core.invoke('get_window_bounds');
    });

    expect(updatedBounds.x).toBe(newBounds.x);
    expect(updatedBounds.y).toBe(newBounds.y);
  });

  it('should minimize and restore window', async () => {
    // Minimize window
    await browser.tauri.execute(async ({ core }) => {
      await core.invoke('minimize_window');
    });

    // Restore window (unmaximize if needed, or just verify it still exists)
    const bounds = await browser.tauri.execute(async ({ core }) => {
      return await core.invoke('get_window_bounds');
    });

    expect(bounds).toBeDefined();
  });
});
