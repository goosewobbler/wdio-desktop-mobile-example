import { $, browser, expect } from '@wdio/globals';

/**
 * Video-recording sanity spec for `wdio-video-reporter` against the Tauri service.
 *
 * Captures via screenshot stitching driven by per-command frame triggers. This
 * spec exercises a handful of clicks (visible counter changes) so the
 * reporter has meaningful frames. App-correctness is covered by the standard
 * suite — this spec only verifies the reporter wires up and produces a file.
 */

describe('video recording sanity — tauri', () => {
  it('exercises a few clicks so the reporter has frames to stitch', async () => {
    expect(await browser.getTitle()).toBeTruthy();

    // Each click triggers a frame capture in the reporter's per-command
    // screenshot path, so back-to-back clicks already produce distinct
    // frames — no explicit pauses needed.
    await $('h1').click();
    await $('#increment-button').click();
    await $('#increment-button').click();
    await $('#increment-button').click();
    await $('#decrement-button').click();

    await browser.waitUntil(async () => (await $('#counter').getText()) === '2');
  });
});
