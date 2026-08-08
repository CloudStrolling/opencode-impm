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
 * opencode-impm install script
 *
 * Copies agents, commands, and skills from assets/ to the .opencode/ directory of the target
 * project, and copies the compiled plugin to .opencode/plugins/impm/ (opencode automatically
 * loads local plugins).
 *
 * Usage:
 *   1. Local development install: npm install (postinstall invokes it automatically, installs into the current project)
 *   2. Installed as an npm dependency: npm install opencode-impm in the consuming project (postinstall invokes it automatically)
 *   3. Manually specify a target: node scripts/install.mjs --target /path/to/project
 *
 * Detection logic:
 *   - If the --target argument specifies a path, install to that path
 *   - If the INIT_CWD environment variable exists and differs from the package directory, install to INIT_CWD (npm dependency install scenario)
 *   - Otherwise, install to the current working directory (local development install scenario)
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
import { join, dirname, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Paths and constants ------------------------------------------------
// Plugin root (the directory containing package.json), the assets directory holding
// the resources to copy (commands/agents/skills), and the compiled plugin output (dist/)
const PLUGIN_ROOT = resolve(__dirname, "..");
const ASSETS_DIR = join(PLUGIN_ROOT, "assets");
const DIST_DIR = join(PLUGIN_ROOT, "dist");

// The asset subdirectories copied into .opencode/, and the npm package name registered in opencode.json
const ASSET_DIRS = ["commands", "agents", "skills"];
const PACKAGE_NAME = "opencode-impm";

/**
 * Determine the target project directory.
 * Priority: --target argument > INIT_CWD (npm dependency install scenario) >
 * the current working directory (local development install scenario)
 * @param args The command-line arguments
 * @returns The absolute path of the target project root
 */
function resolveTargetProject(args) {
    const targetIndex = args.indexOf("--target");
    if (targetIndex !== -1 && targetIndex + 1 < args.length) {
        const target = args[targetIndex + 1];
        return isAbsolute(target) ? target : resolve(process.cwd(), target);
    }

    const initCwd = process.env.INIT_CWD;
    if (initCwd) {
        if (resolve(initCwd) !== PLUGIN_ROOT) {
            return resolve(initCwd);
        }
    }

    return process.cwd();
}

/**
 * Recursively copy a directory tree
 * @param src The source directory
 * @param dest The destination directory (created when missing)
 * @param clean When true, empty the destination first so repeated installs stay idempotent
 */
function copyDirRecursive(src, dest, clean = false) {
    if (!existsSync(src)) {
        console.warn(`  Skip: source directory does not exist ${src}`);
        return;
    }

    if (clean && existsSync(dest)) {
        const entries = readdirSync(dest, { withFileTypes: true });
        for (const entry of entries) {
            const destPath = join(dest, entry.name);
            if (entry.isDirectory()) {
                rmSync(destPath, { recursive: true, force: true });
            } else {
                rmSync(destPath, { force: true });
            }
        }
    }

    mkdirSync(dest, { recursive: true });

    const entries = readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else if (entry.isFile()) {
            cpSync(srcPath, destPath);
        }
    }
}

/**
 * Ensure .opencode/package.json declares type: module so the generated plugin entry file
 * (which uses ESM export syntax) is resolved correctly by opencode
 * @param opencodeDir The .opencode/ directory of the target project
 */
function ensureOpenCodePackageJson(opencodeDir) {
    const pkgPath = join(opencodeDir, "package.json");
    let pkg = {};
    if (existsSync(pkgPath)) {
        try {
            pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        } catch {
            console.warn(`  Failed to parse .opencode/package.json; it will be rebuilt`);
        }
    }
    if (pkg.type !== "module") {
        pkg.type = "module";
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
        console.log("Updated .opencode/package.json (type: module, so the plugin entry is resolved as ESM)");
    }
}

/**
 * Update the target project's opencode.json: ensure the $schema field and register the plugin
 * name (skipped for the local self-install, where the plugin entry under .opencode/plugins/
 * is auto-discovered)
 * @param projectRoot The target project root
 */
function updateOpenCodeConfig(projectRoot) {
    const configPath = join(projectRoot, "opencode.json");

    let config = {};
    if (existsSync(configPath)) {
        try {
            config = JSON.parse(readFileSync(configPath, "utf-8"));
        } catch {
            console.warn("  Failed to parse opencode.json; it will be recreated");
        }
    }

    config["$schema"] =
        config["$schema"] || "https://opencode.ai/config.json";

    const isSelfInstall = resolve(projectRoot) === PLUGIN_ROOT;
    if (!isSelfInstall) {
        const plugins = Array.isArray(config.plugin) ? [...config.plugin] : [];
        if (!plugins.includes(PACKAGE_NAME)) {
            plugins.push(PACKAGE_NAME);
        }
        config.plugin = plugins;
        console.log(`  Config file updated: ${configPath} (plugin: ${PACKAGE_NAME})`);
    } else {
        console.log("  Local self-install: skip config.plugin registration (local plugins are loaded automatically from .opencode/plugins/)");
    }

    writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

function main() {
    // --- Argument parsing ------------------------------------------------
    // Parse the command-line arguments (--target) and resolve the install target project
    const args = process.argv.slice(2);
    const targetRoot = resolveTargetProject(args);

    console.log("============================================");
    console.log("  opencode-impm install script");
    console.log("============================================");
    console.log("");
    console.log(`Plugin directory: ${PLUGIN_ROOT}`);
    console.log(`Assets directory: ${ASSETS_DIR}`);
    console.log(`Target project: ${targetRoot}`);
    console.log("");

    // Abort when the assets directory is missing (the script is not running in the plugin directory)
    if (!existsSync(ASSETS_DIR)) {
        console.error("Error: the assets directory does not exist; make sure this script is run in the opencode-impm plugin directory");
        console.error(`       ${ASSETS_DIR}`);
        process.exit(1);
    }

    const opencodeDir = join(targetRoot, ".opencode");

    // --- Asset copying ----------------------------------------------------
    // 1. Copy commands/agents/skills into .opencode/ (cleaning each target first)
    for (const dir of ASSET_DIRS) {
        const srcDir = join(ASSETS_DIR, dir);
        const destDir = join(opencodeDir, dir);

        if (!existsSync(srcDir)) {
            console.warn(`  Skip: assets directory does not exist ${srcDir}`);
            continue;
        }

        console.log(`Copying ${dir}/ -> .opencode/${dir}/ ...`);
        // clean=true: empty the target directory before copying to avoid stale files from repeated installs (idempotent install)
        copyDirRecursive(srcDir, destDir, true);
    }

    // --- Plugin installation ----------------------------------------------
    // 2. Install the compiled plugin into .opencode/plugins/impm/
    const pluginDest = join(opencodeDir, "plugins", "impm");
    if (existsSync(DIST_DIR)) {
        console.log("Installing local plugin -> .opencode/plugins/impm/ ...");

        const pluginDestDir = join(pluginDest, "dist");
        mkdirSync(pluginDestDir, { recursive: true });

        if (existsSync(join(PLUGIN_ROOT, "package.json"))) {
            cpSync(
                join(PLUGIN_ROOT, "package.json"),
                join(pluginDest, "package.json"),
            );
        }
        copyDirRecursive(DIST_DIR, pluginDestDir);

        // opencode only auto-discovers direct *.js/*.ts files under .opencode/plugins/ (it does not
        // recurse into subdirectories), so an entry file pointing to the dist build output must be
        // generated at the root of plugins/
        const pluginEntry = join(opencodeDir, "plugins", "impm.js");
        writeFileSync(pluginEntry, 'export { default } from "./impm/dist/index.js";\n', "utf-8");
        console.log("Generated plugin entry file -> .opencode/plugins/impm.js");
    } else {
        console.warn(`  Skip: dist directory does not exist (run npm run build first): ${DIST_DIR}`);
    }

    // Ensure .opencode/package.json declares ESM (the entry file impm.js uses the export syntax)
    ensureOpenCodePackageJson(opencodeDir);

    console.log("");

    // --- Plugin configuration ---------------------------------------------
    // 3. Update opencode.json to register the plugin for the consuming project
    console.log("Updating opencode.json config...");
    updateOpenCodeConfig(targetRoot);

    console.log("");
    console.log("============================================");
    console.log("  Installation complete!");
    console.log("  Use the /impm command to start the AI Project Manager full-workflow development.");
    console.log("============================================");
}

main();
