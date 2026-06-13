#!/usr/bin/env node

/**
 * Script to switch catalog dependencies for all packages in the workspace
 * Usage: pnpx tsx scripts/switch-catalog.ts [default|next]
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const workspaceFile = path.join(rootDir, 'pnpm-workspace.yaml');

// Valid catalog names
const VALID_CATALOGS = ['default', 'next', 'minimum'] as const;
type CatalogName = (typeof VALID_CATALOGS)[number];

// Function to sort dependencies alphabetically
function sortDependencies(deps: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!deps) return undefined;
  return Object.keys(deps)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = deps[key];
        return acc;
      },
      {} as Record<string, string>,
    );
}

// Read workspace YAML to get catalog dependencies and package paths
const workspaceContent = fs.readFileSync(workspaceFile, 'utf8');
const workspaceLines = workspaceContent.split('\n');
let inCatalogs = false;
let inFirstCatalog = false;
let inPackages = false;
const CATALOG_DEPENDENCIES = new Set<string>();
const WORKSPACE_PACKAGES = new Set<string>();

// Parse the workspace YAML to get dependencies from first catalog and package paths
for (const line of workspaceLines) {
  const trimmedLine = line.trim();

  if (trimmedLine === 'packages:') {
    inPackages = true;
    inCatalogs = false;
    continue;
  }

  if (trimmedLine === 'catalogs:') {
    inCatalogs = true;
    inPackages = false;
    continue;
  }

  if (inPackages && line.startsWith('  - ')) {
    const packagePath = line.trim().replace(/^-\s*['"]|['"]$/g, '');
    WORKSPACE_PACKAGES.add(packagePath);
    continue;
  }

  if (inCatalogs && line.startsWith('  ') && !line.startsWith('    ')) {
    // We found a new catalog section
    if (inFirstCatalog) {
      // We've already processed the first catalog, so we can stop
      break;
    }
    // This is the first catalog we've found
    inFirstCatalog = true;
    continue;
  }

  if (inFirstCatalog && line.startsWith('    ')) {
    const [packagePart] = line.split(':').map((part) => part.trim());
    if (packagePart) {
      // Strip apostrophes from package names
      const cleanPackageName = packagePart.replace(/^['"]|['"]$/g, '');
      CATALOG_DEPENDENCIES.add(cleanPackageName);
    }
  }
}

// Expand `packages/*`-style globs (pnpm's workspace syntax) into concrete
// package directories. Without this the entries are treated as literal paths
// and nothing gets rewritten.
function expandPackageGlobs(patterns: string[]): string[] {
  const expanded = new Set<string>();
  for (const pattern of patterns) {
    if (!pattern.includes('*')) {
      expanded.add(pattern);
      continue;
    }
    const base = pattern.replace(/\/\*+$/, '');
    const baseDir = path.join(rootDir, base);
    if (!fs.existsSync(baseDir)) continue;
    for (const entry of fs.readdirSync(baseDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        expanded.add(`${base}/${entry.name}`);
      }
    }
  }
  return expanded;
}

// Convert Sets to arrays and sort for consistent ordering
const CATALOG_DEPENDENCIES_ARRAY = Array.from(CATALOG_DEPENDENCIES).sort();
const WORKSPACE_PACKAGES_ARRAY = Array.from(expandPackageGlobs(Array.from(WORKSPACE_PACKAGES))).sort();

// Handle CLI arguments
const catalogName = process.argv[2]?.toLowerCase() as CatalogName | undefined;

if (!catalogName || !VALID_CATALOGS.includes(catalogName)) {
  console.error(`Error: Please specify a valid catalog: ${VALID_CATALOGS.join(', ')}`);
  process.exit(1);
}

try {
  console.log(`Switching all packages to '${catalogName}' catalog...\n`);

  // Process each package's package.json
  for (const packagePath of WORKSPACE_PACKAGES_ARRAY) {
    const packageJsonPath = path.join(rootDir, packagePath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.warn(`Warning: No package.json found in ${packagePath}`);
      continue;
    }

    // Read and parse the package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      devDependencies?: Record<string, string>;
      dependencies?: Record<string, string>;
    };
    let changed = false;

    // Handle catalog transitions for both devDependencies and dependencies
    for (const dep of CATALOG_DEPENDENCIES_ARRAY) {
      // Check devDependencies
      if (packageJson.devDependencies?.[dep]) {
        packageJson.devDependencies[dep] = `catalog:${catalogName}`;
        changed = true;
      }

      // Check dependencies
      if (packageJson.dependencies?.[dep]) {
        packageJson.dependencies[dep] = `catalog:${catalogName}`;
        changed = true;
      }
    }

    if (changed) {
      // Sort dependencies alphabetically
      packageJson.dependencies = sortDependencies(packageJson.dependencies);
      packageJson.devDependencies = sortDependencies(packageJson.devDependencies);

      // Write the updated package.json
      fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
      console.log(`✓ Updated ${packagePath} to use catalog:${catalogName}`);
    } else {
      console.log(`- No changes needed for ${packagePath}`);
    }
  }

  console.log('\nRunning pnpm install to apply the changes...');
  try {
    // The rewrite above intentionally desyncs the lockfile, so the install must
    // be allowed to update it. In CI (`CI=true`) a bare `pnpm install` defaults
    // to --frozen-lockfile and would fail here.
    execSync('pnpm install --no-frozen-lockfile', { stdio: 'inherit' });
    console.log('\n✓ Successfully switched catalog and installed dependencies');
  } catch (error) {
    console.error('\nError running pnpm install:', error);
    process.exit(1);
  }
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
