import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

// DEFERRED — excluded from every running wdio config until the Dart-side `wdio_flutter` contract
// publishes to pub.dev. `emitEvent` pushes into the app's `wdioEvents` bus (the app opts in by
// listening to `wdioEvents.stream`), which the stripped fixture doesn't wire. Re-enable: see README.
describe('Flutter emitEvent', () => {
  it('should emit an event the app reflects into the UI', async () => {
    await browser.flutter.emitEvent('greeting', 'hi');
    // The fixture renders `${name}:${jsonEncode(payload)}` — a string payload is JSON-quoted.
    expect(await browser.flutter.byValueKey('lastEvent').getText()).toBe('greeting:"hi"');
  });
});
