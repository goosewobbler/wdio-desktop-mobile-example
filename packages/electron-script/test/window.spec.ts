// Multi-window / splash-screen tests for Electron — adapted verbatim from
// upstream `~/Workspace/wdio-desktop-mobile/e2e/test/electron/window.spec.ts`.
// Runs only when ENABLE_SPLASH_WINDOW=true is set (see wdio.window.conf.ts).
import { browser } from '@wdio/electron-service';
import { expect } from '@wdio/globals';

describe('application window tests', () => {
  it('should launch the application splash screen window', async () => {
    const switchButton = await browser.$('.switch-main-window');
    const hasSwitchButton = switchButton !== null;

    if (!hasSwitchButton) {
      // Splash isn't enabled — verify we landed on main directly.
      await expect(browser).toHaveTitle(/Electron.*E2E Test App/);
      return;
    }

    if (browser.isMultiremote) {
      const multi = browser as unknown as WebdriverIO.MultiRemoteBrowser;
      const browserA = multi.getInstance('browserA');
      const browserB = multi.getInstance('browserB');
      await expect(browserA).toHaveTitle('Splash Screen');
      await expect(browserB).toHaveTitle('Splash Screen');
    } else {
      await expect(browser).toHaveTitle('Splash Screen');
    }
  });

  it('should switch to the application main window', async () => {
    const switchButton = await browser.$('.switch-main-window');
    const hasSwitchButton = switchButton !== null;

    if (!hasSwitchButton) {
      const title = await browser.getTitle();
      expect(title).toMatch(/Electron.*E2E Test App/);
      return;
    }

    if (browser.isMultiremote) {
      const multi = browser as unknown as WebdriverIO.MultiRemoteBrowser;
      const browserA = multi.getInstance('browserA');
      const browserB = multi.getInstance('browserB');
      await (await browserA.$('.switch-main-window')).click();
      await (await browserB.$('.switch-main-window')).click();
      const titleA = await browserA.getTitle();
      const titleB = await browserB.getTitle();
      expect(titleA).toMatch(/Electron.*E2E Test App/);
      expect(titleB).toMatch(/Electron.*E2E Test App/);
    } else {
      const elem = await browser.$('.switch-main-window');
      await elem.click();
      await expect(browser).toHaveTitle(/Electron.*E2E Test App/);
    }
  });
});
