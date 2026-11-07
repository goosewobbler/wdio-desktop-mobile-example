// @wdio/native-utils@2.8.1 does not export this. Drop once a release publishes it
// (webdriverio/desktop-mobile release:prerelease, #789).
declare module '@wdio/native-utils' {
  export function isMultiremote(session: { isMultiremote?: boolean; isMultiRemote?: boolean }): boolean;
}
