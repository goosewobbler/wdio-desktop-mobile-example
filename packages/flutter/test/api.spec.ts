import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

// Surface-presence checks for the converged browser.flutter.* API. These are client-side (no Dart VM
// bridge), so they run against the stripped fixture without `wdio_flutter`. The runtime behaviour of
// execute/mock is covered by the deferred execute.spec.ts / mocking.spec.ts.
describe('Flutter API', () => {
  it('should expose the browser.flutter surface', () => {
    expect(browser.flutter).toBeDefined();
    expect(typeof browser.flutter.execute).toBe('function');
    expect(typeof browser.flutter.mock).toBe('function');
    expect(typeof browser.flutter.byValueKey).toBe('function');
    expect(typeof browser.flutter.byText).toBe('function');
    expect(typeof browser.flutter.switchContext).toBe('function');
    expect(typeof browser.flutter.listContexts).toBe('function');
  });

  it('should report isMockFunction false for a non-mocked target', () => {
    expect(browser.flutter.isMockFunction('not.a.mock')).toBe(false);
  });
});
