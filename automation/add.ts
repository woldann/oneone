import { $ } from 'bun';
import { getPackwizPath } from './get-packwiz';
import { build } from './build';

async function addMod() {
  const packwizPath = await getPackwizPath();

  if (!packwizPath) {
    console.error('❌ Error: packwiz executable not found.');
    console.log(
      'Please install packwiz or make sure it is in ~/go/bin/packwiz',
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: bun run automation/add.ts <mod-url-or-name>');
    process.exit(0);
  }

  const commandArgs = ['curseforge', 'add', ...args];

  console.log(`📦 Running packwiz ${commandArgs.join(' ')}...`);

  try {
    // Run packwiz command with passed arguments
    await $`${packwizPath} ${commandArgs}`;

    console.log('\n✅ Mod added successfully! Starting build...');
    await build();
  } catch (err) {
    console.error(`❌ Error: ${err}`);
    process.exit(1);
  }
}

addMod().catch(console.error);
