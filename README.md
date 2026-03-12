# 🌀 OneOne

Welcome to the OneOne project repository!

**OneOne** is a hardcore Skyblock experience built for Forge 1.20.1, focusing on bridging deep, classic gameplay mechanics with a modern, polished presentation.

👉 **[Read the full Project Description and Vision here](DESCRIPTION.md)**

---

## 🛠️ For Developers & Contributors

This project uses [Bun](https://bun.sh/) and TypeScript to handle environment setups and mod downloading. By avoiding standard Node.js tools in favor of Bun, we achieve faster execution and built-in TypeScript support.

### Prerequisites

- [Bun](https://bun.sh/) installed on your system.

### Project Structure & Scripts

The `automation/` directory contains scripts that manage the Minecraft instance lifecycle.

- `bun run start`
  Runs the `build.ts` script to scaffold and build the Minecraft instance directories (`mods`, `config`, `resourcepacks`, `shaderpacks`, etc.).

### How to install mods

1. Use `packwiz` commands to manage your modpack exclusively via CurseForge:
   ```bash
   packwiz curseforge install <mod-name>
   ```
2. The `index.toml` will automatically track your newly added mods.
3. When distributing or downloading the pack instances natively, use `packwiz update` to fetch the jar files through your Minecraft Launcher (like Prism or MultiMC) or via the packwiz installer script.
