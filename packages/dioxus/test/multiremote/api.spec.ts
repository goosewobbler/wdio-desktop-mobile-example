import { expect, multiRemoteBrowser } from '@wdio/globals';
import '@wdio/native-types';

function assertHasOwnProperty<Property extends PropertyKey>(
  value: unknown,
  property: Property,
): asserts value is Record<Property, unknown> {
  if (typeof value !== 'object' || value === null || !Object.hasOwn(value, property)) {
    throw new Error(`Expected property ${String(property)} to exist on value`);
  }
}

describe('Dioxus APIs using Multiremote', () => {
  it('should retrieve platform info through the Dioxus API on multiple instances', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    const [resultA, resultB] = await Promise.all([
      browserA.dioxus.execute(({ invoke }) => invoke('get_platform_info')),
      browserB.dioxus.execute(({ invoke }) => invoke('get_platform_info')),
    ]);
    assertHasOwnProperty(resultA, 'os');
    assertHasOwnProperty(resultB, 'os');
    assertHasOwnProperty(resultA, 'arch');
    assertHasOwnProperty(resultB, 'arch');
    expect(resultA.os).toBe(resultB.os); // Same OS for both instances
  });

  it('should execute commands independently on multiple instances', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    // Both instances should be able to execute concurrently without interference
    const [resultA, resultB] = await Promise.all([
      browserA.dioxus.execute(({ invoke }) => invoke('get_platform_info')),
      browserB.dioxus.execute(({ invoke }) => invoke('get_platform_info')),
    ]);

    assertHasOwnProperty(resultA, 'os');
    assertHasOwnProperty(resultB, 'os');
    assertHasOwnProperty(resultA, 'arch');
    assertHasOwnProperty(resultB, 'arch');

    expect(typeof resultA.os).toBe('string');
    expect(typeof resultB.os).toBe('string');
  });

  it('should retrieve instance-specific values from each instance', async () => {
    const multi = multiRemoteBrowser as unknown as WebdriverIO.MultiRemoteBrowser;
    const browserA = multi.getInstance('browserA');
    const browserB = multi.getInstance('browserB');

    const [resultA, resultB] = await Promise.all([
      browserA.dioxus.execute(({ invoke }) => invoke('get_platform_info')),
      browserB.dioxus.execute(({ invoke }) => invoke('get_platform_info')),
    ]);

    assertHasOwnProperty(resultA, 'os');
    assertHasOwnProperty(resultB, 'os');
    expect(resultA.os).toBe(resultB.os); // Same OS for both instances

    assertHasOwnProperty(resultA, 'arch');
    assertHasOwnProperty(resultB, 'arch');
  });
});
