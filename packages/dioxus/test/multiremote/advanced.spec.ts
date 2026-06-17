import { expect, multiRemoteBrowser } from '@wdio/globals';
import '@wdio/native-types';

describe('Dioxus Multiremote - Advanced Patterns', () => {
  it('should execute different commands on different instances', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    const [resultA, resultB] = await Promise.all([
      browserA.dioxus.execute(({ invoke }) => invoke('get_platform_info')),
      browserB.dioxus.execute(() => 1 + 1),
    ]);

    expect(resultA).toHaveProperty('os');
    expect(resultA).toHaveProperty('arch');
    expect(resultB).toBe(2);
  });

  it('should handle sequential execution in multiremote', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    const resultA = (await browserA.dioxus.execute(() => Date.now())) as number;
    await new Promise((resolve) => setTimeout(resolve, 100));
    const resultB = (await browserB.dioxus.execute(() => Date.now())) as number;

    expect(resultB).toBeGreaterThan(resultA);

    const now = Date.now();
    expect(now - resultA).toBeLessThan(10000);
    expect(now - resultB).toBeLessThan(10000);
  });
});
