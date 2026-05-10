import { $, browser, expect } from '@wdio/globals';

/**
 * Video-recording sanity spec for `wdio-video-reporter` against the Electron service.
 * See packages/electron-builder/test/video/video.spec.ts for rationale.
 */

describe('video recording sanity — electron-forge', () => {
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
