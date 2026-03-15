import { join } from 'node:path';
import {
  existsSync,
  renameSync,
  symlinkSync,
  lstatSync,
  mkdirSync,
  rmSync,
} from 'node:fs';
import { homedir } from 'node:os';

// Configuration
const PRISM_INSTANCE_PATH =
  process.platform === 'win32'
    ? join(
        homedir(),
        'AppData/Roaming/PrismLauncher/instances/OneOne Dev/minecraft/',
      )
    : join(
        homedir(),
        '.local/share/PrismLauncher/instances/OneOne Dev/minecraft/',
      );
const PROJECT_INSTANCE_PATH = join(import.meta.dir, '../instance');

// Folders to link
const FOLDERS_TO_LINK = ['mods', 'config', 'resourcepacks', 'shaderpacks'];

async function linkPrism() {
  console.log('🔗 Starting Prism Launcher Linking Automation...');
  console.log(`Target: ${PRISM_INSTANCE_PATH}`);

  if (!existsSync(PROJECT_INSTANCE_PATH)) {
    console.log('Creating project instance directory...');
    mkdirSync(PROJECT_INSTANCE_PATH, { recursive: true });
  }

  if (!existsSync(PRISM_INSTANCE_PATH)) {
    console.error(
      `❌ Error: Prism instance path not found: ${PRISM_INSTANCE_PATH}`,
    );
    console.log(
      "Please make sure the instance 'OneOne Dev' exists in Prism Launcher.",
    );
    process.exit(1);
  }

  for (const folder of FOLDERS_TO_LINK) {
    const source = join(PROJECT_INSTANCE_PATH, folder);
    const target = join(PRISM_INSTANCE_PATH, folder);

    // Ensure source exists in project (even if empty)
    if (!existsSync(source)) {
      mkdirSync(source, { recursive: true });
    }

    if (existsSync(target)) {
      const stats = lstatSync(target);

      if (stats.isSymbolicLink()) {
        console.log(`[SKIP] ${folder} is already a symbolic link.`);
        continue;
      } else {
        // It's a real directory, back it up
        const backupPath = `${target}.bak`;
        console.log(`[BACKUP] Moving existing ${folder} to ${folder}.bak`);

        // If backup already exists, remove it first or name it differently
        if (existsSync(backupPath)) {
          rmSync(backupPath, { recursive: true, force: true });
        }

        renameSync(target, backupPath);
      }
    }

    console.log(`[LINK] Creating symlink for ${folder}...`);
    try {
      symlinkSync(source, target, 'dir');
      console.log(`[OK] Linked ${folder} successfully.`);
    } catch (err) {
      console.error(`[ERROR] Failed to link ${folder}: ${err}`);
    }
  }

  console.log('\n✅ Prism Launcher linking completed successfully!');
  console.log(
    "You can now launch the 'OneOne Dev' instance in Prism Launcher.",
  );
}

linkPrism().catch(console.error);
