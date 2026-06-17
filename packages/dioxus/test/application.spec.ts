import { browser, expect } from '@wdio/globals';
import '@wdio/native-types';

describe('Dioxus application', () => {
  it('should launch the application', async () => {
    const title = await browser.getTitle();
    expect(title).toMatch(/WDIO Dioxus E2E App/);
  });

  it('should pass args through to the launched application', async () => {
    // Custom args are set in wdio.base.conf.ts via the capability builder.
    // On Windows, msedgedriver treats args as Chrome switches and prepends '--'
    // to each one, so accept either form.
    const args = (await browser.dioxus.execute(({ invoke }) => invoke('get_command_line_args'))) as string[];
    const hasFoo = args.some((arg) => arg === 'foo' || arg === '--foo');
    const hasBar = args.some((arg) => arg === 'bar=baz' || arg === '--bar=baz');
    expect(hasFoo).toBe(true);
    expect(hasBar).toBe(true);
  });
});
