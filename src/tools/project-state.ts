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
 * impm_project_info / impm_isinit tools
 *
 * - impm_project_info: reads docs/project.md and parses the project basic information.
 * - impm_isinit: checks whether the project has been initialized (project.md / sad.md exist),
 *   and determines whether it is an empty project (no source files other than system directories).
 */

import { existsSync } from "fs";
import { join } from "path";
import { listFilesRecursive } from "../utils/paths.js";
import { formatProjectInfo, readProjectInfo } from "../utils/project.js";

/** System directories excluded when determining an empty project */
const EXCLUDED_DIRS = new Set([
    "node_modules",
    ".git",
    "docs",
    "dist",
    "build",
    "coverage",
    ".opencode",
    "assets",
    "deploy",
    ".idea",
    ".vscode",
    "__pycache__",
    ".venv",
    "venv",
    "target",
    "out",
    "bin",
    "obj",
    ".next",
    ".nuxt",
    "vendor",
    ".cache",
]);

export const projectInfoDefinition = {
    description:
        "Reads the project basic information: parses the project Chinese name, English name, English abbreviation, programming language, project type, and overall introduction from docs/project.md. Use when obtaining the project abbreviation or determining the initialization mode during the initialization phase.",
};

export function projectInfoExecute(args: { projectRoot: string }) {
    try {
        const info = readProjectInfo(args.projectRoot);
        return {
            success: true,
            ...info,
            formatted: formatProjectInfo(info),
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}

export const isInitDefinition = {
    description:
        "Checks whether the project has been initialized: determines whether docs/project.md and docs/sad.md both exist and are non-empty, and scans the project root to determine whether it is an empty project (no files after excluding system directories such as node_modules, .git, and docs). Use when determining the project type (empty/existing) during the initialization phase.",
};

export function isInitExecute(args: { projectRoot: string }) {
    try {
        const root = args?.projectRoot?.trim();
        if (!root) {
            return {
                success: false,
                error: "Missing required argument projectRoot (the absolute path of the project root directory).",
            };
        }
        const projectMdPath = join(root, "docs", "project.md");
        const sadMdPath = join(root, "docs", "sad.md");

        const projectMdExists = existsSync(projectMdPath);
        const sadMdExists = existsSync(sadMdPath);

        let files: string[] = [];
        try {
            files = listFilesRecursive(root).filter((f) => {
                if (typeof f !== "string") {
                    return false;
                }
                const parts = f.split(/[\\/]/);
                return !parts.some((p) => EXCLUDED_DIRS.has(p));
            });
        } catch {
            files = [];
        }

        return {
            success: true,
            initialized: projectMdExists && sadMdExists,
            projectMd: projectMdExists,
            sadMd: sadMdExists,
            emptyProject: files.length === 0,
            sourceFileCount: files.length,
            hint:
                projectMdExists && sadMdExists
                    ? "The project is already initialized; enter the corresponding workflow phase directly."
                    : "The project is not initialized; run /impm-init to complete initialization. Empty projects are written with the standard structure, while existing projects are reverse-engineered and completed from the existing code.",
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
