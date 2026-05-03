import * as fs from 'node:fs';
import * as path from 'node:path';

/** Sleep helper used by the polling helpers below. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Read every .log file in the given output directory (recursively across
 * timestamped subdirs that WDIO creates) and return the concatenated content.
 *
 * Mirrors the trimmed Tauri version at `packages/tauri/test/lib/utils.ts`.
 */
export async function readWdioLogs(logBaseDir: string): Promise<string> {
  if (!fs.existsSync(logBaseDir)) {
    return '';
  }

  const directLogFiles = fs
    .readdirSync(logBaseDir, { withFileTypes: true })
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.log'))
    .map((dirent) => dirent.name)
    .sort();

  if (directLogFiles.length > 0) {
    return readAndConcat(logBaseDir, directLogFiles);
  }

  const subDirs = fs
    .readdirSync(logBaseDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort()
    .reverse();

  if (subDirs.length === 0) {
    return '';
  }

  const logDir = path.join(logBaseDir, subDirs[0]);
  const logFiles = fs
    .readdirSync(logDir)
    .filter((file) => file.endsWith('.log'))
    .sort();
  return readAndConcat(logDir, logFiles);
}

async function readAndConcat(dir: string, files: string[]): Promise<string> {
  let allLogs = '';
  for (const f of files) {
    try {
      const content = await fs.promises.readFile(path.join(dir, f), 'utf8');
      allLogs += `${content}\n`;
    } catch {
      // file may have rolled over mid-read; skip
    }
  }
  return allLogs;
}

/** Return log lines matching `pattern`. */
export function findLogEntries(logs: string, pattern: string | RegExp): string[] {
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
  return logs.split('\n').filter((line) => regex.test(line));
}

/** Throw if `expected` is not present in `logs`. */
export function assertLogContains(logs: string, expected: string | RegExp): void {
  const found = typeof expected === 'string' ? logs.includes(expected) : expected.test(logs);
  if (!found) {
    throw new Error(`Expected log message not found: ${expected}\n\nLogs:\n${logs.slice(0, 1000)}`);
  }
}

/**
 * Poll `logBaseDir` until `pattern` appears in the captured logs (with a
 * small "stable" check so we don't return mid-write). Returns true on match,
 * false on timeout.
 */
export async function waitForLog(
  logBaseDir: string,
  pattern: string | RegExp,
  timeout: number = 10000,
  interval: number = 500,
  settleDelay: number = 2000,
): Promise<boolean> {
  const startTime = Date.now();
  const source = typeof pattern === 'string' ? pattern : pattern.source;
  const flags = typeof pattern === 'string' ? 'i' : pattern.flags.replace('g', '');
  const regex = new RegExp(source, flags);
  let lastLogSize = 0;
  let stableCount = 0;
  const requiredStableChecks = 2;

  while (Date.now() - startTime < timeout) {
    const logs = await readWdioLogs(logBaseDir);
    const currentLogSize = logs.length;

    if (regex.test(logs)) {
      if (currentLogSize === lastLogSize) {
        stableCount++;
        if (stableCount >= requiredStableChecks) {
          const remaining = timeout - (Date.now() - startTime);
          await delay(Math.max(0, Math.min(settleDelay, remaining)));
          return true;
        }
      } else {
        stableCount = 0;
      }
    } else {
      stableCount = 0;
    }

    lastLogSize = currentLogSize;
    await delay(interval);
  }

  return false;
}
