#!/usr/bin/env node
/**
 * Build the React Native fixture app for a target platform.
 *
 * Mobile diverges from the desktop archetypes: there's no Rust/binary the service launches —
 * Appium installs and launches a *native app artifact* (an Android debug APK or an iOS simulator
 * `.app`). The native `android/`/`ios/` projects are large and toolchain-specific, so (mirroring
 * upstream) they are NOT committed. This script scaffolds a fresh RN project into the gitignored
 * `.rn-build/` with `@react-native-community/cli`, overlays the committed source from `app/`
 * (App.tsx / index.js / app.json), and builds the **debug** artifact — debug is mandatory, the
 * Hermes inspector that `execute`/`mock` attach to is only present in debug/Metro builds.
 *
 * Usage:  node ./scripts/build-app.mjs [android|ios]
 *   - Platform also reads from RN_PLATFORM (arg wins); defaults to android.
 *   - RN_APP_PATH set (CI) → no-op: CI builds the artifact in a dedicated workflow step and points
 *     the WDIO config straight at it, so this stays a cheap, idempotent dependency for `turbo build`.
 *   - RN_CLI_VERSION overrides the CLI major (defaults to the version matched to react-native).
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, globSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const appSrc = join(root, 'app');
const buildDir = join(root, '.rn-build');

const platform = (process.argv[2] ?? process.env.RN_PLATFORM ?? 'android').toLowerCase();
if (platform !== 'android' && platform !== 'ios') {
  console.error(`Unsupported platform '${platform}'. Use 'android' or 'ios'.`);
  process.exit(1);
}

const appName = JSON.parse(readFileSync(join(appSrc, 'app.json'), 'utf-8')).name;
// app/package.json is the single source of truth for the fixture's RN + CLI versions — read by both
// this script and the CI scaffold steps, so a version bump only happens in one place.
const appPkg = JSON.parse(readFileSync(join(appSrc, 'package.json'), 'utf-8'));
const rnVersion = appPkg.dependencies['react-native'];
const cliVersion = process.env.RN_CLI_VERSION ?? appPkg.devDependencies['@react-native-community/cli'];

const artifactGlob =
  platform === 'ios'
    ? join(buildDir, 'ios', 'build', 'Build', 'Products', 'Debug-iphonesimulator', '*.app')
    : join(buildDir, 'android', 'app', 'build', 'outputs', 'apk', 'debug', '*.apk');

const run = (cmd, args, cwd = root) => {
  console.log(`\n$ ${cmd} ${args.join(' ')}  (cwd: ${cwd})`);
  execFileSync(cmd, args, { cwd, stdio: 'inherit' });
};

// CI builds the artifact itself and exports RN_APP_PATH; nothing to do here.
if (process.env.RN_APP_PATH) {
  console.log(`RN_APP_PATH is set (${process.env.RN_APP_PATH}); skipping local build.`);
  process.exit(0);
}

// Idempotent for `turbo build`: if the artifact already exists, don't rebuild.
if (globSync(artifactGlob).length > 0) {
  console.log(`Artifact already present for ${platform}: ${globSync(artifactGlob)[0]}`);
  process.exit(0);
}

// 1. Scaffold the native project (skip if a prior scaffold is present — `pnpm clean` to redo).
if (!existsSync(join(buildDir, 'package.json'))) {
  console.log(`Scaffolding React Native ${rnVersion} project into .rn-build/ …`);
  run('npx', [
    '--yes',
    `@react-native-community/cli@${cliVersion}`,
    'init',
    appName,
    '--version',
    rnVersion,
    '--directory',
    buildDir,
    '--skip-git-init',
    '--pm',
    'npm',
    '--install-pods',
    'false',
  ]);
}

// 2. Overlay the committed fixture source onto the scaffold (so app/ is the source of truth —
// the scaffold's generated metro/babel configs are replaced by ours, even though they're
// near-identical noop wrappers around the RN defaults today).
for (const f of ['App.tsx', 'index.js', 'app.json', 'metro.config.js', 'babel.config.js']) {
  cpSync(join(appSrc, f), join(buildDir, f));
}

// 3. Build the debug artifact.
if (platform === 'android') {
  run('./gradlew', ['assembleDebug', '--no-daemon'], join(buildDir, 'android'));
} else {
  run('pod', ['install'], join(buildDir, 'ios'));
  run(
    'xcodebuild',
    [
      '-workspace',
      `${appName}.xcworkspace`,
      '-scheme',
      appName,
      '-configuration',
      'Debug',
      '-sdk',
      'iphonesimulator',
      '-derivedDataPath',
      'build',
      'CODE_SIGNING_ALLOWED=NO',
    ],
    join(buildDir, 'ios'),
  );
}

const built = globSync(artifactGlob);
if (built.length === 0) {
  console.error(`Build finished but no artifact matched ${artifactGlob}`);
  process.exit(1);
}
console.log(`\n✅ Built ${platform} artifact: ${built[0]}`);
