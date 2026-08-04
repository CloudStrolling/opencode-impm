/**
 * impm standard path utilities: unify the paths and naming conventions for all documents, scripts, and deployment files.
 */

import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

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
    | "readme"
    | "agent"
    | "deploy-build"
    | "deploy-deploy";

/** Doc types that live in a version directory */
export const VERSIONED_DOC_TYPES: DocType[] = [
    "urs",
    "prd",
    "dbd",
    "api",
    "lld",
    "testcase",
];

/** Doc types that live in a task directory */
export const TASK_DOC_TYPES: DocType[] = ["context", "cs", "ws"];

/** Normalize a version string: strip the v prefix, keep x.y.z */
export function normalizeVersion(version: string): string {
    return version.replace(/^[vV]/, "").trim();
}

/** docs directory */
export function docsRoot(projectRoot: string): string {
    return join(projectRoot, "docs");
}

/** Version directory: docs/{abbreviation}-v{version} */
export function versionDir(
    projectRoot: string,
    abbrev: string,
    version: string,
): string {
    return join(docsRoot(projectRoot), `${abbrev}-v${normalizeVersion(version)}`);
}

/** Task directory: docs/{abbreviation}-v{version}/task_{taskId} */
export function taskDir(
    projectRoot: string,
    abbrev: string,
    version: string,
    taskId: string,
): string {
    return join(versionDir(projectRoot, abbrev, version), `task_${taskId}`);
}

/** Version progress file: docs/{abbreviation}-v{version}/version_progress.md */
export function progressFilePath(
    projectRoot: string,
    abbrev: string,
    version: string,
): string {
    return join(versionDir(projectRoot, abbrev, version), "version_progress.md");
}

/**
 * Return the standard file path for a doc type.
 * task-type docs return {abbreviation}-task-v{version}.json;
 * context/cs/ws docs require taskId;
 * testcase docs with taskId return the testcase.md inside the task directory.
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
                throw new Error(`docType=${docType} requires taskId`);
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
        default:
            throw new Error(`Unknown doc type: ${docType}`);
    }
}

const VERSION_DIR_RE = /^([a-z0-9_-]+)-v(\d+\.\d+\.\d+)$/;

/** Scan version directories under docs and return the version numbers (no v prefix), sorted ascending */
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

/** Check whether a directory is empty (has no files) */
export function isDirEmpty(dir: string): boolean {
    if (!existsSync(dir)) {
        return true;
    }
    const entries = readdirSync(dir).filter((n) => !n.startsWith("."));
    return entries.length === 0;
}

/** Recursively list all files under a directory */
export function listFilesRecursive(dir: string): string[] {
    if (!existsSync(dir)) {
        return [];
    }
    const files: string[] = [];
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        try {
            if (statSync(full).isDirectory()) {
                files.push(...listFilesRecursive(full));
            } else {
                files.push(full);
            }
        } catch {
            // Ignore entries that cannot be accessed
        }
    }
    return files;
}

export { existsSync };
