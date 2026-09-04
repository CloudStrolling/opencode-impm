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
 * Project information utility: parses key fields from docs/project.md, infers project English abbreviation.
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

/** project.md field name → parsing regex mapping table (line-by-line matching) */
const FIELD_MAP: Array<[keyof ProjectInfo, RegExp]> = [
    ["nameCn", /^\*{0,2}Project Name \(Chinese\)\*{0,2}\s*[:：]\s*(.+)$/i],
    ["nameEn", /^\*{0,2}Project Name \(English\)\*{0,2}\s*[:：]\s*(.+)$/i],
    ["abbrev", /^\*{0,2}Project Abbreviation\*{0,2}\s*[:：]\s*(\S+)$/i],
    ["language", /^\*{0,2}Programming Language\*{0,2}\s*[:：]\s*(.+)$/i],
    ["type", /^\*{0,2}Project Type\*{0,2}\s*[:：]\s*(.+)$/i],
    ["description", /^\*{0,2}General Introduction\*{0,2}\s*[:：]\s*(.+)$/i],
    ["database", /^\*{0,2}Database Product\*{0,2}\s*[:：]\s*(.+)$/i],
];

/** Read docs/project.md and parse key fields */
export function readProjectInfo(projectRoot: string): ProjectInfo {
    const file = join(docsRoot(projectRoot), "project.md");
    if (!existsSync(file)) {
        throw new Error(
            "docs/project.md does not exist. Please run /impm-init-project (or /impm-init) first to complete project initialization.",
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
    // When the abbreviation is not filled in the document, try to infer from the version directory name (docs/{abbrev}-v{x.y.z})
    if (!info.abbrev) {
        const inferred = inferAbbrevFromDirs(projectRoot);
        if (inferred) {
            info.abbrev = inferred;
        }
    }
    return info;
}

/** Infer abbreviation from version directory name: docs/{abbrev}-v{x.y.z} */
export function inferAbbrevFromDirs(projectRoot: string): string | null {
    const docs = docsRoot(projectRoot);
    if (!existsSync(docs)) {
        return null;
    }
    for (const name of readdirSync(docs)) {
        // Abbreviation is case-insensitive, aligned with character set allowed by resolveAbbrev
        const m = /^([a-z0-9_-]+)-v\d+\.\d+\.\d+$/i.exec(name);
        if (m) {
            return m[1];
        }
    }
    return null;
}

/**
 * Resolve project English abbreviation, priority:
 *   1. projectName parameter (if it is an ASCII identifier, e.g. impm)
 *   2. Project English abbreviation filled in docs/project.md
 *   3. Infer from version directory name (docs/{abbrev}-v{x.y.z})
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
        // project.md does not exist, continue trying other methods
    }
    const inferred = inferAbbrevFromDirs(projectRoot);
    if (inferred) {
        return inferred;
    }
    throw new Error(
        "Unable to determine project English abbreviation: please provide the projectName (project English abbreviation) parameter, or run /impm-init-project first to generate docs/project.md.",
    );
}

/** Safe abbreviation resolution that does not throw (returns null on failure) */
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

/** Get the latest version number (returns null if no version directory exists) */
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

/** Convert project info to display text */
export function formatProjectInfo(info: ProjectInfo): string {
    return [
        `Project Chinese Name: ${info.nameCn || "(not filled)"}`,
        `Project English Name: ${info.nameEn || "(not filled)"}`,
        `Project English Abbreviation: ${info.abbrev || "(not filled)"}`,
        `Programming Language: ${info.language || "(not filled)"}`,
        `Project Type: ${info.type || "(not filled)"}`,
        `Database Product: ${info.database || "(not filled)"}`,
    ].join("\n");
}