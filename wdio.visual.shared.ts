import type { Options } from '@wdio/types';

/**
 * Wrap a base wdio testrunner config to scope it to visual specs only.
 *
 * Visual specs live under each package's `test/visual/**` and are excluded
 * from that package's standard config(s) so the matrices remain independent.
 * Each `wdio.<...>.visual.conf.ts` composes from its non-visual sibling and
 * delegates the spec-list reshaping here, which is provider- and
 * package-agnostic.
 */
export function asVisualConfig(base: Options.Testrunner): Options.Testrunner {
  return {
    ...base,
    specs: ['./test/visual/**/*.spec.ts'],
    exclude: [],
  };
}
