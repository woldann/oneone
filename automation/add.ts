import { $ } from 'bun';
import { getPackwizPath } from './get-packwiz';
import { build } from './build';
import * as colors from 'yoctocolors';
import { consola } from 'consola';

async function addMod() {
  const packwizPath = await getPackwizPath();

  if (!packwizPath) {
    consola.error(colors.red('Error: packwiz executable not found.'));
    consola.info(
      colors.yellow(
        'Please install packwiz or make sure it is in ~/go/bin/packwiz',
      ),
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.length === 0) {
    consola.info(
      colors.cyan('Usage: bun run automation/add.ts <mod-url-or-name>'),
    );
    process.exit(0);
  }

  const commandArgs = ['curseforge', 'add', ...args];

  consola.info(colors.cyan(`Running packwiz ${commandArgs.join(' ')}...`));

  try {
    // Run packwiz command interactively
    await $`${packwizPath} ${commandArgs}`;

    consola.success(colors.green('Mod added successfully!'));
    consola.start(colors.magenta('Starting build...\n'));
    await build();
  } catch (err) {
    consola.error(colors.red(`Error: ${err}`));
    process.exit(1);
  }
}

addMod().catch((err) => {
  consola.error(err);
  process.exit(1);
});
