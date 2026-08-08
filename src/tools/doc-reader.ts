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
 * impm_doc_reader tool
 * Reads URS/PRD/SAD/DBD/API/LLD/task and other documents from the standard paths.
 *
 * docType values:
 *   project | sad | urs | prd | dbd | api | lld | testcase | task | sql | review
 *   context | cs | ws | ui-test-record | regression-unit | regression-api
 *   readme | agent | deploy-build | deploy-deploy
 *
 * docType context/cs/ws requires taskId;
 * docType testcase with taskId reads the testcase.md inside the task directory;
 * target=main reads the merged document under the docs root directory.
 */

import { existsSync, readFileSync } from "fs";
import { basename, dirname } from "path";
import { getDocPath, type DocType } from "../utils/paths.js";
import {
    latestVersion,
    resolveAbbrev,
    resolveAbbrevSafe,
} from "../utils/project.js";

/** Tool definition (description) exposed to the plugin registry */
export const docReaderDefinition = {
    description:
        "Reads project management documents: reads documents under docs from the standard paths (project, sad, urs, prd, dbd, api, lld, testcase, task, sql, review, context, cs, ws, etc.). When reading the task list (task), returns the task summary and the full content.",
};

/**
 * Parse the task list JSON and summarize it by status
 * @param content The JSON text of the task list
 * @returns The total count, counts by status, and pending (non-completed) task titles; null when the JSON is invalid
 */
function parseTaskSummary(content: string) {
    try {
        const data = JSON.parse(content);
        const tasks = Array.isArray(data) ? data : data?.tasks ?? [];
        const byStatus: Record<string, number> = {};
        const pending: string[] = [];
        for (const t of tasks) {
            const s = (t.status ?? "not started").toLowerCase();
            byStatus[s] = (byStatus[s] ?? 0) + 1;
            if (s !== "completed") {
                pending.push(`#${t.id} ${t.title ?? ""}`.trim());
            }
        }
        return {
            total: tasks.length,
            byStatus,
            pending,
        };
    } catch {
        return null;
    }
}

/**
 * Read a project management document from the standard path
 * @param args The tool arguments: projectRoot, docType, and optional projectName/version/taskId/target
 * @returns The document content plus metadata on success, or { success: false, error }
 */
export function docReaderExecute(args: {
    projectRoot: string;
    docType: string;
    projectName?: string;
    version?: string;
    taskId?: string;
    target?: "version" | "main";
}) {
    try {
        const docType = args.docType as DocType;
        const target = args.target === "main" ? "main" : "version";

        // Unversioned doc types (project/sad/readme/agent/deploy) live under the docs root; the rest need a version directory
        const needsVersion = !["project", "sad", "readme", "agent", "deploy-build", "deploy-deploy"].includes(docType);
        let abbrev = "";
        let version = args.version;
        if (needsVersion) {
            abbrev = resolveAbbrev(args.projectRoot, args.projectName);
            if (!version) {
                version = latestVersion(args.projectRoot, abbrev) ?? undefined;
                if (!version) {
                    return {
                        success: false,
                        error: `No version directory found (docs/${abbrev}-v{x.y.z}). Please run /impm-init or /impm-version-create to create a version directory first.`,
                    };
                }
            }
        } else {
            abbrev = resolveAbbrevSafe(args.projectRoot, args.projectName) ?? "";
        }
        version = version ?? "";

        const path = getDocPath(args.projectRoot, abbrev, version, docType, {
            taskId: args.taskId,
            target,
        });

        if (!existsSync(path)) {
            return {
                success: false,
                error: `Document does not exist: ${path}`,
                hint: `The standard path should be: ${basename(dirname(path))}/${basename(path)}. Verify that the doc type, version number, and task ID are correct, or run the corresponding skill to generate the document first.`,
            };
        }

        const content = readFileSync(path, "utf8");
        const result: Record<string, unknown> = {
            success: true,
            path,
            docType,
            abbrev,
            version,
            content,
        };
        // For the task list, additionally return a status summary for a quick overview
        if (docType === "task") {
            const summary = parseTaskSummary(content);
            if (summary) {
                result.taskSummary = summary;
            }
        }
        return result;
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
