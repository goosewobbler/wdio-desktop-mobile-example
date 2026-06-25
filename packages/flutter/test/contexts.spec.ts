import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

// Flutter "windows" are Appium contexts (NATIVE_APP, FLUTTER, WEBVIEW_*). switchContext/listContexts
// is the mobile counterpart of the desktop switchWindow/listWindows. No Dart VM bridge needed.
describe('Flutter contexts', () => {
  it('should list the available contexts including FLUTTER', async () => {
    const contexts = await browser.flutter.listContexts();
    expect(contexts).toContain('FLUTTER');
    expect(contexts).toContain('NATIVE_APP');
  });

  it('should switch between NATIVE_APP and FLUTTER', async () => {
    await browser.flutter.switchContext('NATIVE_APP');
    await browser.flutter.switchContext('FLUTTER');
    // Back in FLUTTER, a widget find actually works — the counter is a numeric string, so assert the
    // digits (not just toBeDefined, which a getText string always satisfies).
    expect(await browser.flutter.byValueKey('counter').getText()).toMatch(/^\d+$/);
  });
});
