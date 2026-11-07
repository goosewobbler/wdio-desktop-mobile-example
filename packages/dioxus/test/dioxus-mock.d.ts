// withImplementation is on upstream main and not in @wdio/native-types@2.6.1.
// Drop once that release publishes (webdriverio/desktop-mobile#789).
export {};

declare module '@wdio/native-types' {
  interface DioxusMock<TArgs extends unknown[] = unknown[], TReturns = unknown> {
    withImplementation(
      impl: (...args: TArgs) => TReturns | Promise<TReturns>,
      callback: (apis: { invoke: (command: string, ...args: unknown[]) => Promise<unknown> }) => unknown,
    ): Promise<unknown>;
  }
}
