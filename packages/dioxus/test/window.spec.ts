// Multi-window tests for Dioxus — adapted from the Tauri equivalent.
// The Dioxus fixture is a single-window app; splash-specific tests
// soft-skip when the splash window is not available. The listWindows /
// switchWindow API surface is exercised on the main window in all cases.
import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Multi-Window Support', () => {
  beforeEach(async () => {
    try {
      await browser.dioxus.switchWindow('main');
    } catch {
      // If main doesn't exist, continue anyway
    }
  });

  describe('listWindows()', () => {
    it('should list all available windows', async () => {
      const windows = await browser.dioxus.listWindows();
      expect(Array.isArray(windows)).toBe(true);
      expect(windows.length).toBeGreaterThanOrEqual(1);
    });

    it('should include splash window when available', async () => {
      const windows = await browser.dioxus.listWindows();
      if (windows.length > 1) {
        expect(windows).toContain('splash');
      }
    });
  });

  describe('switchWindow()', () => {
    it('should switch to main window', async () => {
      await browser.dioxus.switchWindow('main');
      const title = await browser.getTitle();
      expect(title).toMatch(/WDIO Dioxus E2E App/);
    });

    it('should switch to splash window when available', async () => {
      const windows = await browser.dioxus.listWindows();
      if (!windows.includes('splash')) {
        console.log('[SKIP] Splash window not available in this build');
        return;
      }
      await browser.dioxus.switchWindow('splash');
      await expect(browser).toHaveTitle('Splash Screen');
    });

    it('should throw for non-existent window', async () => {
      await expect(browser.dioxus.switchWindow('nonexistent-window-12345')).rejects.toThrow();
    });

    it('should be able to switch back to main after switching to splash', async () => {
      const windows = await browser.dioxus.listWindows();
      if (!windows.includes('splash')) {
        console.log('[SKIP] Splash window not available');
        return;
      }
      await browser.dioxus.switchWindow('splash');
      await expect(browser).toHaveTitle('Splash Screen');
      await browser.dioxus.switchWindow('main');
      await expect(browser).toHaveTitle(/WDIO Dioxus E2E App/);
    });
  });
});

describe('application window tests', () => {
  before(async () => {
    const windows = await browser.dioxus.listWindows();
    if (windows.includes('splash')) {
      await browser.dioxus.switchWindow('splash');
    }
  });

  it('should launch the application window', async () => {
    const windows = await browser.dioxus.listWindows();
    if (!windows.includes('splash')) {
      console.log('[DEBUG] Splash not available, checking main window title');
      await expect(browser).toHaveTitle(/WDIO Dioxus E2E App/);
      return;
    }

    await expect(browser).toHaveTitle('Splash Screen');
  });

  it('should switch to the application main window', async () => {
    const windows = await browser.dioxus.listWindows();
    if (!windows.includes('splash')) {
      console.log('[DEBUG] Splash not available, verifying main window');
      const title = await browser.getTitle();
      expect(title).toMatch(/WDIO Dioxus E2E App/);
      return;
    }

    const switchButton = await browser.$('.switch-main-window');
    const hasSwitchButton = await switchButton.isDisplayed();
    if (hasSwitchButton) {
      await switchButton.click();
      await browser.dioxus.switchWindow('main');
    }
    const title = await browser.getTitle();
    expect(title).toMatch(/WDIO Dioxus E2E App/);
  });
});
