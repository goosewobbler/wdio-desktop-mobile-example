/**
 * Deeplink testing helpers — used by test/deeplink.spec.ts.
 *
 * Trimmed from the upstream `e2e/lib/deeplink.ts`. The accessor pattern lets
 * the same helper power Electron's `browser.electron` and Tauri's
 * `browser.tauri` execute contexts.
 */

import { browser } from '@wdio/globals';

type ContextAccessor = () => {
  execute<T>(fn: (context: unknown) => T | undefined): Promise<T | undefined>;
};

export function createDeeplinkHelpers(contextAccessor: ContextAccessor) {
  const getContext = contextAccessor;

  async function waitForDeeplink(expectedCount = 1, timeoutMsg = 'App did not receive the deeplink') {
    const ctx = getContext();
    await browser.waitUntil(
      async () => {
        const count = (await ctx.execute(() => (globalThis as { deeplinkCount?: number }).deeplinkCount)) ?? 0;
        return count >= expectedCount;
      },
      { timeout: 30000, timeoutMsg },
    );
  }

  async function waitForDeeplinkStability() {
    const ctx = getContext();
    let previousCount = (await ctx.execute(() => (globalThis as { deeplinkCount?: number }).deeplinkCount)) ?? 0;

    await browser.waitUntil(
      async () => {
        // Wall-clock pause between samples — eslint-plugin-wdio bans
        // browser.pause() so use a plain timer.
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
        const currentCount = (await ctx.execute(() => (globalThis as { deeplinkCount?: number }).deeplinkCount)) ?? 0;
        const isStable = currentCount === previousCount;
        previousCount = currentCount;
        return isStable;
      },
      { timeout: 5000, timeoutMsg: 'Deeplink state did not stabilize' },
    );
  }

  async function clearDeeplinkState() {
    const ctx = getContext();
    await ctx.execute(() => {
      (globalThis as { receivedDeeplinks?: string[] }).receivedDeeplinks = [];
      (globalThis as { deeplinkCount?: number }).deeplinkCount = 0;
    });
  }

  return { waitForDeeplink, waitForDeeplinkStability, clearDeeplinkState };
}
