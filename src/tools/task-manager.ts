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
 * impm_task_manager tool
 * Task list {abbreviation}-task-v{version}.json management:
 *   - init: Validate and write task list (taskListJson)
 *   - query: Query tasks (returns single task when taskId is specified, otherwise returns list summary)
 *   - next: Return the next executable task (not completed and all upstream tasks are completed)
 *   - update: Update task status (not started | in progress | completed)
 *
 * Task status: not started | in progress | completed
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { getDocPath } from "../utils/paths.js";
import { resolveAbbrev } from "../utils/project.js";
import { withFileLock } from "../utils/file-lock.js";

/** Valid task status set */
export const TASK_STATUSES = ["not started", "in progress", "completed"] as const;

/** Task item: id/status are required fields, title, userStoryId, apiId, upstreamTaskIds and other fields are passed through */
export interface TaskItem {
    id: string;
    title: string;
    status: string;
    [key: string]: unknown;
}

/** Task list file path (follows standard document path rules) */
function taskFilePath(projectRoot: string, abbrev: string, version: string): string {
    return getDocPath(projectRoot, abbrev, version, "task");
}

export interface TaskListFile {
    payload: Record<string, unknown>;
    tasks: TaskItem[];
}

/** Read task list: compatible with both plain array and { payload, tasks } storage formats, separating additional info from task array */
function readTaskList(file: string): TaskListFile {
    const data = JSON.parse(readFileSync(file, "utf8"));
    const tasks = Array.isArray(data) ? data : data?.tasks;
    if (!Array.isArray(tasks)) {
        throw new Error("Invalid task list format: should be a task array or an object containing a tasks array.");
    }
    const payload =
        Array.isArray(data) || data === null || typeof data !== "object"
            ? {}
            : { ...data, tasks: undefined };
    delete payload.tasks;
    return { payload, tasks: tasks as TaskItem[] };
}

/** Write back task list: preserve additional info (payload) and serialize task array */
function writeTaskList(
    file: string,
    payload: Record<string, unknown>,
    tasks: TaskItem[],
): void {
    writeFileSync(
        file,
        JSON.stringify({ ...payload, tasks }, null, 4) + "\n",
        "utf8",
    );
}

/** Check whether all upstream dependencies of a task are completed (upstream task not existing is treated as completed) */
function upstreamDone(task: TaskItem, tasks: TaskItem[]): boolean {
    const upstream: unknown[] = (task.upstreamTaskIds ?? []) as unknown[];
    for (const id of upstream) {
        const up = tasks.find((t) => t.id === String(id));
        if (!up) {
            continue;
        }
        if (up.status !== "completed") {
            return false;
        }
    }
    return true;
}

/** Generate task list summary: total, count by status, list of not-started tasks */
function summaryOf(tasks: TaskItem[]) {
    const byStatus: Record<string, number> = {};
    for (const t of tasks) {
        const s = TASK_STATUSES.includes(t.status as (typeof TASK_STATUSES)[number])
            ? t.status
            : "not started";
        byStatus[s] = (byStatus[s] ?? 0) + 1;
    }
    return {
        total: tasks.length,
        byStatus,
        pending: tasks
            .filter((t) => t.status !== "completed")
            .map((t) => ({ id: t.id, title: t.title })),
    };
}

export const taskManagerDefinition = {
    description:
        "Task list management: action=init validates and writes the task list JSON (taskListJson); action=query queries tasks (returns single task when taskId is passed, otherwise returns list summary and not-started tasks); action=next returns the next executable task (not started and all upstream tasks completed); action=update updates task status (not started/in progress/completed). Use for task scheduling and status tracking.",
};

export async function taskManagerExecute(args: {
    projectRoot: string;
    action: "init" | "query" | "next" | "update";
    taskId?: string;
    status?: string;
    taskListJson?: string;
    version?: string;
    projectName?: string;
}) {
    try {
        const abbrev = resolveAbbrev(args.projectRoot, args.projectName);
        const version = args.version?.trim();
        if (!version) {
            return { success: false, error: "Missing required parameter version (version number)." };
        }
        const file = taskFilePath(args.projectRoot, abbrev, version);
        const action = args.action;

        if (action === "init") {
            // Read-modify-write with locking: prevents concurrent task list initialization from overwriting each other
            return await withFileLock(file, async () => {
                // Prevent accidental overwrite: when task list already exists, re-running init to overwrite is not supported, to avoid losing updated task statuses
                if (existsSync(file)) {
                    return {
                        success: false,
                        action,
                        error: `Task list already exists: ${file}. To rebuild, please confirm and handle manually in the version directory first to avoid overwriting updated task statuses.`,
                    };
                }
                const raw = args.taskListJson ?? "";
                let data: unknown;
                try {
                    data = JSON.parse(raw);
                } catch {
                    return {
                        success: false,
                        action,
                        error: "taskListJson JSON parsing failed, please check JSON syntax.",
                    };
                }
                const tasks = Array.isArray(data) ? data : (data as { tasks?: unknown })?.tasks;
                if (!Array.isArray(tasks) || tasks.length === 0) {
                    return {
                        success: false,
                        action,
                        error: "Task list is empty or invalid: must be a task array, or an object containing a non-empty tasks array.",
                    };
                }
                const seen = new Set<string>();
                const normalized: TaskItem[] = [];
                const payload: Record<string, unknown> =
                    data !== null && typeof data === "object" && !Array.isArray(data)
                        ? { ...data }
                        : {};
                delete payload.tasks;
                if (!payload.projectName) {
                    payload.projectName = abbrev;
                }
                payload.version = version;
                for (const t of tasks as Array<Record<string, unknown>>) {
                    if (!t || typeof t.id !== "string" && typeof t.id !== "number") {
                        return {
                            success: false,
                            action,
                            error: "Task missing id field: every task must include an id.",
                        };
                    }
                    const id = String(t.id);
                    if (seen.has(id)) {
                        return {
                            success: false,
                            action,
                            error: `Duplicate task id: ${id}.`,
                        };
                    }
                    seen.add(id);
                    const status = TASK_STATUSES.includes(t.status as (typeof TASK_STATUSES)[number])
                        ? (t.status as string)
                        : "not started";
                    normalized.push({ ...t, id, status } as TaskItem);
                }
                mkdirSync(dirname(file), { recursive: true });
                writeTaskList(file, payload, normalized);
                return {
                    success: true,
                    action,
                    path: file,
                    count: normalized.length,
                    message: `Wrote ${normalized.length} tasks.`,
                };
            });
        }

        if (!existsSync(file)) {
            return {
                success: false,
                action,
                error: `Task list does not exist: ${file}. Please run /impm-task-create first to generate the task list.`,
            };
        }

        const list = readTaskList(file);
        const tasks = list.tasks;

        if (action === "query") {
            if (args.taskId) {
                const task = tasks.find((t) => t.id === args.taskId);
                if (!task) {
                    return {
                        success: false,
                        action,
                        error: `Task not found: #${args.taskId}.`,
                    };
                }
                return { success: true, action, task };
            }
            return { success: true, action, path: file, ...summaryOf(tasks), tasks };
        }

        if (action === "next") {
            // Exclude "in progress" tasks: prevents the same task from being dispatched to multiple executors during concurrent scheduling
            const candidate = tasks.find(
                (t) => t.status !== "completed" && t.status !== "in progress" && upstreamDone(t, tasks),
            );
            if (!candidate) {
                return {
                    success: true,
                    action,
                    task: null,
                    message: "No pending tasks: all tasks are completed, or remaining tasks have unfinished upstream dependencies.",
                };
            }
            return {
                success: true,
                action,
                task: candidate,
                message: `Next executable task: #${candidate.id} ${candidate.title ?? ""}`,
            };
        }

        if (action === "update") {
            // Read-modify-write with locking: serialize concurrent task status updates (PM marking in progress / scm marking completed), prevents overwriting each other
            return await withFileLock(file, async () => {
                const taskId = args.taskId;
                const status = args.status?.trim();
                if (!taskId) {
                    return { success: false, action, error: "Missing required parameter taskId (task ID)." };
                }
                if (!status || !TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) {
                    return {
                        success: false,
                        action,
                        error: `Invalid status: ${status ?? ""} (should be: not started/in progress/completed).`,
                    };
                }
                const lockedList = readTaskList(file);
                const lockedTasks = lockedList.tasks;
                const task = lockedTasks.find((t) => t.id === taskId);
                if (!task) {
                    return {
                        success: false,
                        action,
                        error: `Task not found: #${taskId}.`,
                    };
                }
                task.status = status;
                writeTaskList(file, lockedList.payload, lockedTasks);
                return {
                    success: true,
                    action,
                    task,
                    message: `Task #${taskId} status updated to "${status}".`,
                };
            });
        }

        return { success: false, error: `Unknown action: ${action} (should be init/query/next/update)` };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
