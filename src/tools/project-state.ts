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
 * - impm_project_info: reads docs/project.md and parses the project basic info.
 * - impm_isinit: checks whether the project has been initialized (whether project.md / sad.md
 *   exist), and determines whether it is an empty project (no source files except system
 *   directories).
 */

import { existsSync } from "fs";
import { join } from "path";
import { EXCLUDED_DIRS, listFilesRecursive } from "../utils/paths.js";
import { formatProjectInfo, readProjectInfo } from "../utils/project.js";

export const projectInfoDefinition = {
    description:
        "Read the project basic info: parse the project Chinese name, English name, English abbreviation, programming language, project type, and overall introduction from docs/project.md. Use for obtaining the project English abbreviation and determining the initialization mode during the initialization phase.",
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
        "Check whether the project has been initialized: determine whether docs/project.md and docs/sad.md both exist and are non-empty, and scan the project root directory to determine whether it is an empty project (no files after excluding system directories such as node_modules, .git, docs). Use for determining the project type (empty/existing) during the initialization phase.",
};

export function isInitExecute(args: { projectRoot: string }) {
    try {
        const root = args?.projectRoot?.trim();
        if (!root) {
            return {
                success: false,
                error: "Missing required parameter projectRoot (the absolute path of the project root directory).",
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
                return !parts.some((p) => EXCLUDED_DIRS.includes(p));
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
                    ? "The project has been initialized; directly proceed to the corresponding workflow phase."
                    : "The project has not been initialized; run /impm-init to complete the initialization. Empty projects are written with the standard structure, existing projects are reverse-engineered and completed based on the existing code.",
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
