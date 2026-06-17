// Sequentially runs every test/standalone/*.spec.ts via tsx.
// Each spec spawns its own Dioxus embedded driver and app process — so they
// MUST run sequentially, never in parallel, to avoid port collisions.
//
// Cross-platform alternative to a per-platform shell wrapper: `tsx` is
// invoked through Node's `--import tsx` loader, so we don't depend on the
// `tsx` binary being on PATH (or its .cmd shim resolving on Windows).
//
// Usage: node ./scripts/run-standalone.mjs

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

const childEnv = {
  ...process.env,
};

let lastExit = 0;
for (const spec of specs) {
  const specPath = join(standaloneDir, spec);
  console.log(`\n▶ Standalone run: ${spec}`);
  const result = spawnSync(process.execPath, ['--import', 'tsx', specPath], {
    stdio: 'inherit',
    env: childEnv,
    cwd: packageRoot,
  });
  if (result.status !== 0) {
    console.error(`✖ ${spec} exited with code ${result.status}`);
    lastExit = result.status ?? 1;
    break; // stop on first failure to keep ports clean for retry
  }
}

process.exit(lastExit);
