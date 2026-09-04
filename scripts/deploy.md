# Build and Deployment Workflow (scripts/deploy.md)

> This document describes the build, install, and deployment workflow for the opencode-impm suite itself.
> Applicable scenario: before using this suite in a target project, you need to build the plugin and install it to the `.opencode/` directory.

---

## 1. Prerequisites

- Node.js >= 18 (20+ recommended)
- npm >= 9
- OpenCode (with plugin, skill, and command support)

## 2. Build Workflow

```bash
# 1) Install dependencies (first time)
npm install

# 2) Compile TypeScript source to dist/
npm run build

# 3) Verify build output
#    dist/ should contain index.js, tools/, utils/ and other compiled results
```

Build output description:

| Directory/File | Description |
| --- | --- |
| `dist/index.js` | Plugin entry (OpenCode load entry) |
| `dist/tools/` | Build output for 11 tools |
| `dist/utils/` | Build output for path/version/git utility functions |
| `assets/` | Suite resources (agents, commands, skills, templates) |

> For development debugging, use `npm run dev` (tsc --watch for automatic incremental compilation).

## 3. Deployment Workflow

### 3.1 Local Deployment (install to current project)

```bash
# Option 1: npm install triggers postinstall auto-install
npm install

# Option 2: manually run the install script
node scripts/install.mjs
```

Install script actions:

1. Copy `assets/commands` -> target directory `commands/` (project install: `.opencode/commands`, global install: global config directory `commands`)
2. Copy `assets/agents` -> target directory `agents/` (project install: `.opencode/agents`, global install: global config directory `agents`)
3. Copy `assets/skills` -> target directory `skills/` (project install: `.opencode/skills`, global install: global config directory `skills`)
4. Copy `dist/` + `package.json` -> target directory `plugins/impm/` (non-self-install scenario: delete entire old plugin directory and entry first then reinstall, avoiding stale build artifacts; assets also written idempotently)
5. Update target `opencode.json` (non-self-install scenario: append plugin configuration)
6. Per `--agent-type` preset, sync each impm-managed agent's model and reasoning depth to the `agent` key in `opencode.json` (see 3.5 for details)

### 3.2 Deploy to Specified Project

```bash
node scripts/install.mjs --target /path/to/project
```

Windows PowerShell:

```powershell
.\scripts\install.ps1 -Target D:\path\to\project
```

### 3.3 Global Install

Installs agents/commands/skills/plugin to the opencode global config directory (`~/.config/opencode`), making `/impm` available to all projects, and writes each agent's model configuration to the global `opencode.json`:

```bash
node scripts/install.mjs --global
```

Windows PowerShell:

```powershell
.\scripts\install.ps1 -Global
```

> Note: Global install places agents/commands/skills directly into `~/.config/opencode/` directories, and writes each agent's model configuration to the `agent` key in `~/.config/opencode/opencode.json`.

### 3.4 Deploy as npm Dependency (consumer project)

```bash
npm install opencode-impm
```

After installing to the consumer project, postinstall automatically copies assets to the consumer project's `.opencode/` and registers the plugin, syncing each agent's model configuration.

### 3.5 Agent Model Configuration Reference

The install script uses `--agent-type` to specify a preset (all presets defined in `scripts/agent-models.json`; to change models, only modify that file; by default when `--agent-type` is not passed, agent settings in opencode.json are not modified and no preset is automatically applied):

| Preset | Description |
|:-----|:-----|
| `opencode-zen-free` | All agents use opencode-zen/big-pickle, extreme token savings |
| `opencode-go-lite` | All agents use opencode-go low-cost models, lightweight and low-cost |
| `opencode-go-balance` | Balanced cost vs. responsibility allocation (previous fixed config, recommended) |
| `opencode-go-optimize` | Key agents assigned stronger models, quality-focused |
| `custom` | Uses existing configuration: agents with existing model settings are preserved, missing ones filled per balance preset |

`custom` preset semantics: **installation/upgrade never overwrites user-modified model configurations**, only fills in missing agents, preventing upgrade from overwriting personalized settings.

```bash
# Example: install with balance preset
node scripts/install.mjs --agent-type opencode-go-balance
node scripts/install.mjs --target /path/to/project --agent-type opencode-go-optimize
# Windows PowerShell (supports -AgentType/--agent-type/--AgentType/--agent_type spellings)
.\scripts\install.ps1 -Target D:\path\to\project -AgentType opencode-go-lite
.\scripts\install.ps1 -Target D:\path\to\project --agent-type opencode-go-lite
```

- No `--agent-type`: does not modify any agent settings in `opencode.json` (preserves existing model configurations and manual settings).
- `--agent-type clear`: cleans `model`/`reasoning_effort` of impm-managed agents (idempotent, for reinstall during upgrade), writes no model configuration, **does not touch user-customized agents or other fields**.
- Unknown value: exits with error (exit 1), performs no installation actions.
- 13 impm-managed agents (pm/scm/ba/sa/tl/dba/te/cs/ws/sse/fee/bee/dw) default role assignment per the balance preset:

| Agent | Model | Reasoning Depth | Role |
|:-----:|:-----|:--------:|:-----|
| pm  | opencode-go/deepseek-v4-flash | low | Orchestration, decision-making |
| scm | opencode-go/deepseek-v4-flash | low | Git/version management |
| ba  | opencode-go/deepseek-v4-pro | high | Requirements documentation |
| sa  | opencode-go/deepseek-v4-pro | max | System architecture design |
| tl  | opencode-go/deepseek-v4-pro | high | Detailed design/API/code review |
| dba | opencode-go/deepseek-v4-flash | max | Database design |
| te  | opencode-go/deepseek-v4-flash | high | Test cases/test code |
| cs  | opencode-go/deepseek-v4-flash | low | Local code search |
| ws  | opencode-go/deepseek-v4-flash | low | Web resource search |
| sse | opencode-go/deepseek-v4-pro | high | Complex business coding |
| fee | opencode-go/deepseek-v4-flash | high | Frontend coding |
| bee | opencode-go/deepseek-v4-flash | max | Backend coding |
| dw  | opencode-go/deepseek-v4-flash | high | Documentation writing |

> The above table shows specific values for the `balance` preset. Other presets and custom fill values are defined in `scripts/agent-models.json`.

### 3.6 Agent Model Configuration Cleanup (--agent-type clear)

When installing with `--agent-type clear`, the script only performs model configuration cleanup (`model` and `reasoning_effort`) on the 13 impm-managed agents, preserving all other configuration (custom fields, user-created agents, opencode-browser plugin), making it easy to clear old configurations before switching presets. When `--agent-type` is not passed, agent configurations are not modified at all.

### 3.6.1 Historical Version Residual Cleanup (install manifest impm-manifest.json)

The install script maintains a cumulative install manifest `.opencode/impm-manifest.json` (`everInstalled` historical union, **only grows**), solving the cleanup problem of "historical versions renamed/removed but install copies remain" (especially agents named by role, not following the impm prefix convention):

- **During install**: if a manifest exists, use `everInstalled` to precisely delete residuals of "historically installed, currently absent" items (including renamed/removed agents, commands, skills, historical plugin registrations, and historical agent model configuration keys), then copy current resources; if no manifest (first install), use heuristic cleanup (commands/skills by `impm*` prefix + same name, agents by same name).
- **During uninstall** (uninstall.mjs / uninstall.ps1): precisely delete all impm-owned items from this and historical installs per manifest, not relying on `impm*` prefix or whether package assets exist (can clean up even if the package is deleted before uninstalling); also rolls back `type:module` in `.opencode/package.json` written by install, and finally deletes the manifest file itself.
- User-created / other plugin non-impm content (`myuser.md`, `zzz-*.md` etc.) is preserved during both install and uninstall.

### 3.7 Uninstall

Uninstall only deletes content related to this plugin, **preserving user customizations** (user-created agents, commands, skills, `opencode-browser` plugin, other fields):

```bash
# Direct uninstall (node version)
node scripts/uninstall.mjs
# Specify target project
node scripts/uninstall.mjs --target /path/to/project
# PowerShell version
.\scripts\uninstall.ps1 -Target D:\path\to\project
# Uninstall from current project via npm scripts
npm run uninstall:plugin
```

Uninstall actions:

1. Delete `plugins/impm/` and plugin entry `plugins/impm.js`
2. Per install manifest, precisely delete impm-owned `agents/` (13), `commands/` (51), `skills/` (51 + template); when no manifest exists, fall back to heuristic (`impm*` prefix / current assets set)
3. Remove impm historical plugin registrations from `opencode.json` (preserve other plugins)
4. Clean `model`/`reasoning_effort` fields of impm-managed agents (current assets ∪ manifest history) (user-customized agents untouched)
5. If manifest records that install wrote `type:module`, roll back `.opencode/package.json`
6. Delete install manifest file `impm-manifest.json`

### 3.8 Publish to npm (optional)

```bash
# 1) Build and verify output
npm run build

# 2) Local verification install
npm pack
# In a temporary project: npm install <generated tgz file>

# 3) Publish
npm publish --access public
```

Before publishing, confirm `package.json`'s `files` field includes: `dist/`, `assets/`, `scripts/install.mjs`, `scripts/uninstall.mjs`, `scripts/install.ps1`, `scripts/uninstall.ps1`, `scripts/agent-models.json`.

## 4. Deployment Verification

After installation, verify with the following steps:

```bash
# 1) Confirm directory structure
#    .opencode/commands/  -> 51 commands
#    .opencode/agents/    -> 13 agents
#    .opencode/skills/    -> 51 skills + template/ 17 templates
#    .opencode/impm-manifest.json -> cumulative install manifest (historical residual cleanup basis)
#    .opencode/plugins/impm/ -> plugin build artifacts

# 2) Confirm opencode.json configuration is correct (no plugin registration needed for self-install)

# 3) Restart OpenCode, type /impm to start the project manager full workflow
```

## 5. Upgrade and Rollback

### Upgrade

```bash
# Rebuild and reinstall; the install script will clean historical residuals per cumulative manifest,
# fully rebuild the plugin directory and entry, and sync model configurations per `--agent-type`
# (default: no --agent-type: no modification to agent configs; clear: clean existing model configs;
# custom: preserves user-manually-adjusted model settings)
npm run build
node scripts/install.mjs
```

### Rollback

- Local deployment: backup and restore old `assets/` and `dist/`, then re-run `node scripts/install.mjs`.
- Version backup: recommended to tag the suite source with git (e.g., `v0.1.0`), then `git checkout` the corresponding tag and rebuild/reinstall when rollback is needed.

## 6. FAQ

| Issue | Resolution |
| --- | --- |
| `dist` directory does not exist | Run `npm run build` before running the install script |
| Files under `.opencode` not updated | Install script overwrites; confirm target project path is correct (`--target`) |
| `/impm` command unavailable | Restart OpenCode; confirm `.opencode/skills/impm/SKILL.md` and `.opencode/commands/impm.md` exist |
| Plugin tools not working | Confirm `.opencode/plugins/impm/dist/index.js` exists and is loadable (check OpenCode startup logs) |

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
