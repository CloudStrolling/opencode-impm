/**
 * Copyright 2026 jenemy8023 <jenemy8023@163.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * opencode-impm uninstall script
 *
 * Fully uninstalls this plugin, only cleaning content written by this plugin during installation, preserving user customizations:
 *   - Deletes .opencode/plugins/impm/ directory and entry file plugins/impm.js
 *   - Per install manifest .opencode/impm-manifest.json (cumulative historical manifest, everInstalled only grows)
 *     precisely deletes files this plugin installed under agents/commands/skills (including historically renamed/removed items);
 *     when no manifest exists, falls back to heuristic (agents matching asset names, commands/skills with impm* naming), preserving other user files
 *   - Removes impm historical registrations from opencode.json's plugin list (preserving opencode-browser
 *     and other plugins that existed before installation/user-added plugins)
 *   - Cleans model/reasoning_effort fields of impm-managed agents (current assets ∪ manifest history)
 *     in opencode.json's agent keys (preserving other user-customized agent entries)
 *   - If the manifest records that install wrote type:module, rolls back .opencode/package.json
 *   - Finally deletes the manifest file itself
 *
 * Usage (consistent with install script):
 *   node scripts/uninstall.mjs                     # Uninstall current directory
 *   node scripts/uninstall.mjs --target /path/proj  # Uninstall specified project
 *   node scripts/uninstall.mjs --global             # Uninstall global install (~/.config/opencode)
 */

import {
    existsSync,
    readdirSync,
    readFileSync,
    writeFileSync,
    rmSync,
} from "node:fs";
import { join, dirname, resolve, isAbsolute } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path constants: plugin root, distributable assets directory
const PLUGIN_ROOT = resolve(__dirname, "..");
const ASSETS_DIR = join(PLUGIN_ROOT, "assets");

// Plugin name registered by this plugin during install; uninstall only removes PACKAGE_NAME, preserving opencode-browser
const PACKAGE_NAME = "opencode-impm";

/** Global install target: opencode global config directory */
const GLOBAL_CONFIG_DIR = join(homedir(), ".config", "opencode");

/** Collect agent names belonging to this plugin from assets/agents (fallback when no manifest) */
function collectManagedAgents() {
    const agentsDir = join(ASSETS_DIR, "agents");
    if (!existsSync(agentsDir)) {
        return [];
    }
    return readdirSync(agentsDir)
        .filter((f) => f.endsWith(".md"))
        .map((f) => f.replace(/\.md$/, ""));
}

/** Install manifest path: {opencodeDir}/impm-manifest.json */
function manifestPath(opencodeDir) {
    return join(opencodeDir, "impm-manifest.json");
}

/** Read install manifest; returns null if missing or corrupted */
function loadManifest(opencodeDir) {
    const file = manifestPath(opencodeDir);
    if (!existsSync(file)) {
        return null;
    }
    try {
        const m = readJsonFile(file);
        if (!m || typeof m !== "object") {
            return null;
        }
        m.everInstalled = m.everInstalled || { agents: [], commands: [], skills: [] };
        for (const key of Object.keys(m.everInstalled)) {
            if (!Array.isArray(m.everInstalled[key])) {
                m.everInstalled[key] = [];
            }
        }
        m.pluginNames = Array.isArray(m.pluginNames) ? m.pluginNames : [];
        m.pkgJsonTypeModule = !!m.pkgJsonTypeModule;
        return m;
    } catch {
        return null;
    }
}

/** Roll back type:module in .opencode/package.json that was written by install (called only when manifest confirms this script wrote it) */
function rollbackPkgJsonTypeModule(opencodeDir) {
    const pkgPath = join(opencodeDir, "package.json");
    if (!existsSync(pkgPath)) {
        return;
    }
    try {
        const pkg = readJsonFile(pkgPath);
        if (pkg && typeof pkg === "object" && pkg.type === "module") {
            delete pkg.type;
            if (Object.keys(pkg).length === 0) {
                rmSync(pkgPath, { force: true });
                console.log("  Rolled back .opencode/package.json (removed type:module written by install, file is now empty and deleted)");
            } else {
                writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
                console.log("  Rolled back .opencode/package.json (removed type:module written by install)");
            }
        }
    } catch {
        // Parse failure: do nothing to avoid corrupting user files
    }
}

/** Strip UTF-8 BOM (Windows editors often write BOM, causing JSON.parse to fail) */
function stripBom(text) {
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Read a JSON file (auto-strips BOM) */
function readJsonFile(filePath) {
    return JSON.parse(stripBom(readFileSync(filePath, "utf-8")));
}

/** Resolve target project: --global first, then --target, then INIT_CWD, finally fallback to current directory */
function resolveTargetProject(args) {
    if (args.includes("--global")) {
        return GLOBAL_CONFIG_DIR;
    }

    const targetIndex = args.indexOf("--target");
    if (targetIndex !== -1 && targetIndex + 1 < args.length) {
        const target = args[targetIndex + 1];
        return isAbsolute(target) ? target : resolve(process.cwd(), target);
    }

    const initCwd = process.env.INIT_CWD;
    if (initCwd && resolve(initCwd) !== PLUGIN_ROOT) {
        return resolve(initCwd);
    }

    return process.cwd();
}

/** Remove impm-owned skills (prioritize precise deletion by cumulative manifest; fallback to impm/impm-/template prefix when no manifest) */
function removeImpmSkills(skillsDir, managedNames = null) {
    if (!existsSync(skillsDir)) {
        return 0;
    }
    let count = 0;
    const names = managedNames && managedNames.length > 0
        ? managedNames
        : null;
    for (const name of readdirSync(skillsDir)) {
        const owned = names
            ? names.includes(name)
            : name === "impm" || name.startsWith("impm-") || name === "template";
        if (!owned) {
            continue;
        }
        rmSync(join(skillsDir, name), { recursive: true, force: true });
        count++;
    }
    return count;
}

/** Remove impm-owned commands (prioritize precise deletion by cumulative manifest; fallback to impm prefix when no manifest) */
function removeImpmCommands(commandsDir, managedNames = null) {
    if (!existsSync(commandsDir)) {
        return 0;
    }
    let count = 0;
    for (const name of readdirSync(commandsDir)) {
        const isManaged = managedNames && managedNames.length > 0
            ? managedNames.includes(name)
            : name.replace(/\.(md|txt)$/, "").startsWith("impm");
        if (!isManaged) {
            continue;
        }
        rmSync(join(commandsDir, name), { recursive: true, force: true });
        count++;
    }
    return count;
}

/** Remove impm-owned agents (prioritize precise deletion by cumulative manifest; fallback to asset name matching when no manifest) */
function removeImpmAgents(agentsDir, managedFiles = null) {
    if (!existsSync(agentsDir)) {
        return 0;
    }
    const managed = managedFiles && managedFiles.length > 0
        ? managedFiles
        : collectManagedAgents().map((n) => `${n}.md`);
    let count = 0;
    for (const name of managed) {
        const file = join(agentsDir, name);
        if (existsSync(file)) {
            rmSync(file, { force: true });
            count++;
        }
    }
    return count;
}

/** Remove impm plugin registration from opencode.json and clean impm-managed agent model configurations */
function updateOpenCodeConfig(projectRoot, manifest = null) {
    const configPath = join(projectRoot, "opencode.json");
    if (!existsSync(configPath)) {
        console.log(`  Config file not found, skipping config cleanup: ${configPath}`);
        return;
    }

    let config;
    try {
        config = readJsonFile(configPath);
    } catch {
        console.warn(`  Failed to parse opencode.json, skipping config cleanup: ${configPath}`);
        return;
    }

    // 1) Remove impm historical plugin registrations (cumulative manifest recorded names + PACKAGE_NAME + impm-related string/object entries), preserve the rest (including opencode-browser)
    const stalePluginNames = new Set(
        manifest && manifest.pluginNames.length > 0
            ? manifest.pluginNames
            : [PACKAGE_NAME],
    );
    if (Array.isArray(config.plugin)) {
        const before = config.plugin.length;
        config.plugin = config.plugin.filter((p) => {
            if (typeof p === "string") {
                return !stalePluginNames.has(p) && !p.toLowerCase().includes("impm");
            }
            if (p && typeof p === "object") {
                const n = String(p.name || p.entry || "");
                return !n.toLowerCase().includes("impm");
            }
            return true;
        });
        if (config.plugin.length === 0) {
            delete config.plugin;
        }
        console.log(`  Removed impm plugin registrations from plugin list (${config.plugin?.length ?? 0} remaining)`);
    }

    // 2) Clean impm-managed agent model configurations (current assets ∪ cumulative manifest historical agents, strip .md from filenames to get agent keys)
    const historicalAgents = manifest && manifest.everInstalled.agents
        ? manifest.everInstalled.agents.map((f) => f.replace(/\.md$/i, ""))
        : [];
    const managedAgents = [...new Set([...collectManagedAgents(), ...historicalAgents])].filter(Boolean);
    let cleaned = 0;
    if (config.agent && typeof config.agent === "object") {
        for (const name of managedAgents) {
            const entry = config.agent[name];
            if (!entry || typeof entry !== "object") {
                continue;
            }
            let changed = false;
            if ("model" in entry) {
                delete entry.model;
                changed = true;
            }
            if ("reasoning_effort" in entry) {
                delete entry.reasoning_effort;
                changed = true;
            }
            if (changed && Object.keys(entry).length === 0) {
                delete config.agent[name];
            }
            if (changed) {
                cleaned++;
            }
        }
        if (Object.keys(config.agent).length === 0) {
            delete config.agent;
        }
    }
    console.log(`  Cleaned ${cleaned} impm-managed agent model configurations`);

    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

/** Main uninstall flow */
function main() {
    const args = process.argv.slice(2);
    const isGlobal = args.includes("--global");
    const targetRoot = resolveTargetProject(args);

    console.log("============================================");
    console.log("  opencode-impm uninstall script");
    console.log("============================================");
    console.log("");
    console.log(`Target project: ${targetRoot}${isGlobal ? " (global)" : ""}`);
    console.log("");

    const opencodeDir = isGlobal ? targetRoot : join(targetRoot, ".opencode");

    // Read install manifest: if present, precisely delete historical residuals (renamed/removed items) per manifest; otherwise fall back to heuristic
    const manifest = loadManifest(opencodeDir);
    if (manifest) {
        console.log("Install manifest found -> precise cleanup using cumulative history");
    } else {
        console.log("No install manifest found -> using heuristic cleanup (impm* prefix / current assets set)");
    }

    // 1) Delete plugin build artifacts and entry file
    let removed = 0;
    const pluginDest = join(opencodeDir, "plugins", "impm");
    const pluginEntry = join(opencodeDir, "plugins", "impm.js");
    if (existsSync(pluginDest)) {
        rmSync(pluginDest, { recursive: true, force: true });
        console.log(`  Deleted plugin directory -> ${pluginDest}`);
        removed++;
    }
    if (existsSync(pluginEntry)) {
        rmSync(pluginEntry, { force: true });
        console.log(`  Deleted plugin entry -> ${pluginEntry}`);
        removed++;
    }
    if (removed === 0) {
        console.log("  No plugin build artifacts found (may already be uninstalled)");
    }

    // 2) Delete assets installed by this plugin (only impm-owned, preserving other user files)
    console.log("Cleaning impm-owned resources in agents/commands/skills...");
    const agentsRemoved = removeImpmAgents(
        join(opencodeDir, "agents"),
        manifest ? manifest.everInstalled.agents : null,
    );
    const commandsRemoved = removeImpmCommands(
        join(opencodeDir, "commands"),
        manifest ? manifest.everInstalled.commands : null,
    );
    const skillsRemoved = removeImpmSkills(
        join(opencodeDir, "skills"),
        manifest ? manifest.everInstalled.skills : null,
    );
    console.log(
        `  Deleted impm-owned resources: agents ${agentsRemoved}, commands ${commandsRemoved}, skills ${skillsRemoved}`,
    );

    // 3) Roll back type:module in .opencode/package.json written by install (only when manifest confirms this script wrote it)
    if (manifest && manifest.pkgJsonTypeModule) {
        rollbackPkgJsonTypeModule(opencodeDir);
    }

    // 4) Clean opencode.json (plugin registration + agent model configurations, preserving user customizations)
    console.log("Updating opencode.json configuration...");
    updateOpenCodeConfig(targetRoot, manifest);

    // 5) Delete the manifest file itself
    if (manifest) {
        try {
            rmSync(manifestPath(opencodeDir), { force: true });
            console.log(`  Deleted install manifest -> ${manifestPath(opencodeDir)}`);
        } catch {
            /* ignore deletion failure */
        }
    }

    console.log("");
    console.log("============================================");
    console.log("  Uninstall complete!");
    console.log("  Plugin and its registrations/model configurations removed; user customizations preserved.");
    console.log("============================================");
}

main();
