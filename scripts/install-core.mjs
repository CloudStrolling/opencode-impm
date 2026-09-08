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
 * opencode-impm install core logic
 *
 * Shared between the CLI entry (install.mjs) and the plugin entry (src/index.ts -> ensureInstalled).
 * Responsibilities: sync assets, maintain cumulative manifest, clean stale files, update opencode.json.
 *
 * Design principles:
 *   - All paths are passed in by the caller; this module does not depend on __dirname for external paths
 *   - When agentType is empty, agent model configuration in opencode.json is not modified
 *   - Idempotent: when the version matches, runInstall returns immediately with zero overhead
 */

import {
    cpSync,
    mkdirSync,
    existsSync,
    readdirSync,
    readFileSync,
    writeFileSync,
    rmSync,
} from "node:fs";
import { join, resolve } from "node:path";

const ASSET_DIRS = ["commands", "agents", "skills"];
const PACKAGE_NAME = "opencode-impm";
/** Plugins registered by default during installation (impm suite + browser plugin, for UI/network-related skills) */
const DEFAULT_PLUGINS = [PACKAGE_NAME, "opencode-browser"];

/** --agent-type allowed values */
export const AGENT_TYPES = [
    "opencode-zen-free",
    "opencode-go-lite",
    "opencode-go-balance",
    "opencode-go-optimize",
    "custom",
    "clear",
];

// --- File Utilities -------------------------------------------------------

/** Strip UTF-8 BOM (Windows editors often write BOM, causing JSON.parse to fail) */
function stripBom(text) {
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Read a JSON file (auto-strips BOM) */
function readJsonFile(filePath) {
    return JSON.parse(stripBom(readFileSync(filePath, "utf-8")));
}

/** Recursively copy a directory */
function copyDirRecursive(src, dest) {
    if (!existsSync(src)) {
        console.warn(`  Skipping: source directory does not exist ${src}`);
        return;
    }
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src, { withFileTypes: true })) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else if (entry.isFile()) {
            cpSync(srcPath, destPath);
        }
    }
}

// --- Manifest Management --------------------------------------------------

/** Install manifest file path */
function manifestPath(opencodeDir) {
    return join(opencodeDir, "impm-manifest.json");
}

/** Read install manifest; returns null if missing or corrupted */
export function loadManifest(opencodeDir) {
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

/** Save install manifest */
export function saveManifest(opencodeDir, manifest) {
    writeFileSync(
        manifestPath(opencodeDir),
        JSON.stringify(manifest, null, 2) + "\n",
        "utf-8",
    );
}

/** Merge a batch of names into the historical manifest (only grows, ensuring renamed/removed items can still be cleaned) */
function mergeEver(manifest, key, names) {
    const set = new Set(manifest.everInstalled[key] || []);
    for (const n of names) {
        set.add(n);
    }
    manifest.everInstalled[key] = [...set];
}

// --- Asset Sync ------------------------------------------------------------

/** Determine if a directory entry belongs to impm, deciding whether to clean it */
function isImpmOwned(dirType, name, srcNames, everSet) {
    if (srcNames.has(name) || everSet.has(name)) {
        return true;
    }
    return (dirType === "commands" || dirType === "skills") && name.startsWith("impm");
}

/** Sync a single asset directory: clean impm-owned residuals then copy (preserving user/other plugin non-impm content) */
function syncAssetDir(dirType, srcDir, destDir, everList) {
    if (!existsSync(srcDir)) {
        console.warn(`  Skipping: source directory does not exist ${srcDir}`);
        return;
    }
    const srcNames = new Set(readdirSync(srcDir));
    const everSet = new Set(everList || []);
    if (existsSync(destDir)) {
        for (const entry of readdirSync(destDir, { withFileTypes: true })) {
            if (!isImpmOwned(dirType, entry.name, srcNames, everSet)) {
                continue;
            }
            try {
                rmSync(join(destDir, entry.name), { recursive: true, force: true });
            } catch {
                /* ignore cleanup failure */
            }
        }
    }
    copyDirRecursive(srcDir, destDir);
}

// --- Configuration Update -------------------------------------------------

/** Determine if two resolved paths are the same: on Windows (case-insensitive filesystem) compares case-insensitively */
function sameResolvedPath(a, b) {
    const pa = resolve(a);
    const pb = resolve(b);
    return process.platform === "win32"
        ? pa.toLowerCase() === pb.toLowerCase()
        : pa === pb;
}

/** Read all defined agent names under assets/agents */
function collectAgents(assetsDir) {
    const agentsDir = join(assetsDir, "agents");
    if (!existsSync(agentsDir)) {
        return [];
    }
    const agents = [];
    for (const file of readdirSync(agentsDir)) {
        if (file.endsWith(".md")) {
            agents.push(file.replace(/\.md$/, ""));
        }
    }
    return agents;
}

/** Read the scripts/agent-models.json preset definition file */
function loadAgentPresets(pluginRoot) {
    const presetsPath = join(pluginRoot, "scripts", "agent-models.json");
    if (!existsSync(presetsPath)) {
        return null;
    }
    try {
        return readJsonFile(presetsPath);
    } catch {
        return null;
    }
}

/** Apply agent model configuration to the target opencode.json */
function applyAgentConfig(config, agentType, assetsDir, pluginRoot, extraManagedAgents = []) {
    if (!agentType) {
        return;
    }

    const currentAgents = collectAgents(assetsDir);
    const cleanAgents = [...new Set([...currentAgents, ...extraManagedAgents])].filter(Boolean);

    if (agentType === "clear") {
        let cleaned = 0;
        if (config.agent && typeof config.agent === "object") {
            for (const name of cleanAgents) {
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
        console.log(`  agent-type=clear: cleaned ${cleaned} impm-managed agent model configurations`);
        return;
    }

    if (currentAgents.length === 0) {
        return;
    }

    const presets = loadAgentPresets(pluginRoot);
    if (!presets) {
        return;
    }
    const preset = presets[agentType];
    if (!preset || !preset.agents) {
        console.error(`Error: unknown agent-type "${agentType}", valid values: ${AGENT_TYPES.join(", ")}`);
        return;
    }

    config.agent = config.agent || {};
    let synced = 0;
    let preserved = 0;
    for (const [name, setting] of Object.entries(preset.agents)) {
        const existing = config.agent[name];
        if (agentType === "custom" && existing && existing.model) {
            preserved++;
            continue;
        }
        config.agent[name] = {
            ...(existing || {}),
            model: setting.model,
            reasoning_effort: setting.reasoning_effort,
        };
        synced++;
    }

    const msg = [`  Applied preset ${agentType}: wrote model configuration for ${synced} agents`];
    if (preserved > 0) {
        msg.push(`, preserved ${preserved} existing custom configurations`);
    }
    console.log(msg.join(""));
}

/** Ensure .opencode/package.json declares type: module */
function ensureOpenCodePackageJson(opencodeDir) {
    const pkgPath = join(opencodeDir, "package.json");
    let pkg = {};
    if (existsSync(pkgPath)) {
        try {
            pkg = readJsonFile(pkgPath);
        } catch {
            console.warn(`  Failed to parse .opencode/package.json, will recreate`);
        }
    }
    if (pkg.type !== "module") {
        pkg.type = "module";
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
        console.log("Updated .opencode/package.json (type: module, ensures plugin entry is parsed as ESM)");
        return true;
    }
    return false;
}

/** Determine if a plugin registration entry is a stale impm registration */
function isStaleImpmPlugin(p) {
    if (typeof p === "string") {
        return p === PACKAGE_NAME || p.toLowerCase().includes("impm");
    }
    if (p && typeof p === "object") {
        const n = String(p.name || p.entry || "");
        return n.toLowerCase().includes("impm");
    }
    return false;
}

/** Update target opencode.json: add $schema, register plugins, apply agent model presets */
function updateOpenCodeConfig(projectRoot, agentType, assetsDir, pluginRoot, manifest = null) {
    const configPath = join(projectRoot, "opencode.json");
    mkdirSync(projectRoot, { recursive: true });

    let config = {};
    if (existsSync(configPath)) {
        try {
            config = readJsonFile(configPath);
        } catch {
            console.warn("  Failed to parse opencode.json, will recreate");
        }
    }

    config["$schema"] = config["$schema"] || "https://opencode.ai/config.json";

    const isSelfInstall = sameResolvedPath(pluginRoot, projectRoot);

    if (!isSelfInstall) {
        const plugins = Array.isArray(config.plugin)
            ? config.plugin.filter((p) => !isStaleImpmPlugin(p))
            : [];
        for (const p of DEFAULT_PLUGINS) {
            if (!plugins.includes(p)) {
                plugins.push(p);
            }
        }
        config.plugin = plugins;
        console.log(`  Config updated: ${configPath} (plugin: ${DEFAULT_PLUGINS.join(", ")})`);
    } else {
        console.log("  Local self-install: skipping config.plugin registration");
    }

    const extraAgents = manifest
        ? manifest.everInstalled.agents.map((f) => f.replace(/\.md$/i, ""))
        : [];
    applyAgentConfig(config, agentType, assetsDir, pluginRoot, extraAgents);

    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

// --- Main Entry -----------------------------------------------------------

/**
 * Execute the full install flow
 *
 * @param {object} options
 * @param {string} options.pluginRoot   - Plugin package root directory (contains assets/, dist/, scripts/)
 * @param {string} options.projectRoot  - Target project root directory (assets copied to projectRoot/.opencode/)
 * @param {string} options.version      - Current plugin version number (written to manifest)
 * @param {string} [options.agentType]  - Agent model preset type (empty = do not modify agent config)
 * @param {string} [options.opencodeDirOverride] - Asset installation directory override (default projectRoot/.opencode);
 *                                          passed as the opencode global config directory for global installs (~/.config/opencode)
 */
export function runInstall({ pluginRoot, projectRoot, version, agentType = "", opencodeDirOverride = "" }) {
    const assetsDir = join(pluginRoot, "assets");
    const distDir = join(pluginRoot, "dist");
    const opencodeDir = opencodeDirOverride || join(projectRoot, ".opencode");

    console.log("============================================");
    console.log("  opencode-impm install");
    console.log("============================================");
    console.log("");
    console.log(`Plugin directory: ${pluginRoot}`);
    console.log(`Target project: ${projectRoot}`);
    console.log(`Version: ${version || "(unknown)"}`);
    if (agentType) {
        console.log(`agent-type: ${agentType}`);
    }
    console.log("");

    if (!existsSync(assetsDir)) {
        console.error("Error: assets directory does not exist");
        console.error(`       ${assetsDir}`);
        return false;
    }

    // Read historical cumulative manifest (if absent, treat as first install)
    let manifest = loadManifest(opencodeDir);

    // Sync asset directories
    for (const dir of ASSET_DIRS) {
        const srcDir = join(assetsDir, dir);
        const destDir = join(opencodeDir, dir);

        if (!existsSync(srcDir)) {
            console.warn(`  Skipping: source directory does not exist ${srcDir}`);
            continue;
        }

        console.log(`Copying ${dir}/ -> ${destDir}/ ...`);
        syncAssetDir(dir, srcDir, destDir, manifest ? manifest.everInstalled[dir] : null);
    }

    // Cumulative manifest
    const everByDir = {};
    for (const dir of ASSET_DIRS) {
        const srcDir = join(assetsDir, dir);
        everByDir[dir] = existsSync(srcDir) ? readdirSync(srcDir) : [];
    }
    if (!manifest) {
        manifest = { installedVersion: version || "", everInstalled: everByDir, pluginNames: [], pkgJsonTypeModule: false };
    } else {
        manifest.installedVersion = version || manifest.installedVersion || "";
        for (const dir of ASSET_DIRS) {
            mergeEver(manifest, dir, everByDir[dir]);
        }
    }

    // Install local plugin (skip for self-install scenario)
    const isSelfInstall = sameResolvedPath(pluginRoot, projectRoot);

    if (!isSelfInstall) {
        const pluginDest = join(opencodeDir, "plugins", "impm");
        const pluginEntry = join(opencodeDir, "plugins", "impm.js");
        if (existsSync(distDir)) {
            console.log("Installing local plugin -> .../plugins/impm/ ...");

            if (existsSync(pluginDest)) {
                rmSync(pluginDest, { recursive: true, force: true });
            }
            if (existsSync(pluginEntry)) {
                rmSync(pluginEntry, { force: true });
            }

            const pluginDestDir = join(pluginDest, "dist");
            mkdirSync(pluginDestDir, { recursive: true });

            if (existsSync(join(pluginRoot, "package.json"))) {
                cpSync(
                    join(pluginRoot, "package.json"),
                    join(pluginDest, "package.json"),
                );
            }
            copyDirRecursive(distDir, pluginDestDir);

            writeFileSync(pluginEntry, 'export { default } from "./impm/dist/index.js";\n', "utf-8");
            console.log("Generated plugin entry file -> .../plugins/impm.js");
        } else {
            console.warn(`  Skipping: dist directory does not exist: ${distDir}`);
        }
    }

    // Ensure ESM declaration
    const setTypeModule = ensureOpenCodePackageJson(opencodeDir);
    if (setTypeModule) {
        manifest.pkgJsonTypeModule = true;
    }

    console.log("");
    console.log("Updating opencode.json configuration...");
    if (!isSelfInstall && !manifest.pluginNames.includes(PACKAGE_NAME)) {
        manifest.pluginNames.push(PACKAGE_NAME);
    }
    updateOpenCodeConfig(projectRoot, agentType, assetsDir, pluginRoot, manifest);

    // Save manifest
    saveManifest(opencodeDir, manifest);
    console.log(`Install manifest saved -> ${manifestPath(opencodeDir)}`);

    console.log("");
    console.log("============================================");
    console.log("  Installation complete!");
    console.log("  Use the /impm command to start AI project manager full workflow development.");
    console.log("============================================");

    return true;
}
