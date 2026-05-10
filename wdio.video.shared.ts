import type { Options, Reporters } from '@wdio/types';

/**
 * Wrap a base wdio testrunner config to scope it to video-recording specs only,
 * with `wdio-video-reporter` registered.
 *
 * Note on the `VideoReporter` argument: this helper lives at the workspace
 * root, where `wdio-video-reporter` is not installed (it's a per-package
 * devDep). The per-package `wdio.<...>.video.conf.ts` imports the reporter
 * (where the package IS installed) and passes the class through.
 *
 * `saveAllVideos: true` is intentional for the spike — we want every cell of
 * the matrix to produce an artefact so we can verify the recorder works on
 * each platform/provider, not just on failures. For real downstream use
 * `saveAllVideos: false` (the default) is friendlier — it only retains video
 * for failing tests, mirroring Playwright's `retain-on-failure`.
 *
 * Note: there's a known reporter bug (#862) where the process can hang on
 * exit with `saveAllVideos: true` on dynamic sites. Watch for this; if it
 * bites the matrix we'll have to switch to per-failure recording and rely on
 * a deliberately-failing spec to verify the path.
 */
export function asVideoConfig(
  base: Options.Testrunner,
  outputDir: string,
  VideoReporter: Reporters.ReporterClass,
): Options.Testrunner {
  return {
    ...base,
    specs: ['./test/video/**/*.spec.ts'],
    exclude: [],
    reporters: [
      ...(base.reporters ?? ['spec']),
      [
        VideoReporter,
        {
          outputDir,
          saveAllVideos: true,
          videoSlowdownMultiplier: 3,
        },
      ],
    ],
  };
}
