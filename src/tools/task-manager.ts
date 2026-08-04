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
 *   - init: validates and writes the task list (taskListJson)
 *   - query: queries tasks (returns a single task when taskId is given, otherwise a list summary)
 *   - next: returns the next executable task (not started and all of whose upstream tasks are completed)
 *   - update: updates a task status (not started | in progress | completed)
 *
 * Task statuses: not started | in progress | completed (case-insensitive on input, stored lowercase)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { getDocPath } from "../utils/paths.js";
import { resolveAbbrev } from "../utils/project.js";

export const TASK_STATUSES = ["not started", "in progress", "completed"] as const;

export interface TaskItem {
    id: string;
    title: string;
    status: string;
    [key: string]: unknown;
}

function taskFilePath(projectRoot: string, abbrev: string, version: string): string {
    return getDocPath(projectRoot, abbrev, version, "task");
}

export interface TaskListFile {
    payload: Record<string, unknown>;
    tasks: TaskItem[];
}

function normalizeStatus(status: unknown): string {
    const s = String(status ?? "").toLowerCase().trim();
    return TASK_STATUSES.includes(s as (typeof TASK_STATUSES)[number])
        ? s
        : "not started";
}

function readTaskList(file: string): TaskListFile {
    const data = JSON.parse(readFileSync(file, "utf8"));
    const tasks = Array.isArray(data) ? data : data?.tasks;
    if (!Array.isArray(tasks)) {
        throw new Error("Invalid task list format: should be an array of tasks or an object containing a tasks array.");
    }
    const payload =
        Array.isArray(data) || data === null || typeof data !== "object"
            ? {}
            : { ...data, tasks: undefined };
    delete payload.tasks;
    return { payload, tasks: tasks as TaskItem[] };
}

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

function upstreamDone(task: TaskItem, tasks: TaskItem[]): boolean {
    const upstream: unknown[] = (task.upstreamTaskIds ?? []) as unknown[];
    for (const id of upstream) {
        const up = tasks.find((t) => t.id === String(id));
        if (!up) {
            continue;
        }
        if (normalizeStatus(up.status) !== "completed") {
            return false;
        }
    }
    return true;
}

function summaryOf(tasks: TaskItem[]) {
    const byStatus: Record<string, number> = {};
    for (const t of tasks) {
        const s = normalizeStatus(t.status);
        byStatus[s] = (byStatus[s] ?? 0) + 1;
    }
    return {
        total: tasks.length,
        byStatus,
        pending: tasks
            .filter((t) => normalizeStatus(t.status) !== "completed")
            .map((t) => ({ id: t.id, title: t.title })),
    };
}

export const taskManagerDefinition = {
    description:
        "Task list management: action=init validates and writes the task list JSON (taskListJson); action=query queries tasks (returns a single task when taskId is passed, otherwise the list summary and unfinished tasks); action=next returns the next executable task (not started and all of whose upstream tasks are completed); action=update updates a task status (not started/in progress/completed). Use for task scheduling and status tracking.",
};

export function taskManagerExecute(args: {
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
            return { success: false, error: "Missing required argument version (version number)." };
        }
        const file = taskFilePath(args.projectRoot, abbrev, version);
        const action = args.action;

        if (action === "init") {
            const raw = args.taskListJson ?? "";
            let data: unknown;
            try {
                data = JSON.parse(raw);
            } catch {
                return {
                    success: false,
                    action,
                    error: "Failed to parse taskListJson; please check the JSON syntax.",
                };
            }
            const tasks = Array.isArray(data) ? data : (data as { tasks?: unknown })?.tasks;
            if (!Array.isArray(tasks) || tasks.length === 0) {
                return {
                    success: false,
                    action,
                    error: "The task list is empty or invalid: it must be an array of tasks, or an object containing a non-empty tasks array.",
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
                        error: "A task is missing the id field: every task must contain an id.",
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
                const status = normalizeStatus(t.status);
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
        }

        if (!existsSync(file)) {
            return {
                success: false,
                action,
                error: `The task list does not exist: ${file}. Run /impm-task-create to generate the task list first.`,
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
                        error: `Task does not exist: #${args.taskId}.`,
                    };
                }
                return { success: true, action, task };
            }
            return { success: true, action, path: file, ...summaryOf(tasks), tasks };
        }

        if (action === "next") {
            const candidate = tasks.find(
                (t) => normalizeStatus(t.status) !== "completed" && upstreamDone(t, tasks),
            );
            if (!candidate) {
                return {
                    success: true,
                    action,
                    task: null,
                    message: "No executable tasks: all tasks are completed, or the upstream/downstream dependencies of the remaining tasks are not ready.",
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
            const taskId = args.taskId;
            const status = normalizeStatus(args.status);
            if (!taskId) {
                return { success: false, action, error: "Missing required argument taskId (task ID)." };
            }
            if (!TASK_STATUSES.includes(status as (typeof TASK_STATUSES)[number])) {
                return {
                    success: false,
                    action,
                    error: `Invalid status: ${args.status ?? ""} (should be: not started/in progress/completed).`,
                };
            }
            const task = tasks.find((t) => t.id === taskId);
            if (!task) {
                return {
                    success: false,
                    action,
                    error: `Task does not exist: #${taskId}.`,
                };
            }
            task.status = status;
            writeTaskList(file, list.payload, tasks);
            return {
                success: true,
                action,
                task,
                message: `Task #${taskId} status updated to "${status}".`,
            };
        }

        return { success: false, error: `Unknown action: ${action} (should be init/query/next/update)` };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
