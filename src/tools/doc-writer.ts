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
 * Writes the document content to the standard path, automatically creating the parent directory.
 * When docType is task, the JSON format is validated automatically.
 *
 * Concurrent write conflict detection (expectedBase):
 *   During the coding phase the PM dispatches sub-step subagents concurrently in phase waves, and
 *   multiple tasks may write the same version-directory shared document at the same time (e.g.
 *   testcase/dbd/api/ui-test-record, api-test scripts). The writer merges and writes back based on
 *   the latest full text it read, and may pass expectedBase=the latest full text read; if at write
 *   time the file has been modified by another task (current content != expectedBase), the write is
 *   rejected and a conflict error (including the current latest content) is returned, so the writer
 *   re-reads and merges before writing back, avoiding overwriting others' content based on a stale
 *   snapshot. When expectedBase is not passed, the original direct-overwrite behavior is kept
 *   (task-private files are unaffected).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname } from "path";
import { getDocPath, FIXED_PATH_DOC_TYPES, type DocType } from "../utils/paths.js";
import {
    latestVersion,
    resolveAbbrev,
    resolveAbbrevSafe,
} from "../utils/project.js";
import { withFileLock } from "../utils/file-lock.js";

export const docWriterDefinition = {
    description:
        "Write project management documents: write the content to the documents under docs by the standard path (project, sad, urs, prd, dbd, api, lld, testcase, task, sql, review, context, cs, ws, ui-test-record, regression-unit, regression-api, regression, rtm, apifox-openapi, apifox-postman, openapi, swagger, etc.), automatically creating the directory. When docType is task, validate the JSON validity. Optional expectedBase=the latest full text read before writing, used for concurrent conflict detection (when the file has been modified by another task, reject the write and return a conflict error, avoiding overwriting others' content).",
};

export async function docWriterExecute(args: {
    projectRoot: string;
    docType: string;
    content: string;
    projectName?: string;
    version?: string;
    taskId?: string;
    target?: "version" | "main";
    expectedBase?: string;
}) {
    try {
        const docType = args.docType as DocType;
        if (args.content === undefined || args.content === null) {
            return { success: false, error: "Missing required parameter content (document content)." };
        }
        const content = String(args.content);
        const target = args.target === "main" ? "main" : "version";

        // Fixed-path documents (project/sad/readme/agent/deploy) do not need a version directory; the other documents need the abbreviation and version number resolved
        const needsVersion = !FIXED_PATH_DOC_TYPES.includes(docType);
        let abbrev = "";
        let version = args.version;
        if (needsVersion) {
            abbrev = resolveAbbrev(args.projectRoot, args.projectName);
            if (!version) {
                version = latestVersion(args.projectRoot, abbrev) ?? undefined;
                if (!version) {
                    return {
                        success: false,
                        error: `No version directory found (docs/${abbrev}-v{x.y.z}). Please run /impm-init or /impm-version-create first to create the version directory.`,
                    };
                }
            }
        } else {
            abbrev = resolveAbbrevSafe(args.projectRoot, args.projectName) ?? "";
        }
        version = version ?? "";

        if (docType === "task") {
            try {
                const data = JSON.parse(content);
                const tasks = Array.isArray(data) ? data : data?.tasks;
                if (!Array.isArray(tasks) || tasks.length === 0) {
                    return {
                        success: false,
                        error: "The task document JSON is invalid: the content must be a task array, or an object containing a non-empty tasks array.",
                    };
                }
            } catch {
                return { success: false, error: "Failed to parse the task document JSON. Please check the JSON syntax." };
            }
        }

        const path = getDocPath(args.projectRoot, abbrev, version, docType, {
            taskId: args.taskId,
            target,
        });

        // The concurrent write conflict detection + the write are wrapped entirely inside a file lock,
        // guaranteeing the atomicity of "read-compare-write" and eliminating the TOCTOU window:
        // two writers enter sequentially after locking, and the latter can only see the former's modification.
        return await withFileLock(path, () => {
            // When expectedBase exists and the file already exists, if the current content differs from
            // the stale snapshot the writer based on, it means it has been modified by another parallel
            // task; reject the write and return the latest content for re-merging (avoid an overall
            // overwrite based on the stale snapshot)
            if (args.expectedBase !== undefined && existsSync(path)) {
                const current = readFileSync(path, "utf8");
                if (current !== args.expectedBase) {
                    return {
                        success: false,
                        conflict: true,
                        error: `Concurrent write conflict: the document has been modified by another task, and the write based on the stale snapshot was rejected. Please re-read the latest content of this document, merge this task's content, and then call impm_doc_writer to write back (pass the latest full text as expectedBase). Document: ${path}`,
                        path,
                        docType,
                        abbrev,
                        version,
                        current,
                    };
                }
            }

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
        });
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
