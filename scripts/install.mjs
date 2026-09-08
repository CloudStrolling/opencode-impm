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
 * opencode-impm install script (CLI entry)
 *
 * Copies agents, commands, skills from assets/ to the target project's .opencode/ directory,
 * and copies the compiled plugin to .opencode/plugins/impm/ (opencode auto-loads local plugins).
 *
 * Usage scenarios:
 *   1. Local development install: npm install (postinstall auto-invoked, installs to current project)
 *   2. Install as npm dependency: npm install opencode-impm in the consumer project (postinstall auto-invoked)
 *   3. Manual target: node scripts/install.mjs --target /path/to/project
 *   4. Global install: node scripts/install.mjs --global (installs to opencode global config directory)
 *
 * Detection logic:
 *   - If --global flag is present, install to opencode global config directory (~/.config/opencode)
 *   - If --target parameter specifies a path, install to that path
 *   - If INIT_CWD environment variable exists and differs from current package directory, install to INIT_CWD (npm dependency install scenario)
 *   - Otherwise, install to current working directory (local development install scenario)
 *
 * Model configuration presets (--agent-type):
 *   - Valid values: opencode-zen-free / opencode-go-lite / opencode-go-balance /
 *             opencode-go-optimize / custom / clear
 *   - Each preset corresponds to a set of agent model + reasoning_effort settings, defined in scripts/agent-models.json.
 *   - Exits with error if the provided data does not exist.
 *   - custom preset is manually maintained: during installation, if the target opencode.json already has
 *     model configuration for an agent, it is preserved; only missing agents are filled in per preset
 *     (updating the plugin does not affect custom manual settings).
 *   - clear is a special value: cleans impm-managed agent model configurations in opencode.json, writes no settings.
 *   - No --agent-type passed: does not modify agent settings in opencode.json at all.
 *
 * Idempotent installation:
 *   - Maintains cumulative install manifest .opencode/impm-manifest.json (everInstalled only grows),
 *     and precisely cleans up historical removed/renamed residuals (including non-impm-prefixed agents) per manifest;
 *   - On first install (no manifest), uses heuristic cleanup (commands/skills by impm* prefix, each directory by same-name as source);
 *   - Before copying plugin dist, the entire old plugins/impm directory and entry file are deleted to avoid stale files.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve, isAbsolute, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { runInstall } from "./install-core.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PLUGIN_ROOT = resolve(__dirname, "..");

/** Global install target: opencode global config directory */
const GLOBAL_CONFIG_DIR = join(homedir(), ".config", "opencode");

/** Strip UTF-8 BOM (Windows editors often write BOM, causing JSON.parse to fail) */
function stripBom(text) {
    return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Read a JSON file (auto-strips BOM) */
function readJsonFile(filePath) {
    return JSON.parse(stripBom(readFileSync(filePath, "utf-8")));
}

/** Read the current plugin version number */
function getCurrentVersion() {
    const pkgPath = join(PLUGIN_ROOT, "package.json");
    if (!existsSync(pkgPath)) {
        return "";
    }
    try {
        return readJsonFile(pkgPath).version || "";
    } catch {
        return "";
    }
}

/** Parse --agent-type argument (also supports --agent_type spelling) */
function resolveAgentType(args) {
    for (const flag of ["--agent-type", "--agent_type"]) {
        const idx = args.indexOf(flag);
        if (idx !== -1 && idx + 1 < args.length) {
            return args[idx + 1];
        }
    }
    return "";
}

/** Determine if two resolved paths are the same: on Windows (case-insensitive filesystem) compares case-insensitively */
function sameResolvedPath(a, b) {
    const pa = resolve(a);
    const pb = resolve(b);
    return process.platform === "win32"
        ? pa.toLowerCase() === pb.toLowerCase()
        : pa === pb;
}

/** Resolve install target project: --global first, then --target, then INIT_CWD (npm dependency install scenario, excluding plugin's own directory), finally fallback to current directory */
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
    if (initCwd) {
        if (!sameResolvedPath(initCwd, PLUGIN_ROOT)) {
            return resolve(initCwd);
        }
    }

    return process.cwd();
}

// --- Main Flow -----------------------------------------------------------

function main() {
    const args = process.argv.slice(2);
    const isGlobal = args.includes("--global");
    const agentType = resolveAgentType(args);
    const targetRoot = resolveTargetProject(args);
    const version = getCurrentVersion();

    console.log("============================================");
    console.log("  opencode-impm install script");
    console.log("============================================");
    console.log("");
    console.log(`Plugin directory: ${PLUGIN_ROOT}`);
    console.log(`Target project: ${targetRoot}${isGlobal ? " (global install)" : ""}`);
    console.log(`agent-type: ${agentType || "(not specified, not modifying agent settings in opencode.json)"}`);
    console.log("");

    runInstall({
        pluginRoot: PLUGIN_ROOT,
        projectRoot: targetRoot,
        version,
        agentType,
        // Global install: place assets directly into the opencode global config directory (~/.config/opencode),
        // consistent with the directory scope of install.ps1 / uninstall.mjs --global
        opencodeDirOverride: isGlobal ? targetRoot : "",
    });
}

main();
