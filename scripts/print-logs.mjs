#!/usr/bin/env node
// Dumps every *.log under ./logs for the "Show Test Logs on Failure" CI step.
// Replaces a POSIX `if [ -d ./logs ]; then find ... fi` one-liner that failed
// outright on Windows runners, so those jobs discarded their logs entirely.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const LOGS_DIR = 'logs';

let entries;
try {
  entries = await readdir(LOGS_DIR, { recursive: true, withFileTypes: true });
} catch {
  console.log('No logs directory found');
  process.exit(0);
}

const files = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith('.log'))
  .map((entry) => join(entry.parentPath ?? entry.path, entry.name))
  .sort();

if (files.length === 0) {
  console.log('No log files found');
  process.exit(0);
}

for (const file of files) {
  console.log(`=== ./${relative('.', file).split(sep).join('/')} ===`);
  try {
    console.log(await readFile(file, 'utf8'));
  } catch (error) {
    console.log(`<could not read: ${error.message}>`);
  }
}
