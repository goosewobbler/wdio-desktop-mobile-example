import { browser } from '@wdio/globals';
import '@wdio/native-types';

// Run via the dedicated wdio.deeplink.conf.ts (test:deeplink) — excluded from the standard run. The
// fixture does not register a URL scheme handler, so this is trigger-only: it asserts triggerDeeplink
// (Appium `mobile: deepLink`) resolves without throwing, the mobile analogue of the desktop deeplink
// smoke. A scheme-handling fixture + assertion is a fast-follow.
describe('React Native deeplink', () => {
  it('should trigger a deeplink without throwing', async () => {
    await browser.reactNative.triggerDeeplink('reactnativee2eapp://home');
  });
});
