// Sequentially runs every test/standalone/*.spec.ts via tsx. Each spec is
// a self-contained Node script that calls @wdio/electron-service's
// `startWdioSession` directly — no WDIO testrunner involved.
//
// Cross-platform: invokes `node --import tsx <spec>` rather than the
// `tsx` binary (so we don't need a `.cmd` shim resolved on Windows).
//
// Run sequentially, never in parallel — each spec spawns its own
// chromedriver + Electron pair on a fresh port.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, '..');

const standaloneDir = join(packageRoot, 'test', 'standalone');
if (!existsSync(standaloneDir)) {
  console.error(`Standalone test dir not found: ${standaloneDir}`);
  process.exit(1);
}

const specs = readdirSync(standaloneDir)
  .filter((f) => f.endsWith('.spec.ts'))
  .sort();

if (specs.length === 0) {
  console.warn(`No standalone specs found in ${standaloneDir}`);
  process.exit(0);
}

let lastExit = 0;
for (const spec of specs) {
  const specPath = join(standaloneDir, spec);
  console.log(`\n▶ Standalone run: ${spec}`);
  const result = spawnSync(process.execPath, ['--import', 'tsx', specPath], {
    stdio: 'inherit',
    env: { ...process.env, TEST: 'true' },
    cwd: packageRoot,
  });
  if (result.status !== 0) {
    console.error(`✖ ${spec} exited with code ${result.status}`);
    lastExit = result.status ?? 1;
    break; // stop on first failure to keep ports clean for retry
  }
}

process.exit(lastExit);
