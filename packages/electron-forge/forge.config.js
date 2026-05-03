import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const icon = path.join(__dirname, 'src', 'assets', 'icon', 'webdriverio');

const config = {
  packagerConfig: {
    // Strip the workspace scope from the binary name so the resulting
    // out/<name>-darwin-arm64/<name>.app structure is something
    // @wdio/electron-service's getBinaryPath() can find.
    name: 'electron-forge-e2e-app',
    ignore: /node_modules/,
    asar: true,
    icon,
    osxSign: false,
  },
  rebuildConfig: {},
  makers: [],
  plugins: [],
};

export default config;
