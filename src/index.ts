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
 * The plugin registers 14 custom tools: project information, initialization determination, document
 * read/write, template reading, version management, progress management, task management, context
 * building, project analysis, git operations, and the 3 prompt-recorder built-in tools (prompt
 * recording, token backfill, conversation export).
 *
 * Built-in feature: prompt-recorder (prompt recording + conversation export, including a
 * chat.message hook, an event hook, and 3 manual tools: impm_prompt_record,
 * impm_prompt_finalize, impm_prompt_export).
 *
 * Usage:
 * 1. npm package mode: configure "plugin": ["opencode-impm"] in opencode.json
 * 2. Local mode: copy assets to .opencode/ via scripts/install.mjs,
 *    and configure the plugin path in opencode.json.
 */

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

/**
 * Create the JSON schema for an OpenCode tool argument
 * @param description The description of the argument
 */
function createStringSchema(description: string) {
    return { type: "string" as const, description };
}

function createArraySchema(description: string) {
    return {
        type: "array" as const,
        items: { type: "string" as const },
        description,
    };
}

/**
 * Tool result adaptation: the plugin tool bridge layer (tool/registry.ts) of
 * opencode v1.18+ only accepts two result shapes, a string or { output: string },
 * and drops all other fields; returning a plain object causes output=undefined,
 * which triggers a crash in the truncate layer's text.split
 * (Cannot read properties of undefined (reading 'split')).
 * Uniformly serialize object results into an output string.
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

/** Wrap a tool definition: convert the execute return value into the shape compatible with the opencode bridge layer */
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

interface ToolContext {
    project: { path: string };
    directory: string;
}

/**
 * Plugin main function - automatically called by OpenCode when loading the plugin
 * @param context The OpenCode runtime context, containing the project path, workspace, and other information
 * @returns The tool registry, which OpenCode automatically registers for the agents to use
 */
export default async function impmPlugin(context: ToolContext) {
    const projectRoot = context.project?.path || context.directory;

    // Built-in feature: prompt-recorder (prompt recording + conversation export, including hooks and 3 manual tools)
    const promptRecorder = await createPromptRecorder(projectRoot);

    const tools = {
            /** Project information tool - parses the project basic information from docs/project.md */
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

            /** Initialization determination tool - checks whether the project is initialized and whether it is an empty project */
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

            /** Document read tool - reads various project management documents from the standard paths */
            impm_doc_reader: {
                description: docReaderDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    docType: createStringSchema(
                        "Doc type: project | sad | urs | prd | dbd | api | lld | testcase | task | sql | review | context | cs | ws | ui-test-record | regression-unit | regression-api | readme | agent | deploy-build | deploy-deploy",
                    ),
                    projectName: createStringSchema(
                        "The project abbreviation (optional; inferred automatically from docs/project.md or the version directories when not provided)",
                    ),
                    version: createStringSchema(
                        "The version number (optional; the latest version is used automatically when not provided)",
                    ),
                    taskId: createStringSchema(
                        "The task ID (required for context/cs/ws documents; for testcase, reads the testcase.md inside the task directory when provided)",
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

            /** Document write tool - writes document content to the standard paths, automatically creating directories */
            impm_doc_writer: {
                description: docWriterDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    docType: createStringSchema(
                        "Doc type: project | sad | urs | prd | dbd | api | lld | testcase | task | sql | review | context | cs | ws | ui-test-record | regression-unit | regression-api | readme | agent | deploy-build | deploy-deploy",
                    ),
                    projectName: createStringSchema(
                        "The project abbreviation (optional; inferred automatically from docs/project.md or the version directories when not provided)",
                    ),
                    version: createStringSchema(
                        "The version number (optional; the latest version is used automatically when not provided)",
                    ),
                    taskId: createStringSchema(
                        "The task ID (required for context/cs/ws documents; for testcase, writes the testcase.md inside the task directory when provided)",
                    ),
                    target: createStringSchema(
                        "Write location: version=version directory (default), main=the merged document under the docs root directory",
                    ),
                    content: createStringSchema("The document content (Markdown or JSON text)"),
                },
                async execute(args: Record<string, unknown>) {
                    return docWriterExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        docType: args.docType as string,
                        projectName: args.projectName as string | undefined,
                        version: args.version as string | undefined,
                        taskId: args.taskId as string | undefined,
                        target: args.target as "version" | "main" | undefined,
                        content: args.content as string,
                    });
                },
            },

            /** Template read tool - reads the standard template content */
            impm_template_reader: {
                description: templateReaderDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    templateName: createStringSchema(
                        "The template name (e.g., PROJECT-TEMPLATE.MD, TASK-TEMPLATE.json; the extension may be omitted)",
                    ),
                },
                async execute(args: Record<string, unknown>) {
                    return templateReaderExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        templateName: args.templateName as string,
                    });
                },
            },

            /** Version management tool - gets the current version, computes the next version, and creates version directories */
            impm_version: {
                description: versionDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    action: createStringSchema(
                        "Action: current=get the current latest version, next=compute the next version (patch + 1), init=create a version directory",
                    ),
                    hintVersion: createStringSchema(
                        "The hint version (used with priority when the user or the prompt has already specified a version)",
                    ),
                    projectName: createStringSchema(
                        "The project abbreviation (optional; inferred automatically when not provided)",
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

            /** Version progress management tool - creates/records/queries version_progress.md */
            impm_progress: {
                description: progressDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    action: createStringSchema(
                        "Action: init=create the progress file, add=insert a new row, check=query the step status and overall progress, list=list all records",
                    ),
                    stepName: createStringSchema(
                        "The step name (skill name, e.g., impm-init-urs; required for add/check)",
                    ),
                    status: createStringSchema(
                        "The step status (e.g., completed, in progress, no database needed, {task ID}-completed; used for add, default completed)",
                    ),
                    version: createStringSchema("The version number"),
                    projectName: createStringSchema(
                        "The project abbreviation (optional; inferred automatically when not provided)",
                    ),
                },
                async execute(args: Record<string, unknown>) {
                    return progressExecute({
                        projectRoot: (args.projectRoot as string) || projectRoot,
                        action: args.action as "init" | "add" | "check" | "list",
                        stepName: args.stepName as string | undefined,
                        status: args.status as string | undefined,
                        version: args.version as string | undefined,
                        projectName: args.projectName as string | undefined,
                    });
                },
            },

            /** Task status management tool - initializes/queries/updates the task list */
            impm_task_manager: {
                description: taskManagerDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    projectName: createStringSchema(
                        "The project abbreviation (optional; inferred automatically when not provided)",
                    ),
                    version: createStringSchema("The version number"),
                    action: createStringSchema(
                        "Action: init=initialize the task list, query=query tasks, next=get the next executable task, update=update a task status",
                    ),
                    taskId: createStringSchema("The task ID (used for query/update)"),
                    status: createStringSchema(
                        "The new status (used for update): not started | in progress | completed",
                    ),
                    taskListJson: createStringSchema(
                        "The task list JSON string (required for init)",
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

            /** Context build tool - collects the document fragments relevant to a coding task */
            impm_context_builder: {
                description: contextBuilderDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    projectName: createStringSchema(
                        "The project abbreviation (optional; inferred automatically when not provided)",
                    ),
                    version: createStringSchema(
                        "The version number (optional; the latest version is used automatically when not provided)",
                    ),
                    taskId: createStringSchema("The task ID"),
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

            /** Project structure analysis tool - scans the source directories and generates a project map */
            impm_project_analyzer: {
                description: projectAnalyzerDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    sourceDirs: createArraySchema(
                        "The source code directories to scan (relative to the project root, e.g., src, app; when not provided, scans the top-level directories automatically after excluding system directories)",
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

            /** Git operation tool - wraps common operations such as branch creation/commit/merge/status queries */
            impm_git: {
                description: gitHelperDefinition.description,
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    action: createStringSchema(
                        "Action: init=initialize the repository, status=view status, branch=create and switch branch, checkout=switch branch, commit=stage everything and commit, merge=switch back to the main branch and squash-merge, current-branch=current branch, pull=pull, log=commit log",
                    ),
                    branchName: createStringSchema("The branch name (used for branch/checkout/merge)"),
                    message: createStringSchema("The commit message (required for commit)"),
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

            /** Prompt recording tool (prompt-recorder built-in feature) - backfills the user prompts */
            impm_prompt_record: promptRecorder.tool.impm_prompt_record,

            /** Prompt recording tool (prompt-recorder built-in feature) - recomputes the tokens and backfills them */
            impm_prompt_finalize: promptRecorder.tool.impm_prompt_finalize,

            /** Prompt recording tool (prompt-recorder built-in feature) - exports the conversation snapshot */
            impm_prompt_export: promptRecorder.tool.impm_prompt_export,
        };

    return {
        /** chat.message hook: automatically records the user prompt to prompts.md */
        "chat.message": promptRecorder.chatMessage,
        /** Event hook: automatically backfills the tokens and exports the conversation when the main session turn ends */
        event: promptRecorder.event,
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
