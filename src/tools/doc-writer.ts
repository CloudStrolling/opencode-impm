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
 * impm_doc_writer tool
 * Writes document content to the standard paths, automatically creating parent directories.
 * docType task validates the JSON format.
 */

import { mkdirSync, writeFileSync } from "fs";
import { dirname } from "path";
import { getDocPath, type DocType } from "../utils/paths.js";
import {
    latestVersion,
    resolveAbbrev,
    resolveAbbrevSafe,
} from "../utils/project.js";

/** Tool definition (description) exposed to the plugin registry */
export const docWriterDefinition = {
    description:
        "Writes project management documents: writes content to documents under docs from the standard paths (project, sad, urs, prd, dbd, api, lld, testcase, task, sql, review, context, cs, ws, etc.), automatically creating directories. docType task validates JSON validity.",
};

/**
 * Write a project management document to the standard path
 * @param args The tool arguments: projectRoot, docType, content, and optional projectName/version/taskId/target
 * @returns The written path and byte size on success, or { success: false, error }
 */
export function docWriterExecute(args: {
    projectRoot: string;
    docType: string;
    content: string;
    projectName?: string;
    version?: string;
    taskId?: string;
    target?: "version" | "main";
}) {
    try {
        const docType = args.docType as DocType;
        if (args.content === undefined || args.content === null) {
            return { success: false, error: "Missing required argument content (document content)." };
        }
        const content = String(args.content);
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

        // Validate the JSON format when writing the task list (must be an array, or an object with a non-empty tasks array)
        if (docType === "task") {
            try {
                const data = JSON.parse(content);
                const tasks = Array.isArray(data) ? data : data?.tasks;
                if (!Array.isArray(tasks) || tasks.length === 0) {
                    return {
                        success: false,
                        error: "Invalid task document JSON: the content must be an array of tasks, or an object containing a non-empty tasks array.",
                    };
                }
            } catch {
                return { success: false, error: "Failed to parse the task document JSON; please check the JSON syntax." };
            }
        }

        const path = getDocPath(args.projectRoot, abbrev, version, docType, {
            taskId: args.taskId,
            target,
        });
        // Create the parent directory when missing, then write the document content
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content, "utf8");

        return {
            success: true,
            path,
            docType,
            abbrev,
            version,
            bytes: Buffer.byteLength(content, "utf8"),
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
