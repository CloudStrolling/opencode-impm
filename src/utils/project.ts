/**
 * Project information utilities: parse the key fields of docs/project.md and infer the project abbreviation.
 */

import { existsSync, readFileSync } from "fs";
import { readdirSync } from "fs";
import { join } from "path";
import { compareVersions } from "./version.js";
import { docsRoot, scanVersionDirs } from "./paths.js";

export interface ProjectInfo {
    nameCn: string;
    nameEn: string;
    abbrev: string;
    language: string;
    type: string;
    description: string;
    database: string;
}

const FIELD_MAP: Array<[keyof ProjectInfo, RegExp]> = [
    ["nameCn", /^\*{0,2}Project Name \(Chinese\)\*{0,2}\s*[:：]\s*(.+)$/i],
    ["nameEn", /^\*{0,2}Project Name \(English\)\*{0,2}\s*[:：]\s*(.+)$/i],
    ["abbrev", /^\*{0,2}Project Abbreviation\*{0,2}\s*[:：]\s*(\S+)$/i],
    ["language", /^\*{0,2}Programming Language\*{0,2}\s*[:：]\s*(.+)$/i],
    ["type", /^\*{0,2}Project Type\*{0,2}\s*[:：]\s*(.+)$/i],
    ["description", /^\*{0,2}General Introduction\*{0,2}\s*[:：]\s*(.+)$/i],
    ["database", /^\*{0,2}Database Product\*{0,2}\s*[:：]\s*(.+)$/i],
];

/** Read docs/project.md and parse its key fields */
export function readProjectInfo(projectRoot: string): ProjectInfo {
    const file = join(docsRoot(projectRoot), "project.md");
    if (!existsSync(file)) {
        throw new Error(
            "docs/project.md does not exist. Please run /impm-init-project (or /impm-init) to complete the project initialization first.",
        );
    }
    const content = readFileSync(file, "utf8");
    const info: ProjectInfo = {
        nameCn: "",
        nameEn: "",
        abbrev: "",
        language: "",
        type: "",
        description: "",
        database: "",
    };
    for (const line of content.split(/\r?\n/)) {
        for (const [key, re] of FIELD_MAP) {
            const m = re.exec(line.trim());
            if (m) {
                info[key] = m[1].trim();
            }
        }
    }
    if (!info.abbrev) {
        const inferred = inferAbbrevFromDirs(projectRoot);
        if (inferred) {
            info.abbrev = inferred;
        }
    }
    return info;
}

/** Infer the abbreviation from version directory names: docs/{abbreviation}-v{x.y.z} */
export function inferAbbrevFromDirs(projectRoot: string): string | null {
    const docs = docsRoot(projectRoot);
    if (!existsSync(docs)) {
        return null;
    }
    for (const name of readdirSync(docs)) {
        const m = /^([a-z0-9_-]+)-v\d+\.\d+\.\d+$/.exec(name);
        if (m) {
            return m[1];
        }
    }
    return null;
}

/**
 * Resolve the project abbreviation, with priority:
 *   1. the projectName argument (if it is an ASCII identifier such as impm)
 *   2. the Project Abbreviation field in docs/project.md
 *   3. inferred from version directory names (docs/{abbreviation}-v{x.y.z})
 */
export function resolveAbbrev(
    projectRoot: string,
    projectName?: string,
): string {
    if (projectName && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(projectName.trim())) {
        return projectName.trim();
    }
    try {
        const info = readProjectInfo(projectRoot);
        if (info.abbrev) {
            return info.abbrev;
        }
    } catch {
        // project.md does not exist; try the other ways
    }
    const inferred = inferAbbrevFromDirs(projectRoot);
    if (inferred) {
        return inferred;
    }
    throw new Error(
        "Cannot determine the project abbreviation: provide the projectName (project abbreviation) argument, or run /impm-init-project to generate docs/project.md first.",
    );
}

/** Abbreviation resolution that does not throw (returns null on failure) */
export function resolveAbbrevSafe(
    projectRoot: string,
    projectName?: string,
): string | null {
    try {
        return resolveAbbrev(projectRoot, projectName);
    } catch {
        return null;
    }
}

/** Get the current latest version number (null when there are no version directories) */
export function latestVersion(
    projectRoot: string,
    abbrev: string,
): string | null {
    const versions = scanVersionDirs(projectRoot, abbrev);
    if (versions.length === 0) {
        return null;
    }
    let max = versions[0];
    for (const v of versions.slice(1)) {
        if (compareVersions(v, max) > 0) {
            max = v;
        }
    }
    return max;
}

/** Convert project info into display text */
export function formatProjectInfo(info: ProjectInfo): string {
    return [
        `Project Name (Chinese): ${info.nameCn || "(not filled in)"}`,
        `Project Name (English): ${info.nameEn || "(not filled in)"}`,
        `Project Abbreviation: ${info.abbrev || "(not filled in)"}`,
        `Programming Language: ${info.language || "(not filled in)"}`,
        `Project Type: ${info.type || "(not filled in)"}`,
        `Database Product: ${info.database || "(not filled in)"}`,
    ].join("\n");
}
