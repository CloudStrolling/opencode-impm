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
 * impm_version tool
 * Version number management: current gets the current latest version number, next computes the next
 * version number (z value +1), init creates the version directory docs/{abbreviation}-v{version number}.
 * Version directory name convention: {project English abbreviation}-v{x.y.z} (x.y.z is the version number).
 */

import { existsSync, mkdirSync } from "fs";
import { normalizeVersion, scanVersionDirs, versionDir } from "../utils/paths.js";
import { incrementPatch, isValidVersion } from "../utils/version.js";
import { latestVersion, resolveAbbrev } from "../utils/project.js";

export const versionDefinition = {
    description:
        "Version number management: action=current gets the current latest version number under docs; action=next computes the next version number (when hintVersion is not passed, adds +1 to the z value of the largest version number; when hintVersion is passed, returns that version number directly and validates its format); action=init creates the version directory docs/{project English abbreviation}-v{version number} (uses the specified version number when hintVersion is passed, otherwise automatically takes the next version number). Use when creating a version directory or determining the current version number.",
};

/** Determine the version number: use hintVersion with priority when it is valid, otherwise the latest version patch+1, starting from 0.0.1 when there is no version directory; return null when hintVersion is invalid */
function pickVersion(args: {
    projectRoot: string;
    abbrev: string;
    hintVersion?: string;
}): string | null {
    const latest = latestVersion(args.projectRoot, args.abbrev);
    const hint = args.hintVersion?.trim();
    if (hint) {
        const v = normalizeVersion(hint);
        if (isValidVersion(v)) {
            return v;
        }
        return null;
    }
    if (latest) {
        return incrementPatch(latest);
    }
    return "0.0.1";
}

export function versionExecute(args: {
    projectRoot: string;
    action: "current" | "next" | "init";
    hintVersion?: string;
    projectName?: string;
}) {
    try {
        const abbrev = resolveAbbrev(args.projectRoot, args.projectName);
        const action = args.action;

        if (action === "current") {
            const latest = latestVersion(args.projectRoot, abbrev);
            return {
                success: true,
                action,
                abbrev,
                version: latest,
                versionDir: latest
                    ? versionDir(args.projectRoot, abbrev, latest)
                    : null,
                versions: listAll(args.projectRoot, abbrev),
                message: latest
                    ? `The current latest version number is ${latest}.`
                    : "No version directory found; please run /impm-init or /impm-version-create to create the version directory.",
            };
        }

        if (action === "next") {
            const next = pickVersion({
                projectRoot: args.projectRoot,
                abbrev,
                hintVersion: args.hintVersion,
            });
            if (!next) {
                return {
                    success: false,
                    action,
                    error: "The hintVersion format is invalid (should be x.y.z).",
                };
            }
            return {
                success: true,
                action,
                abbrev,
                version: next,
                versionDir: versionDir(args.projectRoot, abbrev, next),
                message: `The next version number is ${next}.`,
            };
        }

        if (action === "init") {
            const version = pickVersion({
                projectRoot: args.projectRoot,
                abbrev,
                hintVersion: args.hintVersion,
            });
            if (!version) {
                return {
                    success: false,
                    action,
                    error: "The hintVersion format is invalid (should be x.y.z).",
                };
            }
            const dir = versionDir(args.projectRoot, abbrev, version);
            const existed = existsSync(dir);
            if (!existed) {
                mkdirSync(dir, { recursive: true });
            }
            return {
                success: true,
                action,
                abbrev,
                version,
                versionDir: dir,
                created: !existed,
                message: existed
                    ? `The version directory already exists: ${dir}`
                    : `Created the version directory: ${dir}`,
            };
        }

        return { success: false, error: `Unknown action: ${action} (should be current/next/init)` };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}

/** List all version numbers in descending order of version (latest first) */
function listAll(projectRoot: string, abbrev: string): string[] {
    return scanVersionDirs(projectRoot, abbrev).sort(compareDesc);
}

/** Descending version comparison (number-aware, avoiding string sorting placing 0.10.0 before 0.9.0) */
function compareDesc(a: string, b: string): number {
    return b.localeCompare(a, undefined, { numeric: true });
}
