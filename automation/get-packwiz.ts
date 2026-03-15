import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { $ } from 'bun';

export async function getPackwizPath(): Promise<string | null> {
  // 1. Check if packwiz is in the PATH
  try {
    const which = await $`which packwiz`.text();
    if (which.trim()) return 'packwiz';
  } catch {
    // packwiz not in path
  }

  // 2. Check ~/go/bin/packwiz
  const pathsToCheck =
    process.platform === 'win32'
      ? [join(homedir(), 'go/bin/packwiz.exe')]
      : [join(homedir(), 'go/bin/packwiz')];

  for (const path of pathsToCheck) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}
