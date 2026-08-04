# Build and Deployment Process (scripts/deploy.md)

> This document describes the compilation, installation, and deployment process of the opencode-impm suite itself.
> Use case: before using this suite in a target project, you need to compile the plugin and install it into the `.opencode/` directory.

---

## 1. Environment Requirements

- Node.js >= 18 (20+ recommended)
- npm >= 9
- OpenCode (supports plugins, skills, and commands)

## 2. Build Process

```bash
# 1) Install dependencies (first time)
npm install

# 2) Compile the TypeScript source to dist/
npm run build

# 3) Verify the artifacts
#    The dist/ directory should contain the compiled results such as index.js, tools/, utils/
```

Build artifacts:

| Directory/File | Description |
| --- | --- |
| `dist/index.js` | Plugin entry (the OpenCode load entry) |
| `dist/tools/` | Compiled output of the 11 tools |
| `dist/utils/` | Compiled output of path/version/git and other utility functions |
| `assets/` | Suite assets (agents, commands, skills, templates) |

> Use `npm run dev` (tsc --watch incremental compilation) for development debugging.

## 3. Deployment Process

### 3.1 Local Deployment (install into the current project)

```bash
# Option 1: npm install triggers postinstall for automatic installation
npm install

# Option 2: run the install script manually
node scripts/install.mjs
```

What the install script does:

1. Copies `assets/commands` → target project `.opencode/commands`
2. Copies `assets/agents` → target project `.opencode/agents`
3. Copies `assets/skills` → target project `.opencode/skills`
4. Copies `dist/` + `package.json` → target project `.opencode/plugins/impm/` (opencode automatically loads local plugins at startup)
5. Updates the target project's `opencode.json` (appends the plugin configuration in non-self-install scenarios)

### 3.2 Deploy to a Specific Project

```bash
node scripts/install.mjs --target /path/to/project
```

Windows PowerShell:

```powershell
.\scripts\install.ps1 -Target D:\path\to\project
```

### 3.3 Deploy as an npm Dependency (consuming project)

```bash
npm install opencode-impm
```

After installation into the consuming project, postinstall automatically copies the assets into the consuming project's `.opencode/` and registers the plugin.

### 3.4 Publish to npm (optional)

```bash
# 1) Build and check the artifacts
npm run build

# 2) Verify the install locally
npm pack
# In a temporary project: npm install <generated tgz file>

# 3) Publish
npm publish --access public
```

Before publishing, make sure the `files` field of `package.json` includes: `dist/`, `assets/`, `scripts/install.mjs`.

## 4. Deployment Verification

After installation, verify with the following steps:

```bash
# 1) Confirm the directory structure
#    .opencode/commands/  -> 45 commands
#    .opencode/agents/    -> 13 agents
#    .opencode/skills/    -> 45 skills + template/
#    .opencode/plugins/impm/ -> plugin build artifacts

# 2) Confirm that opencode.json is configured correctly (no plugin registration needed for self-install)

# 3) Restart OpenCode; entering /impm should start the Project Manager full workflow
```

## 5. Upgrade and Rollback

### Upgrade

```bash
# Recompile and reinstall; the install script overwrites the old files under .opencode/
npm run build
node scripts/install.mjs
```

### Rollback

- Local deployment: back up and restore the old `assets/` and `dist/`, then re-run `node scripts/install.mjs`.
- Version backup: it is recommended to tag the suite source with git (e.g., `v0.1.0`); when rolling back, `git checkout` the corresponding tag and recompile/reinstall.

## 6. Common Issues

| Issue | Handling |
| --- | --- |
| `dist` directory does not exist | Run `npm run build` first, then run the install script |
| Files under `.opencode` are not updated | The install script copies with overwrite; confirm the target project path (`--target`) |
| `/impm` command is not available | Restart OpenCode; confirm `.opencode/skills/impm/SKILL.md` and `.opencode/commands/impm.md` exist |
| Plugin tools do not work | Confirm `.opencode/plugins/impm/dist/index.js` exists and can be loaded (check the OpenCode startup logs) |

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
