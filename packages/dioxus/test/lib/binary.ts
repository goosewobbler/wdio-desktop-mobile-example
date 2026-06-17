// Resolve the Dioxus app binary path for this package's Cargo workspace
// layout: target/ lives at the workspace root (`packages/dioxus/`), with
// the package's Cargo.toml and src/ at the same level.
import path from 'node:path';

const PRODUCT_NAME = 'wdio-dioxus-e2e-app';

export function resolveDioxusBinaryPath(appDir: string): string {
  const targetDir = path.join(appDir, 'target', 'debug');
  if (process.platform === 'win32') {
    return path.join(targetDir, `${PRODUCT_NAME}.exe`);
  }
  // Binary name is already lowercase — no case conversion needed
  return path.join(targetDir, PRODUCT_NAME);
}
