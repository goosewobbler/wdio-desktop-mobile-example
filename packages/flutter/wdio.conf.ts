import type { Options } from '@wdio/types';
import {
  appiumService,
  baseConfig,
  buildFlutterCapability,
  flutterService,
  logsDir,
  pageSourceAfterTest,
} from './wdio.base.conf.ts';

const outputDir = logsDir('standard');

export const config: Options.Testrunner = {
  ...baseConfig,
  specs: ['./test/**/*.spec.ts'],
  exclude: [
    './test/deeplink.spec.ts', // covered by wdio.deeplink.conf.ts
    './test/contexts.spec.ts', // covered by wdio.contexts.conf.ts
    // Deferred until the Dart-side `wdio_flutter` contract publishes to pub.dev — these drive the
    // Dart VM bridge (execute → wdioHandlers, mock → wdioRegistry, emitEvent → wdioEvents, log
    // forwarding → VM Service), which the stripped fixture doesn't wire. Re-enable: see README.
    './test/execute.spec.ts',
    './test/mocking.spec.ts',
    './test/emitEvent.spec.ts',
    './test/logging.spec.ts',
  ],
  capabilities: [buildFlutterCapability()],
  services: [appiumService(outputDir), flutterService()],
  outputDir,
  afterTest: pageSourceAfterTest(outputDir),
};
