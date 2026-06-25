import { browser } from '@wdio/globals';
import '@wdio/native-types';

// Run via the dedicated wdio.deeplink.conf.ts (test:deeplink) — excluded from the standard run. The
// fixture registers no custom URL scheme, so this is trigger-only: it asserts triggerDeeplink (Appium
// `mobile: deepLink`, switching to NATIVE_APP first) drives the native command path without throwing.
// A scheme-handling fixture + assertion is a fast-follow. No Dart VM bridge needed.
describe('Flutter deeplink', () => {
  it('should trigger a deeplink without throwing', async () => {
    await browser.flutter.triggerDeeplink('wdioflutter://open/profile');
  });
});
