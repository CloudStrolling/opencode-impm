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
 * Version progress table version_progress.md management:
 *   - init: Create progress table (header: Step No. | Step Name | Step Status | Start Time |
 *     Duration(s) | Input Token | Output Token | Cache Read | Cache Write | Total Token),
 *     optionally write the first row (first row also records start time)
 *   - add: Insert a new row at the first position (seq = current max seq + 1, start time = current time);
 *     if the previous row exists and is not yet finalized, use the current time as the previous row's end time
 *     to calculate total duration (seconds), and query the opencode database by time window (previous row start
 *     time ~ current time) for token consumption of the step's main session and all child sessions (subagents),
 *     backfilling the 5 token columns
 *   - check: Query a step's latest status and overall progress
 *   - list: List all progress records
 *
 * File location: docs/{abbreviation}-v{version}/version_progress.md
 * Token data source: opencode SQLite database (message table assistant message
 * data.tokens, including cache hit cache.read / cache write cache.write,
 * reasoning tokens merged into output column)
 *
 * Step completion output convention: init writes first row, add inserts/deduplicates, finalize settles,
 * the returned result message always includes "current time", currentTime field returned separately,
 * ensuring current time is visible each time a step completion is output to the dialog
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { progressFilePath, normalizeVersion } from "../utils/paths.js";
import { latestVersion, resolveAbbrev } from "../utils/project.js";
import { defaultDbPath, openDb } from "./prompt-recorder.js";
import { withFileLock } from "../utils/file-lock.js";

/** All known step names (skill names) in the workflow, used to validate add/check stepName */
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
    "impm-init-task",
    "impm-init-testcase",
    "impm-init-commit",
    "impm-init-review",
    "impm-docs",
    "impm-docs-review",
    "impm-review-edition",
    "impm-hotfix",
    "impm-hotfix-fix",
    "impm-version-create",
    "impm-urs-create",
    "impm-prd-create",
    "impm-sad-update",
    "impm-dbd-create",
    "impm-api-create",
    "impm-lld-create",
    "impm-task-create",
    "impm-rtm-create",
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
    "impm-regression-metrics",
    "impm-coding-comment",
    "impm-coding-review",
    "impm-project-update",
    "impm-doc-merge",
    "impm-doc-update",
    "impm-deploy-update",
    "impm-git-merge",
    "impm-sprint",
    "impm-sprint-requirement",
    "impm-sprint-version-task",
    "impm-sprint-code",
    "impm-sprint-test",
    "impm-sprint-summary",
];

/** Historical/alias step names → canonical step names */
const STEP_ALIASES: Record<string, string> = {
    "impm-sad-create": "impm-sad-update",
};

/** Step name normalization: map historical aliases to canonical step names */
function normalizeStepName(stepName: string): string {
    const key = stepName.trim();
    const aliased = STEP_ALIASES[key];
    return aliased ?? key;
}

/** Whether the step name is a known workflow step */
function isKnownStep(stepName: string): boolean {
    return KNOWN_STEP_NAMES.includes(stepName);
}

export interface ProgressRow {
    seq: number;
    stepName: string;
    status: string;
    /** Start time yyyy-MM-dd HH:mm:ss (local timezone) */
    startTime?: string;
    /** Total duration (seconds, integer; finalized when next row is inserted) */
    duration?: string;
    /** Input token */
    input?: number;
    /** Output token (includes reasoning token) */
    output?: number;
    /** Cache hit (cache read) */
    cacheRead?: number;
    /** Cache write (cache write) */
    cacheWrite?: number;
    /** Total token (input + output + reasoning + cache hit + cache write) */
    total?: number;
}

/** Token window statistics (output column merges reasoning token) */
interface TokenStats {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
}

/** Millisecond timestamp → yyyy-MM-dd HH:mm:ss (local timezone) */
function formatTime(ms: number): string {
    const d = new Date(ms);
    const pad = (n: number): string => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Numeric cell: empty string / missing → undefined */
function toNum(v: string | undefined): number | undefined {
    if (v === undefined || v.trim() === "") {
        return undefined;
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}

/** Parse a single data row (compatible with old 3-column and new 10-column formats) */
function parseRow(cells: string[]): ProgressRow | null {
    if (cells.length < 3) {
        return null;
    }
    const seq = Number(cells[0]);
    if (!Number.isInteger(seq) || seq <= 0) {
        return null;
    }
    const row: ProgressRow = {
        seq,
        stepName: cells[1],
        status: cells[2],
    };
    if (cells.length >= 4) {
        row.startTime = cells[3] || undefined;
    }
    if (cells.length >= 5) {
        row.duration = cells[4] || undefined;
    }
    if (cells.length >= 6) {
        row.input = toNum(cells[5]);
    }
    if (cells.length >= 7) {
        row.output = toNum(cells[6]);
    }
    if (cells.length >= 8) {
        row.cacheRead = toNum(cells[7]);
    }
    if (cells.length >= 9) {
        row.cacheWrite = toNum(cells[8]);
    }
    if (cells.length >= 10) {
        row.total = toNum(cells[9]);
    }
    return row;
}

/** Parse progress table text into data row array (skip header and separator rows) */
function parseRows(content: string): ProgressRow[] {
    const rows: ProgressRow[] = [];
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
            continue;
        }
        if (/^\|\s*Step No\./.test(trimmed)) {
            continue;
        }
        const cells = trimmed
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim());
        const row = parseRow(cells);
        if (row) {
            rows.push(row);
        }
    }
    return rows;
}

/** Render progress table Markdown text (title + header + data rows) */
function buildFile(abbrev: string, version: string, rows: ProgressRow[]): string {
    const lines = [
        `# Version Progress - ${abbrev}-v${normalizeVersion(version)}`,
        "",
        "| Step No. | Step Name | Step Status | Start Time | Duration(s) | Input Token | Output Token | Cache Read | Cache Write | Total Token |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ];
    for (const row of rows) {
        lines.push(
            `| ${row.seq} | ${row.stepName} | ${row.status} | ${row.startTime ?? ""} | ${row.duration ?? ""} | ${row.input ?? ""} | ${row.output ?? ""} | ${row.cacheRead ?? ""} | ${row.cacheWrite ?? ""} | ${row.total ?? ""} |`,
        );
    }
    return lines.join("\n") + "\n";
}

/**
 * Query token consumption for the project within a time window:
 * Sum up all assistant message tokens belonging to this project (session.directory matching project root)
 * within [startMs, endMs) (main session + all child sessions/subagents).
 * Returns null if the query fails (database unreadable, etc.).
 */
async function queryWindowTokens(
    dbPath: string,
    projectRoot: string,
    startMs: number,
    endMs: number,
): Promise<TokenStats | null> {
    try {
        const opened = await openDb(dbPath);
        try {
            // On Windows projectRoot uses backslashes, database uses forward slashes; normalize and compare lowercase
            const dir = projectRoot
                .replace(/\\/g, "/")
                .replace(/\/+$/, "")
                .toLowerCase();
            const rows = opened.db
                .prepare(
                    `SELECT m.data FROM message m
                     JOIN session s ON s.id = m.session_id
                     WHERE LOWER(s.directory) = ? AND m.time_created >= ? AND m.time_created < ?`,
                )
                .all(dir, startMs, endMs) as Array<{ data: string }>;
            let input = 0;
            let output = 0;
            let reasoning = 0;
            let cacheRead = 0;
            let cacheWrite = 0;
            for (const r of rows) {
                let info: Record<string, unknown> = {};
                try {
                    info = JSON.parse(r.data);
                } catch {
                    continue;
                }
                if (info.role !== "assistant") {
                    continue;
                }
                const t = (info.tokens || {}) as {
                    input?: number;
                    output?: number;
                    reasoning?: number;
                    cache?: { read?: number; write?: number };
                };
                input += Number(t.input) || 0;
                output += Number(t.output) || 0;
                reasoning += Number(t.reasoning) || 0;
                cacheRead += Number(t.cache?.read) || 0;
                cacheWrite += Number(t.cache?.write) || 0;
            }
            return {
                input,
                output: output + reasoning,
                cacheRead,
                cacheWrite,
                total: input + output + reasoning + cacheRead + cacheWrite,
            };
        } finally {
            opened.close();
        }
    } catch {
        return null;
    }
}

/**
 * Finalize a row: use endMs as end time to calculate total duration (seconds), and query token
 * consumption for that time window to backfill the 5 token columns. Only executes when the row
 * has a start time and is not yet finalized (total duration is empty).
 */
async function finalizeRow(
    row: ProgressRow,
    dbPath: string,
    projectRoot: string,
    endMs: number,
): Promise<{ duration: number; tokens: TokenStats | null } | null> {
    if (!row.startTime || row.duration !== undefined) {
        return null;
    }
    const startMs = Date.parse(row.startTime);
    if (Number.isNaN(startMs)) {
        return null;
    }
    const duration = Math.max(0, Math.round((endMs - startMs) / 1000));
    const tokens = await queryWindowTokens(dbPath, projectRoot, startMs, endMs);
    row.duration = String(duration);
    if (tokens) {
        row.input = tokens.input;
        row.output = tokens.output;
        row.cacheRead = tokens.cacheRead;
        row.cacheWrite = tokens.cacheWrite;
        row.total = tokens.total;
    }
    return { duration, tokens };
}

export const progressDefinition = {
    description:
        "Version progress management: action=init creates the version progress file version_progress.md (10-column table: Step No., Step Name, Step Status, Start Time, Duration(s), Input Token, Output Token, Cache Read, Cache Write, Total Token); action=add inserts a new row at the first position (seq auto-increments from current max +1, start time = current time), if the previous row exists and is not yet finalized, uses current time as end time to calculate duration and queries the opencode database for token consumption of the step and subagent child sessions to backfill the 5 token columns; action=finalize settles the current last row (most recent step) duration and tokens before workflow exit (silently skips when no progress table exists, idempotent); action=check queries a step's latest status and overall progress; action=list lists all progress records. Use when recording and verifying workflow step status.",
};

export async function progressExecute(args: {
    projectRoot: string;
    action: "init" | "add" | "finalize" | "check" | "list";
    stepName?: string;
    status?: string;
    version?: string;
    projectName?: string;
    dbPath?: string;
}): Promise<Record<string, unknown>> {
    try {
        const abbrev = resolveAbbrev(args.projectRoot, args.projectName);
        // When version is not explicitly provided, automatically use the latest version directory under docs (consistent with impm_doc_writer behavior)
        let version = args.version?.trim() || "";
        if (!version) {
            version = latestVersion(args.projectRoot, abbrev) ?? "";
            if (!version) {
                return {
                    success: false,
                    error: "Missing required parameter version (version number), and no version directory found (docs/{abbreviation}-v{x.y.z}). Please run /impm-init or /impm-version-create first to create a version directory.",
                };
            }
        }
        const file = progressFilePath(args.projectRoot, abbrev, version);
        const action = args.action;
        const stepName = args.stepName ? normalizeStepName(args.stepName) : "";
        const status = args.status?.trim() || "Completed";
        const dbPath = (args.dbPath && args.dbPath.trim()) || defaultDbPath();

        if (action === "init") {
            // Read-modify-write with locking: serialize concurrent progress table initialization
            return await withFileLock(file, async () => {
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
                    rows.push({ seq: 1, stepName, status, startTime: formatTime(Date.now()) });
                }
                mkdirSync(dirname(file), { recursive: true });
                writeFileSync(file, buildFile(abbrev, version, rows), "utf8");
                const currentTime = formatTime(Date.now());
                return {
                    success: true,
                    action,
                    path: file,
                    currentTime,
                    rows,
                    message: rows.length
                        ? `Progress table created with first row (1 | ${stepName} | ${status} | start time ${rows[0].startTime}). Current time: ${currentTime}.`
                        : `Progress table created (header: Step No. | Step Name | Step Status | Start Time | Duration(s) | Input Token | Output Token | Cache Read | Cache Write | Total Token). Current time: ${currentTime}.`,
                };
            });
        }

        if (!existsSync(file)) {
            if (action === "finalize") {
                // No progress table (e.g., hotfix workflow) silently skips, not treated as error
                return {
                    success: true,
                    action,
                    skipped: true,
                    message: "version_progress.md does not exist, no finalization needed.",
                };
            }
            return {
                success: false,
                action,
                error: `version_progress.md does not exist: ${file}. Please run /impm-init or /impm-version-create first to create a version directory and progress table (impm_version action=init + impm_progress action=init).`,
            };
        }

        const content = readFileSync(file, "utf8");
        const rows = parseRows(content);

        if (action === "list") {
            return { success: true, action, path: file, rows, total: rows.length };
        }

        if (action === "check") {
            if (!stepName) {
                return { success: false, action, error: "Missing required parameter stepName (step name)." };
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

        if (action === "finalize") {
            // Finalize the current last row (most recent step): use current time as end time
            // to calculate total duration and query token consumption from opencode database for that step's window
            // (read-modify-write with locking and re-read latest content within lock, prevents concurrent task writes from losing rows)
            return await withFileLock(file, async () => {
                const lockedRows = parseRows(readFileSync(file, "utf8"));
                if (lockedRows.length === 0) {
                    return {
                        success: true,
                        action,
                        path: file,
                        skipped: true,
                        message: "Progress table is empty, no finalization needed.",
                    };
                }
                const prev = lockedRows[0];
                const settled = await finalizeRow(prev, dbPath, args.projectRoot, Date.now());
                if (!settled) {
                    return {
                        success: true,
                        action,
                        path: file,
                        skipped: true,
                        seq: prev.seq,
                        stepName: prev.stepName,
                        message: `Last row (${prev.stepName}) does not need finalization (no start time or already finalized).`,
                    };
                }
                writeFileSync(file, buildFile(abbrev, version, lockedRows), "utf8");
                const currentTime = formatTime(Date.now());
                let msg = `Finalized last row (${prev.stepName} | duration ${settled.duration} seconds`;
                msg += settled.tokens
                    ? ` | input ${settled.tokens.input} | output ${settled.tokens.output} | cache read ${settled.tokens.cacheRead} | cache write ${settled.tokens.cacheWrite} | total token ${settled.tokens.total}`
                    : ", token query failed";
                msg += `). Current time: ${currentTime}.`;
                return {
                    success: true,
                    action,
                    path: file,
                    currentTime,
                    seq: prev.seq,
                    stepName: prev.stepName,
                    duration: settled.duration,
                    tokens: settled.tokens,
                    message: msg,
                };
            });
        }

        if (action === "add") {
            // Read-modify-write with locking and re-read latest content within lock: serialize when concurrent tasks/sub-steps record progress simultaneously, prevents row loss
            return await withFileLock(file, async () => {
                const lockedRows = parseRows(readFileSync(file, "utf8"));
                if (!stepName) {
                    return { success: false, action, error: "Missing required parameter stepName (step name)." };
                }
                if (!isKnownStep(stepName)) {
                    return {
                        success: false,
                        action,
                        error: `Unknown step name: ${stepName}. Known steps: ${KNOWN_STEP_NAMES.join(", ")}`,
                    };
                }
                const now = Date.now();
                // If the previous row (current first row) is not yet finalized, finalize it with current time as end time
                // for total duration and token consumption (main session + subagent child sessions within the step window)
                let finalized: {
                    seq: number;
                    stepName: string;
                    duration: number;
                    tokens: TokenStats | null;
                } | null = null;
                if (lockedRows.length > 0) {
                    const prev = lockedRows[0];
                    const settled = await finalizeRow(prev, dbPath, args.projectRoot, now);
                    if (settled) {
                        finalized = {
                            seq: prev.seq,
                            stepName: prev.stepName,
                            duration: settled.duration,
                            tokens: settled.tokens,
                        };
                    }
                }
                const duplicate = lockedRows.some(
                    (r) => r.stepName === stepName && r.status === status,
                );
                const currentTime = formatTime(now);
                if (duplicate) {
                    let msg = `Duplicate record exists (${stepName} | ${status}), not inserted again. Current time: ${currentTime}.`;
                    if (finalized) {
                        msg += `Finalized previous row (${finalized.stepName} | duration ${finalized.duration} seconds`;
                        msg += finalized.tokens
                            ? ` | input ${finalized.tokens.input} | output ${finalized.tokens.output} | cache read ${finalized.tokens.cacheRead} | cache write ${finalized.tokens.cacheWrite} | total token ${finalized.tokens.total}`
                            : ", token query failed";
                        msg += ").";
                    }
                    return {
                        success: true,
                        action,
                        path: file,
                        currentTime,
                        duplicate: true,
                        seq: lockedRows.find((r) => r.stepName === stepName && r.status === status)?.seq,
                        finalized,
                        message: msg,
                    };
                }
                const maxSeq = lockedRows.reduce((m, r) => Math.max(m, r.seq), 0);
                const newRow: ProgressRow = {
                    seq: maxSeq + 1,
                    stepName,
                    status,
                    startTime: formatTime(now),
                };
                const newRows = [newRow, ...lockedRows];
                writeFileSync(file, buildFile(abbrev, version, newRows), "utf8");
                let msg = `New row inserted (seq ${newRow.seq}, ${stepName} | ${status}, start time ${newRow.startTime}). Current time: ${currentTime}.`;
                if (finalized) {
                    msg += `Finalized previous row (${finalized.stepName} | duration ${finalized.duration} seconds`;
                    msg += finalized.tokens
                        ? ` | input ${finalized.tokens.input} | output ${finalized.tokens.output} | cache read ${finalized.tokens.cacheRead} | cache write ${finalized.tokens.cacheWrite} | total token ${finalized.tokens.total}`
                        : ", token query failed";
                    msg += ").";
                }
                return {
                    success: true,
                    action,
                    path: file,
                    currentTime,
                    seq: newRow.seq,
                    stepName,
                    status,
                    startTime: newRow.startTime,
                    finalized,
                    message: msg,
                };
            });
        }

        return { success: false, error: `Unknown action: ${action} (should be init/add/finalize/check/list)` };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
