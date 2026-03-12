import { Glob } from 'bun';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const MODS_DIR = 'mods';
const INSTANCE_MODS_DIR = 'instance/mods';
const OUTPUT_FILE = 'MODS.md';

async function getModMetadata(jarPath: string, filename: string) {
  const metadata = { authors: 'Unknown', version: 'Unknown' };
  if (!existsSync(jarPath)) return metadata;

  try {
    // Try Fabric first
    const fabricRes = Bun.spawnSync([
      'unzip',
      '-p',
      jarPath,
      'fabric.mod.json',
    ]);
    if (fabricRes.success) {
      const stdout = fabricRes.stdout.toString();
      if (stdout.trim()) {
        const data = JSON.parse(stdout) as {
          authors?: (string | { name: string })[] | string;
          version?: string | number;
        };
        const authors = data.authors;
        if (Array.isArray(authors)) {
          metadata.authors = authors
            .map((a) => (typeof a === 'string' ? a : a.name || 'Unknown'))
            .join(', ');
        } else if (typeof authors === 'string') {
          metadata.authors = authors;
        }
        metadata.version = (data.version || 'Unknown').toString();
      }
    } else {
      // Try Forge/NeoForge (mods.toml)
      const forgeRes = Bun.spawnSync([
        'unzip',
        '-p',
        jarPath,
        'META-INF/mods.toml',
      ]);
      if (forgeRes.success) {
        const content = forgeRes.stdout.toString();
        // Match authors strictly
        const authorsMatch = content.match(/^\s*authors\s*=\s*"([^"]+)"/m);
        metadata.authors = authorsMatch?.[1] ?? 'Unknown';

        // Match version strictly (avoid versionRange or loaderVersion)
        const versionMatch = content.match(/^\s*version\s*=\s*"([^"]+)"/m);
        if (
          versionMatch &&
          versionMatch[1] &&
          !versionMatch[1].includes('${')
        ) {
          metadata.version = versionMatch[1];
        }
      }
    }

    // If version is still unknown or a variable, check MANIFEST.MF
    if (metadata.version === 'Unknown' || metadata.version.includes('${')) {
      const manifestRes = Bun.spawnSync([
        'unzip',
        '-p',
        jarPath,
        'META-INF/MANIFEST.MF',
      ]);
      if (manifestRes.success) {
        const manifest = manifestRes.stdout.toString();
        const implVersion = manifest.match(
          /Implementation-Version:\s*([^\r\n]+)/,
        );
        const specVersion = manifest.match(
          /Specification-Version:\s*([^\r\n]+)/,
        );
        const matched = (
          implVersion?.[1] ??
          specVersion?.[1] ??
          'Unknown'
        ).trim();
        if (matched && matched !== 'Unknown') {
          metadata.version = matched;
        }
      }
    }

    // Final fallback to filename parsing if version is still messy
    if (metadata.version === 'Unknown' || metadata.version.includes('${')) {
      const versionFromFilename = filename.match(/-([0-9.]+[^/]*)\.jar$/);
      if (versionFromFilename?.[1]) {
        metadata.version = versionFromFilename[1];
      }
    }
  } catch (e) {
    console.error(`Error reading metadata for ${jarPath}:`, e);
  }

  return metadata;
}

interface Mod {
  name: string;
  link: string;
  authors: string;
  version: string;
}

async function generate() {
  const glob = new Glob('*.pw.toml');
  const modFiles = Array.from(glob.scanSync(MODS_DIR));

  const mods: Mod[] = [];

  for (const file of modFiles) {
    const content = readFileSync(join(MODS_DIR, file), 'utf-8');
    const name = content.match(/^name\s*=\s*"([^"]+)"/m)?.[1] ?? file;
    const filename = content.match(/^filename\s*=\s*"([^"]+)"/m)?.[1] ?? '';
    const projectId = content.match(/project-id\s*=\s*(\d+)/)?.[1] ?? '';
    const link = projectId
      ? `https://www.curseforge.com/projects/${projectId}`
      : '#';

    if (filename) {
      const jarPath = join(INSTANCE_MODS_DIR, filename);
      const meta = await getModMetadata(jarPath, filename);

      mods.push({
        name,
        link,
        authors: meta.authors,
        version:
          meta.version ||
          filename.replace('.jar', '').split('-').pop() ||
          'Unknown',
      });
    }
  }

  mods.sort((a, b) => a.name.localeCompare(b.name));

  let markdown = `# 📦 Mod List (${mods.length})\n\n`;
  markdown += '| Mod Name | Authors | Version | Link |\n';
  markdown += '| :--- | :--- | :--- | :--- |\n';

  for (const mod of mods) {
    const escapedName = (mod.name ?? 'Unknown').replace(/\|/g, '\\|');
    const escapedAuthors = (mod.authors ?? 'Unknown').replace(/\|/g, '\\|');
    const escapedVersion = (mod.version ?? 'Unknown').replace(/\|/g, '\\|');
    markdown += `| **${escapedName}** | ${escapedAuthors} | \`${escapedVersion}\` | [CurseForge](${mod.link}) |\n`;
  }

  writeFileSync(OUTPUT_FILE, markdown);
  console.log(`✨ Generated ${OUTPUT_FILE} with ${mods.length} mods!`);
}

generate();
