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
 * impm standard path utility: unifies paths and naming rules for all documents, scripts, and deployment files.
 */

import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

/** Document type enum: determines document storage path and naming rules */
export type DocType =
    | "project"
    | "sad"
    | "urs"
    | "prd"
    | "dbd"
    | "api"
    | "lld"
    | "testcase"
    | "task"
    | "sql"
    | "review"
    | "context"
    | "cs"
    | "ws"
    | "ui-test-record"
    | "regression-unit"
    | "regression-api"
    | "regression"
    | "rtm"
    | "apifox-openapi"
    | "apifox-postman"
    | "readme"
    | "agent"
    | "deploy-build"
    | "deploy-deploy";

/** Fixed-path document types (no version directory required, located directly under docs/ or project root) */
export const FIXED_PATH_DOC_TYPES: DocType[] = [
    "project",
    "sad",
    "readme",
    "agent",
    "deploy-build",
    "deploy-deploy",
];

/** System directories excluded when scanning/judging empty projects */
export const EXCLUDED_DIRS: string[] = [
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
];

/** Normalize version number format: remove v prefix, keep x.y.z */
export function normalizeVersion(version: string): string {
    return version.replace(/^[vV]/, "").trim();
}

/** docs directory */
export function docsRoot(projectRoot: string): string {
    return join(projectRoot, "docs");
}

/** Version directory: docs/{abbrev}-v{version} */
export function versionDir(
    projectRoot: string,
    abbrev: string,
    version: string,
): string {
    return join(docsRoot(projectRoot), `${abbrev}-v${normalizeVersion(version)}`);
}

/** Task directory: docs/{abbrev}-v{version}/task_{taskId} */
export function taskDir(
    projectRoot: string,
    abbrev: string,
    version: string,
    taskId: string,
): string {
    return join(versionDir(projectRoot, abbrev, version), `task_${taskId}`);
}

/** Version progress file: docs/{abbrev}-v{version}/version_progress.md */
export function progressFilePath(
    projectRoot: string,
    abbrev: string,
    version: string,
): string {
    return join(versionDir(projectRoot, abbrev, version), "version_progress.md");
}

/**
 * Returns the standard file path by document type.
 * When docType is a task-type document, returns {abbrev}-task-v{version}.json;
 * When docType is context/cs/ws, taskId must be provided;
 * When docType is testcase and taskId is provided, returns testcase.md in the task directory.
 */
export function getDocPath(
    projectRoot: string,
    abbrev: string,
    version: string,
    docType: DocType,
    opts: { taskId?: string; target?: "version" | "main" } = {},
): string {
    const { taskId, target = "version" } = opts;
    switch (docType) {
        case "project":
            return join(docsRoot(projectRoot), "project.md");
        case "sad":
            return join(docsRoot(projectRoot), "sad.md");
        case "readme":
            return join(projectRoot, "readme.md");
        case "agent":
            return join(projectRoot, "agent.md");
        case "deploy-build":
            return join(projectRoot, "deploy", "build.md");
        case "deploy-deploy":
            return join(projectRoot, "deploy", "deploy.md");
        case "context":
        case "cs":
        case "ws":
            if (!taskId) {
                throw new Error(`docType=${docType} requires taskId to be provided`);
            }
            return join(taskDir(projectRoot, abbrev, version, taskId), `${docType}.md`);
        case "testcase":
            if (taskId) {
                return join(taskDir(projectRoot, abbrev, version, taskId), "testcase.md");
            }
            return target === "main"
                ? join(docsRoot(projectRoot), `${abbrev}-testcase.md`)
                : join(
                      versionDir(projectRoot, abbrev, version),
                      `${abbrev}-testcase-v${normalizeVersion(version)}.md`,
                  );
        case "urs":
        case "prd":
        case "dbd":
        case "api":
        case "lld":
            return target === "main"
                ? join(docsRoot(projectRoot), `${abbrev}-${docType}.md`)
                : join(
                      versionDir(projectRoot, abbrev, version),
                      `${abbrev}-${docType}-v${normalizeVersion(version)}.md`,
                  );
        case "sql":
            return target === "main"
                ? join(docsRoot(projectRoot), `${abbrev}-dbd.sql`)
                : join(
                      versionDir(projectRoot, abbrev, version),
                      `${abbrev}-dbd-v${normalizeVersion(version)}.sql`,
                  );
        case "task":
            return join(
                versionDir(projectRoot, abbrev, version),
                `${abbrev}-task-v${normalizeVersion(version)}.json`,
            );
        case "review":
            return join(versionDir(projectRoot, abbrev, version), `${abbrev}-review.md`);
        case "ui-test-record":
            return join(
                versionDir(projectRoot, abbrev, version),
                `${abbrev}-ui-test-record-v${normalizeVersion(version)}.md`,
            );
        case "regression-unit":
            return join(versionDir(projectRoot, abbrev, version), "regression-unit-test.md");
        case "regression-api":
            return join(versionDir(projectRoot, abbrev, version), "regression-api-test.md");
        case "regression":
            return join(versionDir(projectRoot, abbrev, version), "regression.md");
        case "rtm":
            return target === "main"
                ? join(docsRoot(projectRoot), `${abbrev}-rtm.md`)
                : join(
                      versionDir(projectRoot, abbrev, version),
                      `${abbrev}-rtm-v${normalizeVersion(version)}.md`,
                  );
        case "apifox-openapi":
            return join(
                versionDir(projectRoot, abbrev, version),
                `${abbrev}-apifox-openapi-v${normalizeVersion(version)}.json`,
            );
        case "apifox-postman":
            return join(
                versionDir(projectRoot, abbrev, version),
                `${abbrev}-apifox-postman-v${normalizeVersion(version)}.json`,
            );
        default:
            throw new Error(`Unknown document type: ${docType}`);
    }
}

/** Version directory name regex: {project-abbrev}-v{version} (abbrev case-insensitive, aligned with character set allowed by resolveAbbrev) */
const VERSION_DIR_RE = /^([a-z0-9_-]+)-v(\d+\.\d+\.\d+)$/i;

/** Scan version directories under docs, returns version number list (without v prefix), sorted ascending */
export function scanVersionDirs(
    projectRoot: string,
    abbrev?: string,
): string[] {
    const docs = docsRoot(projectRoot);
    if (!existsSync(docs)) {
        return [];
    }
    const versions: string[] = [];
    for (const name of readdirSync(docs)) {
        const m = VERSION_DIR_RE.exec(name);
        if (!m) {
            continue;
        }
        if (abbrev && m[1] !== abbrev) {
            continue;
        }
        versions.push(m[2]);
    }
    return versions;
}

/** Recursively list all files in a directory (defensive: skips invalid entries, limits recursion depth to prevent symlink/junction loops) */
export function listFilesRecursive(dir: string, depth = 0): string[] {
    if (typeof dir !== "string" || !dir || !existsSync(dir) || depth > 64) {
        return [];
    }
    const files: string[] = [];
    for (const name of readdirSync(dir)) {
        if (typeof name !== "string") {
            continue;
        }
        const full = join(dir, name);
        try {
            if (statSync(full).isDirectory()) {
                files.push(...listFilesRecursive(full, depth + 1));
            } else {
                files.push(full);
            }
        } catch {
            // Ignore inaccessible entries
        }
    }
    return files;
}