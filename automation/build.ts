import { $ } from 'bun';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, rmSync, cpSync } from 'node:fs';
import ora from 'ora';
import * as colors from 'yoctocolors';
import { consola } from 'consola';

// Directories
const ROOT_DIR = join(import.meta.dir, '../');
const INSTANCE_DIR = join(ROOT_DIR, 'instance');
const DOWNLOADS_DIR = join(ROOT_DIR, 'downloads');
const INDEX_PATH = join(ROOT_DIR, 'index.toml');

// Folders to sync from ROOT to INSTANCE
const STATIC_FOLDERS = ['config', 'defaultconfigs', 'kubejs'];

interface PackwizFile {
  file: string;
  metafile: boolean;
}

function parseIndexToml(tomlContent: string): PackwizFile[] {
  const files: PackwizFile[] = [];
  const fileBlocks = tomlContent.split('[[files]]');

  for (let i = 1; i < fileBlocks.length; i++) {
    const block = fileBlocks[i];
    if (!block) continue;
    const fileMatch = block.match(/file\s*=\s*"([^"]+)"/);
    const metafileMatch = block.match(/metafile\s*=\s*(true|false)/);
    if (fileMatch && fileMatch[1]) {
      files.push({
        file: fileMatch[1],
        metafile:
          metafileMatch && metafileMatch[1]
            ? metafileMatch[1] === 'true'
            : false,
      });
    }
  }
  return files;
}

async function verifyHash(
  filePath: string,
  expectedHash: string,
  algorithm: 'sha1' | 'sha256' | 'sha512',
): Promise<boolean> {
  try {
    const fileBuffer = await Bun.file(filePath).arrayBuffer();
    const hasher = new Bun.CryptoHasher(algorithm);
    hasher.update(fileBuffer);
    const computedHash = hasher.digest('hex');
    return computedHash === expectedHash;
  } catch (err) {
    consola.error(colors.red(`Hash verification error: ${err}`));
    return false;
  }
}

async function syncPackwizAssets(useAria2: boolean) {
  const spinner = ora(colors.cyan('Syncing Packwiz Managed Assets...')).start();

  const indexRaw = readFileSync(INDEX_PATH, 'utf-8');
  const files = parseIndexToml(indexRaw);

  const metaFiles = files.filter(
    (f) =>
      f.metafile &&
      (f.file.startsWith('mods/') ||
        f.file.startsWith('shaderpacks/') ||
        f.file.startsWith('resourcepacks/')),
  );

  let successCount = 0;

  for (const mod of metaFiles) {
    const modTomlPath = join(ROOT_DIR, mod.file);
    if (!existsSync(modTomlPath)) continue;

    const modTomlContent = readFileSync(modTomlPath, 'utf-8');
    const filenameMatch = modTomlContent.match(/filename\s*=\s*"([^"]+)"/);

    const urlMatch = modTomlContent.match(/url\s*=\s*"([^"]+)"/);
    let downloadUrl = urlMatch ? urlMatch[1] : null;

    if (!downloadUrl) {
      const fileIdMatch = modTomlContent.match(/file-id\s*=\s*([0-9]+)/);
      if (fileIdMatch && fileIdMatch[1]) {
        const fileIdStr = fileIdMatch[1];
        if (fileIdStr.length >= 4) {
          const part1 = fileIdStr.substring(0, 4);
          const part2 = fileIdStr.substring(4);
          const filenameObj = filenameMatch?.[1] || '';
          downloadUrl = `https://edge.forgecdn.net/files/${part1}/${part2}/${filenameObj}`;
        }
      }
    }

    let fileHash = '';
    let fileHashAlgo: 'sha1' | 'sha256' | 'sha512' = 'sha1';
    const downloadBlock = modTomlContent.match(/\[download\][^[]*/);
    if (downloadBlock) {
      const hashFormatMatch = downloadBlock[0].match(
        /hash-format\s*=\s*"([^"]+)"/,
      );
      const hashMatch = downloadBlock[0].match(/hash\s*=\s*"([^"]+)"/);
      if (hashMatch && hashMatch[1] && hashFormatMatch && hashFormatMatch[1]) {
        fileHash = hashMatch[1].trim();
        fileHashAlgo = hashFormatMatch[1].trim() as
          | 'sha1'
          | 'sha256'
          | 'sha512';
      }
    }

    const filename = filenameMatch?.[1];
    if (filename && downloadUrl) {
      const subfolder = mod.file.split('/')[0] as string;
      const cacheDir = join(DOWNLOADS_DIR, subfolder);
      const cachePath = join(cacheDir, filename);
      const targetDir = join(INSTANCE_DIR, subfolder);
      const targetPath = join(targetDir, filename);

      if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
      if (!existsSync(targetDir)) mkdirSync(targetDir, { recursive: true });

      // Step 1: Check cache
      let cachedAndVerified = false;
      if (existsSync(cachePath)) {
        if (fileHash) {
          const isValid = await verifyHash(cachePath, fileHash, fileHashAlgo);
          if (isValid) {
            cachedAndVerified = true;
          } else {
            spinner.warn(
              colors.yellow(
                `[CACHE MISMATCH] ${filename} hash failed. Redownloading...`,
              ),
            );
            rmSync(cachePath);
          }
        } else {
          cachedAndVerified = true;
        }
      }

      // Step 2: Download if not in cache
      if (!cachedAndVerified) {
        spinner.text = colors.cyan(`Downloading ${filename}...`);
        try {
          if (useAria2) {
            await $`aria2c -x 16 -s 16 -d ${cacheDir} -o ${filename} "${downloadUrl}"`.quiet();
          } else {
            const response = await fetch(downloadUrl);
            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);
            const buffer = await response.arrayBuffer();
            await Bun.write(cachePath, buffer);
          }

          if (fileHash) {
            const isValid = await verifyHash(cachePath, fileHash, fileHashAlgo);
            if (!isValid) {
              spinner.fail(
                colors.red(`[ERROR] ${filename} hash verification failed!`),
              );
              rmSync(cachePath);
              continue;
            }
          }
        } catch (err) {
          spinner.fail(
            colors.red(`[ERROR] Failed to download ${filename}: ${err}`),
          );
          continue;
        }
      }

      // Step 3: Copy from cache to instance
      if (!existsSync(targetPath)) {
        cpSync(cachePath, targetPath);
      }
      successCount++;
    }
  }
  spinner.succeed(
    colors.green(`Packwiz sync completed! (${successCount} files)`),
  );
}

function syncLocalFolders() {
  const spinner = ora(colors.cyan('Syncing Local Project Folders...')).start();
  let syncCount = 0;
  for (const folder of STATIC_FOLDERS) {
    const source = join(ROOT_DIR, folder);
    const target = join(INSTANCE_DIR, folder);

    if (existsSync(source)) {
      if (!existsSync(target)) mkdirSync(target, { recursive: true });

      // Perform recursive copy
      cpSync(source, target, { recursive: true, force: true });
      syncCount++;
    }
  }
  spinner.succeed(colors.green(`Local folders synced! (${syncCount} folders)`));
}

export async function build() {
  consola.info(colors.bold(colors.magenta('OneOne Instance Build Process')));

  if (!existsSync(INSTANCE_DIR)) {
    mkdirSync(INSTANCE_DIR, { recursive: true });
  }

  if (!existsSync(DOWNLOADS_DIR)) {
    mkdirSync(DOWNLOADS_DIR, { recursive: true });
  }

  // Check aria2c
  let useAria2 = false;
  try {
    const req = await $`command -v aria2c`.quiet();
    if (req.exitCode === 0) useAria2 = true;
  } catch {
    // aria2c not found
  }

  if (useAria2) consola.info(colors.dim('Fast download mode (aria2c) active'));

  // 1. Clear instance subfolders
  const cleaningSpinner = ora(
    colors.cyan('Cleaning instance subfolders...'),
  ).start();
  const foldersToClear = ['mods', 'shaderpacks', 'resourcepacks'];
  for (const folder of foldersToClear) {
    const target = join(INSTANCE_DIR, folder);
    if (existsSync(target)) {
      rmSync(target, { recursive: true, force: true });
    }
    mkdirSync(target, { recursive: true });
  }
  cleaningSpinner.succeed(colors.green('Cleanup completed!'));

  // 2. Sync assets from Packwiz
  await syncPackwizAssets(useAria2);

  // 3. Sync local project folders
  syncLocalFolders();

  consola.success(
    colors.bold(colors.green('Instance build completed successfully!')),
  );
}

if (import.meta.main) {
  build().catch((err) => {
    consola.error(colors.red(`\nBuild failed: ${err}`));
    process.exit(1);
  });
}
