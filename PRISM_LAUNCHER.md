# Prism Launcher Integration Guide

To play this modpack using Prism Launcher, follow these steps to link the project's `instance/` directory to a new Prism instance.

## Steps

1.  **Create a New Instance in Prism:**
    *   Open Prism Launcher.
    *   Click "Add Instance".
    *   Select "NeoForge" as the loader and set the version to **1.21.1**.
    *   Name it (e.g., "OneOne Dev").

2.  **Open the Instance Folder:**
    *   Right-click the newly created instance in Prism.
    *   Select "Folder" -> "Open Instance Folder".

3. **Link the Modpack Assets:**
    *   Navigate to your project directory: `/home/serkan/Workspace/OneOne`.
    *   You can now automate the linking process! Run the following command in your terminal:
        ```bash
        bun run link-prism
        ```
    *   This script will:
        *   Automatically locate your instance.
        *   Backup any existing `mods`, `config`, etc. folders to `.bak`.
        *   Create symbolic links to keep your development environment in sync with Prism.

    *   *Alternative (Manual):* If the script fails, you can manually link the folders:
        ```bash
        # From within your Prism instance .minecraft folder:
        ln -s /home/serkan/Workspace/OneOne/instance/mods mods
        # ...etc
        ```

4.  **Run the Sync Script:**
    *   Before launching, ensure you have run the sync script in the project root:
        ```bash
        bun run sync
        ```

5.  **Launch the Game:**
    *   Go back to Prism Launcher and click "Launch".

## Automatic Updates

Every time you add a mod via `packwiz` or update the pack, simply run `bun run build`. Since the folders are symlinked, Prism will automatically see the new `.jar` files in your `instance/mods` folder!
