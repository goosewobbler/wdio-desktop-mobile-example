import { $, browser, expect } from '@wdio/globals';
import { MAX_MISMATCH_PCT, stabilise } from '../lib/visual.ts';

/**
 * VRT spike — confirms `@wdio/visual-service` v9 composes with
 * `@wdio/electron-service` end-to-end.
 *
 * Run flow (driven by the `test:visual` script which invokes the
 * dedicated config twice):
 *   1. First run with no baseline   -> autoSaveBaseline writes baseline, test passes.
 *   2. Second run, no UI change     -> compare returns ~0% mismatch, test passes.
 *   3. Third run with UI tweak      -> compare returns >>1% mismatch, test fails (proves diff path).
 */

describe('visual regression — electron-script', () => {
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
