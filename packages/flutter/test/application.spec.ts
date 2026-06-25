import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

// Native find/tap over the Appium session (appium-flutter-driver's FLUTTER context) — exercises the
// counter fixture by ValueKey / rendered text. No Dart VM bridge needed, so this runs against the
// stripped fixture without `wdio_flutter`.
describe('Flutter application', () => {
  it('should read a widget by ValueKey and increment via tap', async () => {
    // Assert the increment relative to the current value, not an absolute '0' — the counter persists
    // across spec files in one session, so the starting value depends on spec order.
    const before = Number(await browser.flutter.byValueKey('counter').getText());
    await browser.flutter.byValueKey('increment').tap();
    expect(await browser.flutter.byValueKey('counter').getText()).toBe(String(before + 1));
  });

  it('should find a widget by its rendered text', async () => {
    // Find the counter by whatever text it currently shows (robust to prior increments).
    const current = await browser.flutter.byValueKey('counter').getText();
    expect(await browser.flutter.byText(current).getText()).toBe(current);
  });
});
