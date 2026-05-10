import { $, browser, expect } from '@wdio/globals';

/**
 * VRT spike — confirms `@wdio/visual-service` v9 composes with
 * `@wdio/electron-service` end-to-end.
 *
 * Run flow:
 *   1. First run with no baseline    -> autoSaveBaseline writes baseline, test passes.
 *   2. Second run, no UI change      -> compare returns 0 mismatches, test passes.
 *   3. Third run with UI tweak       -> compare returns >0 mismatch, test fails (proves diff path).
 *
 * Stabilisation borrowed from Playwright: wait for fonts, kill animations,
 * settle the click-counter to a known value before asserting.
 *
 * The 1% tolerance is here because consecutive WebView2 / Chromium renders on
 * Windows can produce ~0.5% subpixel noise even with no UI change. macOS and
 * Linux render deterministically. 1% is well below what an intentional UI
 * change produces (a 4-character text edit ran ~18% in the spike).
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

describe('visual regression — electron-forge', () => {
  before(async () => {
    await stabilise();
    // Land focus on a stable element so no button has hover/focus rings.
    await $('h1').click();
  });

  it('matches baseline of full screen', async () => {
    const result = await browser.checkScreen('home');
    expect(result).toBeLessThanOrEqual(MAX_MISMATCH_PCT);
  });

  it('matches baseline of the click-counter element', async () => {
    const result = await browser.checkElement(await $('.info-section'), 'info-section');
    expect(result).toBeLessThanOrEqual(MAX_MISMATCH_PCT);
  });
});
