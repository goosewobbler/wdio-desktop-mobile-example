import { $, browser, expect } from '@wdio/globals';
import { MAX_MISMATCH_PCT, stabilise } from '../lib/visual.ts';

/**
 * VRT spike — confirms `@wdio/visual-service` v9 composes with
 * `@wdio/tauri-service` end-to-end.
 *
 * Tauri-side risk: the embedded provider's screenshot endpoint is bespoke
 * (Rust handler in tauri-plugin-webdriver). This spec is the smoke test.
 *
 * Run flow (driven by the `test:<provider>:visual` script which invokes
 * the dedicated config twice):
 *   1. First run with no baseline   -> autoSaveBaseline writes baseline, test passes.
 *   2. Second run, no UI change     -> compare returns ~0% mismatch, test passes.
 *   3. Third run with UI tweak      -> compare returns >>1% mismatch, test fails (proves diff path).
 */

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
