import { $, browser, expect } from '@wdio/globals';

/**
 * VRT spike — confirms `@wdio/visual-service` v9 composes with
 * `@wdio/tauri-service` end-to-end.
 *
 * Tauri-side risk: the embedded provider's screenshot endpoint is bespoke
 * (Rust handler in tauri-plugin-webdriver). This spec is the smoke test.
 *
 * Run flow mirrors the Electron spec:
 *   1. First run with no baseline    -> autoSaveBaseline writes baseline, test passes.
 *   2. Second run, no UI change      -> compare returns 0 mismatches, test passes.
 *   3. Third run with UI tweak       -> compare returns >0 mismatch, test fails (proves diff path).
 *
 * 1% tolerance covers the WebView2 subpixel-rendering noise observed on
 * Windows runners; macOS and Linux render deterministically. Real UI changes
 * exceed this comfortably (a small text edit runs ~18% mismatch).
 */
const MAX_MISMATCH_PCT = 1;

const stabilise = async (): Promise<void> => {
  await browser.execute(() => document.fonts.ready);
  await browser.execute(() => {
    const style = document.createElement('style');
    style.id = '__vrt-no-anim';
    style.textContent = `*, *::before, *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
    }`;
    document.head.appendChild(style);
  });
};

describe('visual regression — tauri', () => {
  before(async () => {
    await stabilise();
    // Reset counter to a known value so the digit-rendered area is stable.
    await browser.execute(() => {
      const counter = document.getElementById('counter');
      if (counter) counter.textContent = '0';
      const status = document.getElementById('status');
      if (status) status.textContent = 'Ready for testing';
    });
    // Land focus on the heading so no button has hover/focus rings.
    await $('h1').click();
  });

  it('matches baseline of full screen', async () => {
    const result = await browser.checkScreen('home');
    expect(result).toBeLessThanOrEqual(MAX_MISMATCH_PCT);
  });

  it('matches baseline of the counter element', async () => {
    const result = await browser.checkElement(await $('.counter-section'), 'counter-section');
    expect(result).toBeLessThanOrEqual(MAX_MISMATCH_PCT);
  });
});
