#!/usr/bin/env node

/**
 * Switch catalog dependencies for every workspace package.
 * Usage: node scripts/switch-catalog.ts [default|next|minimum] [--wdio-only]
 *
 * --wdio-only switches webdriverio and @wdio/* that the target catalog defines,
 * and leaves every other dependency (including services the target catalog omits)
 * on whatever catalog it already uses. The v9 and v10 legs therefore run the same
 * service builds.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workspaceFile = path.join(rootDir, 'pnpm-workspace.yaml');

const VALID_CATALOGS = ['default', 'next', 'minimum'] as const;
type CatalogName = (typeof VALID_CATALOGS)[number];

type Catalogs = Record<string, Record<string, string>>;

function sortDependencies(deps: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!deps) {
    return undefined;
  }
  return Object.fromEntries(
    Object.keys(deps)
      .sort()
      .map((key) => [key, deps[key]]),
  );
}

function unquote(value: string): string {
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function readWorkspace(): { packages: string[]; catalogs: Catalogs } {
  const lines = fs.readFileSync(workspaceFile, 'utf8').split('\n');
  const packages: string[] = [];
  const catalogs: Catalogs = {};
  let section: 'packages' | 'catalogs' | undefined;
  let catalogName: string | undefined;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    if (trimmed === 'packages:') {
      section = 'packages';
      catalogName = undefined;
      continue;
    }
    if (trimmed === 'catalogs:') {
      section = 'catalogs';
      continue;
    }
    if (section === 'packages' && line.startsWith('  - ')) {
      packages.push(unquote(trimmed.replace(/^-\s*/, '')));
      continue;
    }
    if (section === 'catalogs' && line.startsWith('  ') && !line.startsWith('    ') && trimmed.endsWith(':')) {
      catalogName = unquote(trimmed.slice(0, -1));
      catalogs[catalogName] = {};
      continue;
    }
    if (section === 'catalogs' && catalogName && line.startsWith('    ') && trimmed.includes(':')) {
      const separator = trimmed.indexOf(':');
      const name = unquote(trimmed.slice(0, separator));
      const spec = unquote(trimmed.slice(separator + 1));
      if (name && spec) {
        catalogs[catalogName][name] = spec;
      }
    }
  }

  return { packages, catalogs };
}

function expandPackageGlobs(patterns: string[]): string[] {
  const expanded = new Set<string>();
  for (const pattern of patterns) {
    if (!pattern.includes('*')) {
      expanded.add(pattern);
      continue;
    }
    const base = pattern.replace(/\/\*+$/, '');
    const baseDir = path.join(rootDir, base);
    if (!fs.existsSync(baseDir)) {
      continue;
    }
    for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        expanded.add(`${base}/${entry.name}`);
      }
    }
  }
  return [...expanded].sort();
}

const isWdioPackage = (dep: string) => dep === 'webdriverio' || dep.startsWith('@wdio/');

function switchDependencies(
  packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> },
  target: CatalogName,
  catalogs: Catalogs,
  wdioOnly: boolean,
): boolean {
  const source = catalogs.default ?? {};
  const depsToSwitch = Object.keys(source)
    .filter((dep) => !wdioOnly || isWdioPackage(dep))
    .filter((dep) => !wdioOnly || catalogs[target]?.[dep])
    .sort();
  let changed = false;

  for (const field of ['devDependencies', 'dependencies'] as const) {
    const deps = packageJson[field];
    if (!deps) {
      continue;
    }
    for (const dep of depsToSwitch) {
      if (!deps[dep]) {
        continue;
      }
      const nextRef = `catalog:${target}`;
      if (deps[dep] !== nextRef) {
        deps[dep] = nextRef;
        changed = true;
      }
    }
  }

  if (changed) {
    packageJson.dependencies = sortDependencies(packageJson.dependencies);
    packageJson.devDependencies = sortDependencies(packageJson.devDependencies);
  }
  return changed;
}

function main(): void {
  const args = process.argv.slice(2);
  const wdioOnly = args.includes('--wdio-only');
  const catalogName = args.find((arg) => !arg.startsWith('--'))?.toLowerCase() as CatalogName | undefined;

  if (!catalogName || !VALID_CATALOGS.includes(catalogName)) {
    console.error(`Error: Please specify a valid catalog: ${VALID_CATALOGS.join(', ')}`);
    process.exit(1);
  }

  const { packages, catalogs } = readWorkspace();
  if (!catalogs[catalogName]) {
    console.error(`Error: Catalog '${catalogName}' is not defined in pnpm-workspace.yaml`);
    process.exit(1);
  }

  console.log(
    `Switching ${wdioOnly ? 'WebdriverIO packages listed in the target catalog' : 'all packages'} to '${catalogName}'...\n`,
  );

  for (const packagePath of expandPackageGlobs(packages)) {
    const packageJsonPath = path.join(rootDir, packagePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.warn(`Warning: No package.json found in ${packagePath}`);
      continue;
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      devDependencies?: Record<string, string>;
      dependencies?: Record<string, string>;
    };
    if (switchDependencies(packageJson, catalogName, catalogs, wdioOnly)) {
      fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
      console.log(`✓ Updated ${packagePath} to use catalog:${catalogName}`);
    } else {
      console.log(`- No changes needed for ${packagePath}`);
    }
  }

  console.log('\nRunning pnpm install to apply the changes...');
  try {
    execSync('pnpm install --no-frozen-lockfile', { cwd: rootDir, stdio: 'inherit' });
    console.log('\n✓ Successfully switched catalog and installed dependencies');
  } catch (error) {
    console.error('\nError running pnpm install:', error);
    process.exit(1);
  }
}

main();
