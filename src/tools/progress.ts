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
 * impm_progress tool
 * Version progress file version_progress.md management:
 *   - init: creates the progress file (header: Step No. | Step Name | Step Status), optionally writing the first row
 *   - add: inserts a new row at the first position of the table (sequence number = current max + 1)
 *   - check: queries the latest status of a step and the overall progress
 *   - list: lists all progress records
 *
 * File location: docs/{abbreviation}-v{version}/version_progress.md
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { progressFilePath, normalizeVersion } from "../utils/paths.js";
import { resolveAbbrev } from "../utils/project.js";

/** All known step names (skill names) in the workflow, used to validate the stepName of add/check */
export const KNOWN_STEP_NAMES: string[] = [
    "impm",
    "impm-init",
    "impm-init-isinit",
    "impm-init-git",
    "impm-init-project",
    "impm-init-version",
    "impm-init-urs",
    "impm-init-prd",
    "impm-init-sad",
    "impm-init-dbd",
    "impm-init-api",
    "impm-init-lld",
    "impm-init-testcase",
    "impm-init-commit",
    "impm-docs",
    "impm-version-create",
    "impm-urs-create",
    "impm-prd-create",
    "impm-sad-update",
    "impm-dbd-create",
    "impm-api-create",
    "impm-lld-create",
    "impm-task-create",
    "impm-analysis-commit",
    "impm-coding",
    "impm-task-coding",
    "impm-task-coding-context",
    "impm-task-coding-cs",
    "impm-task-coding-ws",
    "impm-task-coding-dbd",
    "impm-task-coding-api",
    "impm-task-coding-testcase",
    "impm-task-coding-code",
    "impm-task-coding-writetest",
    "impm-task-coding-runtest",
    "impm-task-coding-gitcommit",
    "impm-finish",
    "impm-regression-test",
    "impm-coding-comment",
    "impm-coding-review",
    "impm-project-update",
    "impm-doc-merge",
    "impm-doc-update",
    "impm-deploy-update",
    "impm-git-merge",
];

/** Historical/alias step names -> canonical step names */
const STEP_ALIASES: Record<string, string> = {
    "impm-sad-create": "impm-sad-update",
};

function normalizeStepName(stepName: string): string {
    const key = stepName.trim();
    const aliased = STEP_ALIASES[key];
    return aliased ?? key;
}

function isKnownStep(stepName: string): boolean {
    return KNOWN_STEP_NAMES.includes(stepName);
}

export interface ProgressRow {
    seq: number;
    stepName: string;
    status: string;
}

const ROW_RE = /^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/;
const HEADER_RE = /^\|\s*Step\s/i;

function parseRows(content: string): ProgressRow[] {
    const rows: ProgressRow[] = [];
    for (const line of content.split(/\r?\n/)) {
        if (ROW_RE.test(line) && !HEADER_RE.test(line)) {
            const m = ROW_RE.exec(line);
            if (m) {
                rows.push({
                    seq: parseInt(m[1], 10),
                    stepName: m[2].trim(),
                    status: m[3].trim(),
                });
            }
        }
    }
    return rows;
}

function buildFile(abbrev: string, version: string, rows: ProgressRow[]): string {
    const lines = [
        `# Version Progress - ${abbrev}-v${normalizeVersion(version)}`,
        "",
        "| Step No. | Step Name | Step Status |",
        "| --- | --- | --- |",
    ];
    for (const row of rows) {
        lines.push(`| ${row.seq} | ${row.stepName} | ${row.status} |`);
    }
    return lines.join("\n") + "\n";
}

export const progressDefinition = {
    description:
        "Version progress management: action=init creates the version progress file version_progress.md (a 3-column table: Step No., Step Name, Step Status); action=add inserts a new row at the first position of the table (sequence number is automatically the current max + 1); action=check queries the latest status of a step and the overall progress; action=list lists all progress records. Use when recording and verifying the status of workflow steps.",
};

export function progressExecute(args: {
    projectRoot: string;
    action: "init" | "add" | "check" | "list";
    stepName?: string;
    status?: string;
    version?: string;
    projectName?: string;
}) {
    try {
        const abbrev = resolveAbbrev(args.projectRoot, args.projectName);
        const version = args.version?.trim();
        if (!version) {
            return { success: false, error: "Missing required argument version (version number)." };
        }
        const file = progressFilePath(args.projectRoot, abbrev, version);
        const action = args.action;
        const stepName = args.stepName ? normalizeStepName(args.stepName) : "";
        const status = args.status?.trim() || "completed";

        if (action === "init") {
            if (existsSync(file)) {
                return {
                    success: false,
                    action,
                    error: `version_progress.md already exists: ${file}. Use action=add to append records.`,
                };
            }
            const rows: ProgressRow[] = [];
            if (stepName) {
                if (!isKnownStep(stepName)) {
                    return {
                        success: false,
                        action,
                        error: `Unknown step name: ${stepName}. Known steps: ${KNOWN_STEP_NAMES.join(", ")}`,
                    };
                }
                rows.push({ seq: 1, stepName, status });
            }
            mkdirSync(dirname(file), { recursive: true });
            writeFileSync(file, buildFile(abbrev, version, rows), "utf8");
            return {
                success: true,
                action,
                path: file,
                rows,
                message: rows.length
                    ? `Created the progress file and wrote the first row (1 | ${stepName} | ${status}).`
                    : "Created the progress file (header: Step No. | Step Name | Step Status).",
            };
        }

        if (!existsSync(file)) {
            return {
                success: false,
                action,
                error: `version_progress.md does not exist: ${file}. Run /impm-init or /impm-version-create first to create the version directory and progress file (impm_version action=init + impm_progress action=init).`,
            };
        }

        const content = readFileSync(file, "utf8");
        const rows = parseRows(content);

        if (action === "list") {
            return { success: true, action, path: file, rows, total: rows.length };
        }

        if (action === "check") {
            if (!stepName) {
                return { success: false, action, error: "Missing required argument stepName (step name)." };
            }
            const matched = rows.filter((r) => r.stepName === stepName);
            const distinctSteps = new Set(rows.map((r) => r.stepName));
            const doneSteps = new Set(
                rows.filter((r) => r.status === "completed").map((r) => r.stepName),
            );
            return {
                success: true,
                action,
                path: file,
                stepName,
                latestStatus: matched.length ? matched[matched.length - 1].status : null,
                rows: matched,
                summary: {
                    totalRows: rows.length,
                    distinctSteps: distinctSteps.size,
                    doneSteps: doneSteps.size,
                    doneRatio: distinctSteps.size
                        ? Math.round((doneSteps.size / distinctSteps.size) * 100)
                        : 0,
                },
            };
        }

        if (action === "add") {
            if (!stepName) {
                return { success: false, action, error: "Missing required argument stepName (step name)." };
            }
            if (!isKnownStep(stepName)) {
                return {
                    success: false,
                    action,
                    error: `Unknown step name: ${stepName}. Known steps: ${KNOWN_STEP_NAMES.join(", ")}`,
                };
            }
            const duplicate = rows.some(
                (r) => r.stepName === stepName && r.status === status,
            );
            if (duplicate) {
                return {
                    success: true,
                    action,
                    path: file,
                    duplicate: true,
                    seq: rows.find((r) => r.stepName === stepName && r.status === status)?.seq,
                    message: `An identical record already exists (${stepName} | ${status}); no duplicate was inserted.`,
                };
            }
            const maxSeq = rows.reduce((m, r) => Math.max(m, r.seq), 0);
            const newRow: ProgressRow = { seq: maxSeq + 1, stepName, status };
            const newRows = [newRow, ...rows];
            writeFileSync(file, buildFile(abbrev, version, newRows), "utf8");
            return {
                success: true,
                action,
                path: file,
                seq: newRow.seq,
                stepName,
                status,
                message: `Inserted a new row (seq ${newRow.seq}, ${stepName} | ${status}).`,
            };
        }

        return { success: false, error: `Unknown action: ${action} (should be init/add/check/list)` };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
