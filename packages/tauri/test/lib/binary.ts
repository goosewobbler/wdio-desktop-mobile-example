// Resolve the Tauri app binary path for this package's Cargo workspace
// layout: target/ lives at the workspace root (`packages/tauri/`), not
// `src-tauri/`. Used by the standalone specs because
// `@wdio/tauri-service`'s `getTauriBinaryPath` helper still assumes the
// legacy single-crate layout.
import path from 'node:path';

const PRODUCT_NAME = 'wdio-desktop-mobile-example-tauri';

export function resolveTauriBinaryPath(appDir: string): string {
  const targetDir = path.join(appDir, 'target', 'debug');
  if (process.platform === 'win32') {
    return path.join(targetDir, `${PRODUCT_NAME}.exe`);
  }
  if (process.platform === 'linux') {
    return path.join(targetDir, PRODUCT_NAME.toLowerCase());
  }
  return path.join(targetDir, PRODUCT_NAME);
}
