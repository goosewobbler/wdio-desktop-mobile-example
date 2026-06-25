import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

import { currentLogDir, readWdioLogs } from './lib/utils.js';

// DEFERRED — excluded from every running wdio config until the Dart-side `wdio_flutter` contract
// publishes to pub.dev. Log forwarding is driven here via `execute` (the Dart VM Service bridge),
// which the stripped fixture doesn't expose. Re-enable: see the package README. (Mirrors the React
// Native package's logging spec, Flutter-flavoured — the assertion may need tuning against the
// shipped log-capture behaviour when re-enabled.)
//
// The standard run writes into logs/standard/ (wdio.conf.ts outputDir).
const getLogDir = () => currentLogDir('standard');

describe('Flutter logging', () => {
  it('should forward captured device logs into the WDIO output (backend capture)', async () => {
    // Drive the app via a registered handler so the session produces activity, then assert the
    // service forwarded the device log channel into the run's WDIO output dir.
    const marker = await browser.flutter.execute('marker');
    expect(marker).toBe('wdio-flutter-fixture');
    await browser.waitUntil(async () => (await readWdioLogs(getLogDir())).length > 0, {
      timeout: 15000,
      interval: 500,
      timeoutMsg: 'no captured logs found in the WDIO output',
    });
  });
});
