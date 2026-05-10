import { browser } from '@wdio/globals';

/**
 * Maximum acceptable mismatch percentage for a "passing match" assertion.
 *
 * Consecutive WebView2 / Chromium renders on Windows can produce ~0.5%
 * subpixel noise even with no UI change; macOS and Linux render
 * deterministically. 1% gives 2× headroom over observed noise and is well
 * below what an intentional UI change produces (a 4-character text edit ran
 * ~18% in the spike).
 */
export const MAX_MISMATCH_PCT = 1;

/**
 * Bring the page into a deterministic state before snapshotting.
 *
 * Borrowed from the standard Playwright recipe:
 *   - wait for fonts to be loaded so the first render isn't a fallback face,
 *   - kill any CSS animations / transitions that could otherwise be mid-frame
 *     when the screenshot is taken.
 */
export const stabilise = async (): Promise<void> => {
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
