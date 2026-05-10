import { $, browser, expect } from '@wdio/globals';

/**
 * Video-recording sanity spec for `wdio-video-reporter` against the Electron service.
 *
 * `wdio-video-reporter` captures via screenshot stitching: it takes a frame
 * after each command in a configurable allowlist (clicks, navigation, value,
 * keys, etc.). This spec exercises a handful of those so the reporter has
 * frames to stitch into a video. The actual assertions are minimal — the
 * goal is "did the reporter produce a video file?", not "is the app
 * behaving correctly." App-correctness is covered by the standard suite.
 */

describe('video recording sanity — electron-builder', () => {
  it('exercises a few clicks so the reporter has frames to stitch', async () => {
    expect(await browser.getTitle()).toBeTruthy();

    // Each click triggers a frame capture in the reporter's per-command
    // screenshot path, so back-to-back clicks already produce distinct
    // frames — no explicit pauses needed.
    await $('h1').click();
    await $('[data-testid="make-bigger"]').click();
    await $('[data-testid="make-bigger"]').click();
    await $('[data-testid="make-smaller"]').click();

    await browser.waitUntil(async () => (await $('.click-count .bigger').getText()) === '2');
    expect(await $('.click-count .smaller').getText()).toBe('1');
  });
});
