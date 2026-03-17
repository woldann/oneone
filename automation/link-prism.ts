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
import ora from 'ora';
import * as colors from 'yoctocolors';
import { consola } from 'consola';

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
const FOLDERS_TO_LINK = [
  'mods',
  'config',
  'resourcepacks',
  'shaderpacks',
  'kubejs',
];

async function linkPrism() {
  consola.info(colors.bold(colors.magenta('OneOne Prism Launcher Automation')));

  if (!existsSync(PROJECT_INSTANCE_PATH)) {
    consola.info('Creating project instance directory...');
    mkdirSync(PROJECT_INSTANCE_PATH, { recursive: true });
  }

  if (!existsSync(PRISM_INSTANCE_PATH)) {
    consola.error(
      colors.red(`Prism instance path not found: ${PRISM_INSTANCE_PATH}`),
    );
    consola.info(
      colors.yellow(
        "Please make sure the instance 'OneOne Dev' exists in Prism Launcher.",
      ),
    );
    process.exit(1);
  }

  for (const folder of FOLDERS_TO_LINK) {
    const source = join(PROJECT_INSTANCE_PATH, folder);
    const target = join(PRISM_INSTANCE_PATH, folder);

    const spinner = ora(colors.cyan(`Processing ${folder}...`)).start();

    // Ensure source exists in project (even if empty)
    if (!existsSync(source)) {
      mkdirSync(source, { recursive: true });
    }

    if (existsSync(target)) {
      const stats = lstatSync(target);

      if (stats.isSymbolicLink()) {
        spinner.info(colors.dim(`${folder} is already a symbolic link.`));
        continue;
      } else {
        // It's a real directory, back it up
        const backupPath = `${target}.bak`;
        spinner.text = colors.yellow(
          `Backing up existing ${folder} to ${folder}.bak...`,
        );

        // If backup already exists, remove it first
        if (existsSync(backupPath)) {
          rmSync(backupPath, { recursive: true, force: true });
        }

        renameSync(target, backupPath);
      }
    }

    spinner.text = colors.cyan(`Creating symlink for ${folder}...`);
    try {
      symlinkSync(source, target, 'dir');
      spinner.succeed(colors.green(`Linked ${folder} successfully.`));
    } catch (err) {
      spinner.fail(colors.red(`Failed to link ${folder}: ${err}`));
    }
  }

  consola.success(
    colors.bold(colors.green('Prism Launcher linking completed!')),
  );
  consola.info(
    colors.cyan(
      "You can now launch the 'OneOne Dev' instance in Prism Launcher.",
    ),
  );
}

linkPrism().catch((err) => {
  consola.error(err);
  process.exit(1);
});
