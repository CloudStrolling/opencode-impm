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
 * opencode-impm plugin entry
 *
 * This is the entry file of the "I am the Project Manager" (AI Project Manager) OpenCode plugin.
 * The plugin registers 15 custom tools: project info, initialization check, doc read/write, template
 * reading, version management, progress management, task scheduling, context building, project
 * analysis, git operations, plus 3 tools of the built-in prompt-recorder feature (prompt recording,
 * token backfill, conversation export), and 1 tool of the built-in heartbeat feature (subagent
 * heartbeat detection and hung restart).
 *
 * Usage:
 * 1. npm package mode: configure "plugin": ["opencode-impm"] in opencode.json
 * 2. Local mode: copy assets to .opencode/ via scripts/install.mjs, and configure the
 *    plugin path in opencode.json.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { projectInfoDefinition, projectInfoExecute, isInitDefinition, isInitExecute } from "./tools/project-state.js";
import { docReaderDefinition, docReaderExecute } from "./tools/doc-reader.js";
import { docWriterDefinition, docWriterExecute } from "./tools/doc-writer.js";
import { templateReaderDefinition, templateReaderExecute } from "./tools/template-reader.js";
import { versionDefinition, versionExecute } from "./tools/version.js";
import { progressDefinition, progressExecute } from "./tools/progress.js";
import { taskManagerDefinition, taskManagerExecute } from "./tools/task-manager.js";
import { contextBuilderDefinition, contextBuilderExecute } from "./tools/context-builder.js";
import { projectAnalyzerDefinition, projectAnalyzerExecute } from "./tools/project-analyzer.js";
import { gitHelperDefinition, gitHelperExecute } from "./tools/git-helper.js";
import { createPromptRecorder } from "./tools/prompt-recorder.js";
import { createHeartbeatMonitor } from "./tools/heartbeat.js";

/**
 * Create the schema for an OpenCode tool string argument
 * @param description the Chinese description of the argument
 */
function createStringSchema(description: string) {
    return { type: "string" as const, description };
}

/** Create the schema for an OpenCode tool string array argument (array of strings) */
function createArraySchema(description: string) {
    return {
        type: "array" as const,
        items: { type: "string" as const },
        description,
    };
}

/**
 * Tool result adaptation: the plugin tool bridging layer of opencode v1.18+ (tool/registry.ts)
 * only accepts either a string or { output: string } as the result shape, discarding all other
 * fields; returning a plain object leads to output=undefined, which in turn triggers a
 * text.split crash in the truncate layer (Cannot read properties of undefined (reading 'split')).
 * Consistently serialize object results into an output string.
 */
function toToolResult(result: unknown): unknown {
    if (typeof result === "string") {
        return result;
    }
    if (result && typeof result === "object") {
        const r = result as Record<string, unknown>;
        if (typeof r.output === "string") {
            return result;
        }
    }
    return { output: JSON.stringify(result, null, 2) };
}

/** Wrap a tool definition: convert the execute result into the shape compatible with the opencode bridging layer */
function wrapToolResult(def: {
    description?: string;
    args?: Record<string, unknown>;
    execute: (args: Record<string, unknown>) => Promise<unknown> | unknown;
}) {
    const execute = def.execute;
    return {
        ...def,
        execute: async (args: Record<string, unknown>) => toToolResult(await execute(args)),
    };
}

/** Plugin runtime context: the project path and working directory injected by OpenCode */
interface ToolContext {
    project: { path: string };
    directory: string;
    /**
     * OpenCode SDK client (injected by the newer plugin context; may be missing in older versions).
     * The heartbeat monitor uses it to abort a hung session (client.session.abort) and to inject
     * a continue-run instruction into the main session (client.session.chat).
     */
    client?: {
        session?: {
            abort?: (arg: unknown) => Promise<unknown>;
            chat?: (arg: unknown, body?: unknown) => Promise<unknown>;
        };
    };
}

/**
 * Plugin runtime environment info: the directory where the compiled output is located and the plugin package root directory
 * dist/index.js is located at {package root}/dist/, so the plugin root directory is one level up.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** Plugin package root directory (contains assets/, dist/, scripts/, package.json) */
const PLUGIN_ROOT = join(__dirname, "..");

/** Current plugin version number (read from the plugin package.json) */
function getPluginVersion(): string {
    try {
        const pkg = JSON.parse(
            readFileSync(join(PLUGIN_ROOT, "package.json"), "utf-8"),
        ) as { version?: string };
        return pkg.version || "";
    } catch {
        return "";
    }
}

/**
 * Ensure the target project has impm assets installed (agents/commands/skills).
 *
 * Version-aware installation: compares the installedVersion in .opencode/impm-manifest.json with the current plugin version.
 * When they match, skips directly (zero overhead); when they differ (first install / plugin upgrade),
 * dynamically loads scripts/install-core.mjs's runInstall to re-run the full installation
 * (clean stale files + copy new + update opencode.json).
 *
 * Background: when opencode auto-installs plugins via npm (ignoreScripts:true), postinstall is not executed.
 * Therefore, this plugin must self-check at entry function startup to ensure assets are always in sync with the plugin version.
 *
 * @param projectRoot Target project root directory (assets copied to its .opencode/)
 */
async function ensureInstalled(projectRoot: string): Promise<void> {
    try {
        const manifestPath = join(projectRoot, ".opencode", "impm-manifest.json");
        const currentVersion = getPluginVersion();

        // Read the installed version (if manifest is missing or corrupted, treat as first install)
        let installedVersion = "";
        if (existsSync(manifestPath)) {
            try {
                const m = JSON.parse(
                    readFileSync(manifestPath, "utf-8"),
                ) as { installedVersion?: string };
                installedVersion = m.installedVersion || "";
            } catch {
                /* ignore corrupted manifest, treat as first install */
            }
        }

        // Version matches -> skip (already installed on first startup or no upgrade)
        if (installedVersion === currentVersion) {
            return;
        }

        // First install or version upgrade -> dynamically load install core logic to execute full installation
        const corePath = pathToFileURL(join(PLUGIN_ROOT, "scripts", "install-core.mjs")).href;
        const core = (await import(corePath)) as {
            runInstall: (opts: {
                pluginRoot: string;
                projectRoot: string;
                version: string;
                agentType?: string;
            }) => boolean;
        };
        core.runInstall({
            pluginRoot: PLUGIN_ROOT,
            projectRoot,
            version: currentVersion,
        });
    } catch (err) {
        // Installation failure does not block plugin loading: log a warning, the rest of the plugin's functionality remains usable
        console.warn(
            `[opencode-impm] Auto-install assets failed (will retry on next startup): ${(err as Error)?.message ?? err}`,
        );
    }
}

/**
 * Plugin main function — called automatically by OpenCode when loading the plugin
 * @param context OpenCode runtime context, including the project path, working directory, etc.
 * @returns returns the tool registry, which OpenCode automatically registers for use by the Agent
 */
export default async function impmPlugin(context: ToolContext) {
    const projectRoot = context.project?.path || context.directory;

    // Startup self-check: if version differs, auto-sync assets (first install / plugin upgrade)
    await ensureInstalled(projectRoot);

    // Built-in feature: prompt-recorder (prompt recording + conversation export, with hooks and 3 manual tools)
    const promptRecorder = await createPromptRecorder(projectRoot);

    // Built-in feature: heartbeat (subagent heartbeat detection and automatic restart, with hooks and 1 manual tool)
    const heartbeat = await createHeartbeatMonitor(projectRoot, context.client);

    /** Combine multiple event hook handlers: a failure of any one does not affect the others (each hook catches internally) */
    const combinedEvent = async (input: { event: unknown }): Promise<void> => {
        await Promise.all([promptRecorder.event(input), heartbeat.event(input)]);
    };

    const tools = {
            /** Project info reading tool — parse the project basic info from docs/project.md */
            impm_project_info: {
                description: projectInfoDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                },
                async execute(args: Record<string, unknown>) {
                    return projectInfoExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                    });
                },
            },

            /** Initialization check tool — check whether the project has been initialized and whether it is an empty project */
            impm_isinit: {
                description: isInitDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                },
                async execute(args: Record<string, unknown>) {
                    return isInitExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                    });
                },
            },

            /** Doc reading tool — read various project management documents from the standard paths */
            impm_doc_reader: {
                description: docReaderDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    docType: createStringSchema(
                        "Doc type: project | sad | urs | prd | dbd | api | lld | testcase | task | sql | review | context | cs | ws | ui-test-record | regression-unit | regression-api | rtm | apifox-openapi | apifox-postman | readme | agent | deploy-build | deploy-deploy",
                    ),
                    projectName: createStringSchema(
                        "Project English abbreviation (optional; when not passed, it is inferred automatically from docs/project.md or the version directories)",
                    ),
                    version: createStringSchema(
                        "Version number (optional; when not passed, the latest version is obtained automatically)",
                    ),
                    taskId: createStringSchema(
                        "Task ID (required for the context/cs/ws documents; when passed for testcase, reads the testcase.md inside the task directory)",
                    ),
                    target: createStringSchema(
                        "Read location: version=version directory (default), main=the merged document under the docs root directory",
                    ),
                },
                async execute(args: Record<string, unknown>) {
                    return docReaderExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        docType: args.docType as string,
                        projectName: args.projectName as string | undefined,
                        version: args.version as string | undefined,
                        taskId: args.taskId as string | undefined,
                        target: args.target as "version" | "main" | undefined,
                    });
                },
            },

            /** Doc writing tool — write document content to the standard path, automatically creating directories */
            impm_doc_writer: {
                description: docWriterDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    docType: createStringSchema(
                        "Doc type: project | sad | urs | prd | dbd | api | lld | testcase | task | sql | review | context | cs | ws | ui-test-record | regression-unit | regression-api | rtm | apifox-openapi | apifox-postman | readme | agent | deploy-build | deploy-deploy",
                    ),
                    projectName: createStringSchema(
                        "Project English abbreviation (optional; when not passed, it is inferred automatically from docs/project.md or the version directories)",
                    ),
                    version: createStringSchema(
                        "Version number (optional; when not passed, the latest version is used automatically)",
                    ),
                    taskId: createStringSchema(
                        "Task ID (required for the context/cs/ws documents; when passed for testcase, writes the testcase.md inside the task directory)",
                    ),
                    target: createStringSchema(
                        "Write location: version=version directory (default), main=the merged document under the docs root directory",
                    ),
                    expectedBase: createStringSchema(
                        "Concurrent conflict detection baseline: the latest full text read before writing (optional). If the file was already modified by another task at write time (current content != expectedBase), the write is rejected and a conflict error is returned; re-read and merge before writing back",
                    ),
                    content: createStringSchema("Document content (Markdown or JSON text)"),
                },
                async execute(args: Record<string, unknown>) {
                    return docWriterExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        docType: args.docType as string,
                        projectName: args.projectName as string | undefined,
                        version: args.version as string | undefined,
                        taskId: args.taskId as string | undefined,
                        target: args.target as "version" | "main" | undefined,
                        expectedBase: args.expectedBase as string | undefined,
                        content: args.content as string,
                    });
                },
            },

            /** Template reading tool — read the standard template content */
            impm_template_reader: {
                description: templateReaderDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    templateName: createStringSchema(
                        "Template name (e.g. PROJECT-TEMPLATE.MD, TASK-TEMPLATE.json; the extension may be omitted)",
                    ),
                },
                async execute(args: Record<string, unknown>) {
                    return templateReaderExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        templateName: args.templateName as string,
                    });
                },
            },

            /** Version management tool — get the current version, compute the next version number, and create the version directory */
            impm_version: {
                description: versionDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    action: createStringSchema(
                        "Action: current=get the current latest version number, next=compute the next version number (z value +1), init=create the version directory",
                    ),
                    hintVersion: createStringSchema(
                        "Hint version number (used with priority when the user or the prompt has already specified a version number)",
                    ),
                    projectName: createStringSchema(
                        "Project English abbreviation (optional; when not passed, it is inferred automatically)",
                    ),
                },
                async execute(args: Record<string, unknown>) {
                    return versionExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        action: args.action as "current" | "next" | "init",
                        hintVersion: args.hintVersion as string | undefined,
                        projectName: args.projectName as string | undefined,
                    });
                },
            },

            /** Version progress management tool — create/record/query version_progress.md */
            impm_progress: {
                description: progressDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    action: createStringSchema(
                        "Action: init=create the progress table, add=insert a new row, finalize=settle the duration and tokens of the last row, check=query the step status and overall progress, list=list all records",
                    ),
                    stepName: createStringSchema(
                        "Step name (skill name, e.g. impm-init-urs; required for add/check)",
                    ),
                    status: createStringSchema(
                        "Step status (e.g. completed, in progress, no database needed, {task ID}-completed; used for add, default completed)",
                    ),
                    version: createStringSchema("Version number"),
                    projectName: createStringSchema(
                        "Project English abbreviation (optional; when not passed, it is inferred automatically)",
                    ),
                    dbPath: createStringSchema(
                        "The opencode database path (optional; default ~/.local/share/opencode/opencode.db)",
                    ),
                },
                async execute(args: Record<string, unknown>) {
                    return progressExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        action: args.action as "init" | "add" | "finalize" | "check" | "list",
                        stepName: args.stepName as string | undefined,
                        status: args.status as string | undefined,
                        version: args.version as string | undefined,
                        projectName: args.projectName as string | undefined,
                        dbPath: args.dbPath as string | undefined,
                    });
                },
            },

            /** Task status management tool — initialize/query/update the task list */
            impm_task_manager: {
                description: taskManagerDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    projectName: createStringSchema(
                        "Project English abbreviation (optional; when not passed, it is inferred automatically)",
                    ),
                    version: createStringSchema("Version number"),
                    action: createStringSchema(
                        "Action: init=initialize the task list, query=query tasks, next=get the next executable task, update=update the task status",
                    ),
                    taskId: createStringSchema("Task ID (used for query/update)"),
                    status: createStringSchema(
                        "New status (used for update): not started | in progress | completed",
                    ),
                    taskListJson: createStringSchema(
                        "Task list JSON string (required for init)",
                    ),
                },
                async execute(args: Record<string, unknown>) {
                    return taskManagerExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        projectName: args.projectName as string | undefined,
                        version: args.version as string | undefined,
                        action: args.action as "init" | "query" | "next" | "update",
                        taskId: args.taskId as string | undefined,
                        status: args.status as string | undefined,
                        taskListJson: args.taskListJson as string | undefined,
                    });
                },
            },

            /** Context building tool — collect related document excerpts for a coding task */
            impm_context_builder: {
                description: contextBuilderDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    projectName: createStringSchema(
                        "Project English abbreviation (optional; when not passed, it is inferred automatically)",
                    ),
                    version: createStringSchema(
                        "Version number (optional; when not passed, the latest version is used automatically)",
                    ),
                    taskId: createStringSchema("Task ID"),
                },
                async execute(args: Record<string, unknown>) {
                    return contextBuilderExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        projectName: args.projectName as string | undefined,
                        version: args.version as string | undefined,
                        taskId: args.taskId as string,
                    });
                },
            },

            /** Project structure analysis tool — scan the source code directories and generate the project map */
            impm_project_analyzer: {
                description: projectAnalyzerDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    sourceDirs: createArraySchema(
                        "The source code directories to scan (relative to the project root, e.g. src, app; when not passed, the top-level directories are scanned automatically after excluding system directories)",
                    ),
                    excludeDirs: createArraySchema(
                        "Additional directory names to exclude (comma-separated is also accepted)",
                    ),
                },
                async execute(args: Record<string, unknown>) {
                    const toArray = (v: unknown): string[] | undefined => {
                        if (Array.isArray(v)) {
                            return v.map(String);
                        }
                        if (typeof v === "string" && v.trim()) {
                            return v.split(",").map((s) => s.trim()).filter(Boolean);
                        }
                        return undefined;
                    };
                    return projectAnalyzerExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        sourceDirs: toArray(args.sourceDirs),
                        excludeDirs: toArray(args.excludeDirs),
                    });
                },
            },

            /** Git operation tool — wraps common operations such as branch creation/commit/merge/status query */
            impm_git: {
                description: gitHelperDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    action: createStringSchema(
                        "Action: init=initialize repository, status=view status, branch=create and switch branch, checkout=switch branch, commit=stage everything and commit, merge=switch back to the main branch and squash-merge, current-branch=current branch, pull=pull, log=commit log",
                    ),
                    branchName: createStringSchema("Branch name (used for branch/checkout/merge)"),
                    message: createStringSchema("Commit message (required for commit)"),
                },
                async execute(args: Record<string, unknown>) {
                    return gitHelperExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        action: args.action as string,
                        branchName: args.branchName as string | undefined,
                        message: args.message as string | undefined,
                    });
                },
            },

            /** Prompt recording tool (built-in prompt-recorder feature) — backfill the user prompts */
            impm_prompt_record: promptRecorder.tool.impm_prompt_record,
            /** Prompt recording tool (built-in prompt-recorder feature) — recompute tokens and backfill */
            impm_prompt_finalize: promptRecorder.tool.impm_prompt_finalize,
            /** Prompt recording tool (built-in prompt-recorder feature) — export the conversation snapshot */
            impm_prompt_export: promptRecorder.tool.impm_prompt_export,
            /** Heartbeat detection tool (built-in heartbeat feature) — view status/scan immediately/view alerts */
            impm_heartbeat: heartbeat.tool.impm_heartbeat,
        };

    return {
        /** chat.message hook: automatically record the user prompt to prompts.md */
        "chat.message": promptRecorder.chatMessage,
        /** Event hook: backfill tokens and export the conversation when the main session round ends; subagent heartbeat detection and hung automatic restart */
        event: combinedEvent,
        tool: Object.fromEntries(
            Object.entries(tools).map(([id, def]) => [id, wrapToolResult(def)]),
        ),
    };
}

/**
 * Export that is compatible with both ESM and CommonJS
 * OpenCode supports both default export and named export
 */
export { impmPlugin as plugin };
