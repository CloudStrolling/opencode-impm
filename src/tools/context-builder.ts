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
 * impm_context_builder tool
 * Collects the related requirement information for a coding task and builds a compact context:
 *   task info + the matching user story (PRD) + project info (project.md) + architecture-related sections (sad.md)
 */

import { existsSync, readFileSync } from "fs";
import { getDocPath } from "../utils/paths.js";
import { latestVersion, resolveAbbrev } from "../utils/project.js";

/** Escape regular expression special characters for literal matching */
function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const contextBuilderDefinition = {
    description:
        "Build the task coding context: summarize the task info, the matching user story (extracted from the PRD), the project info (project.md) and the architecture-related sections (sad.md) by taskId, and generate a compact context Markdown for the coding phase.",
};

/** Extract the matching section from the PRD by user story ID */
function extractUserStory(prdContent: string, userStoryId?: string): string {
    if (!userStoryId) {
        return "（The task is not associated with a user story userStoryId）";
    }
    const lines = prdContent.split(/\r?\n/);
    const idToken = userStoryId.trim().toLowerCase();
    // Word boundary exact matching: avoid US-1 falsely matching sections like US-10 / US-12
    const idPattern = new RegExp(
        `(^|[^a-z0-9])${escapeRegExp(idToken)}([^a-z0-9]|$)`,
    );
    let start = -1;
    let startLevel = 0;
    for (let i = 0; i < lines.length; i++) {
        const m = /^(#{1,6})\s+(.*)$/.exec(lines[i].trim());
        if (m) {
            const heading = m[2].toLowerCase();
            if (start < 0 && idPattern.test(heading)) {
                start = i;
                startLevel = m[1].length;
                break;
            }
        }
    }
    if (start < 0) {
        return `（User story section not found in the PRD: ${userStoryId}）`;
    }
    const block = [lines[start]];
    for (let i = start + 1; i < lines.length; i++) {
        const m = /^(#{1,6})\s+/.exec(lines[i].trim());
        if (m && m[1].length <= startLevel) {
            break;
        }
        block.push(lines[i]);
    }
    return block.join("\n").trim();
}

/** Extract the architecture sections related to the task from the SAD */
function extractSadSections(sadContent: string): string {
    const lines = sadContent.split(/\r?\n/);
    // Only keep the sections whose headings contain architecture-related keywords
    const KEYWORDS = /overview|architecture|module|interface|api|data|technology|directory|structure|flow|process|security|deployment|environment|design|constraint|pattern/i;
    const sections: string[] = [];
    let current: string[] = [];
    let currentHeading = "";

    const flush = () => {
        if (currentHeading && current.length > 1) {
            sections.push(currentHeading + "\n" + current.slice(1).join("\n").trim());
        }
        current = [];
        currentHeading = "";
    };

    for (const line of lines) {
        const m = /^(#{1,6})\s+(.*)$/.exec(line.trim());
        if (m) {
            flush();
            if (KEYWORDS.test(m[2])) {
                currentHeading = line;
                current = [line];
            }
        } else if (currentHeading) {
            current.push(line);
        }
    }
    flush();

    if (sections.length === 0) {
        return "（No architecture section related to the task found in sad.md）";
    }
    return sections.join("\n\n");
}

export function contextBuilderExecute(args: {
    projectRoot: string;
    taskId: string;
    version?: string;
    projectName?: string;
}) {
    try {
        const taskId = args.taskId?.trim();
        if (!taskId) {
            return { success: false, error: "Missing required parameter taskId (task ID)." };
        }
        const abbrev = resolveAbbrev(args.projectRoot, args.projectName);
        let version = args.version?.trim();
        if (!version) {
            version = latestVersion(args.projectRoot, abbrev) ?? undefined;
            if (!version) {
                return {
                    success: false,
                    error: `No version directory found (docs/${abbrev}-v{x.y.z}). Please run /impm-init or /impm-version-create first to create the version directory.`,
                };
            }
        }

        // 1. Task info
        const taskFile = getDocPath(args.projectRoot, abbrev, version, "task");
        if (!existsSync(taskFile)) {
            return {
                success: false,
                error: `Task list does not exist: ${taskFile}. Please run /impm-task-create first to generate the task list.`,
            };
        }
        const taskList = JSON.parse(readFileSync(taskFile, "utf8"));
        const tasks = Array.isArray(taskList) ? taskList : taskList?.tasks ?? [];
        const task = tasks.find((t: { id: string }) => String(t.id) === taskId);
        if (!task) {
            return {
                success: false,
                error: `Task does not exist: #${taskId}.`,
            };
        }

        // 2. User story (PRD)
        let userStory = "（PRD document missing）";
        const prdPath = getDocPath(args.projectRoot, abbrev, version, "prd");
        if (existsSync(prdPath)) {
            userStory = extractUserStory(readFileSync(prdPath, "utf8"), task.userStoryId);
        }

        // 3. Project info (project.md)
        let projectInfo = "（docs/project.md missing）";
        const projectPath = getDocPath(args.projectRoot, abbrev, version, "project");
        if (existsSync(projectPath)) {
            projectInfo = readFileSync(projectPath, "utf8");
        }

        // 4. Architecture-related sections (sad.md)
        let sadSections = "（docs/sad.md missing）";
        const sadPath = getDocPath(args.projectRoot, abbrev, version, "sad");
        if (existsSync(sadPath)) {
            sadSections = extractSadSections(readFileSync(sadPath, "utf8"));
        }

        const context = [
            `# Task Context (#${task.id} ${task.title ?? ""})`,
            "",
            "## 1. Task Info",
            "",
            "```json",
            JSON.stringify(task, null, 2),
            "```",
            "",
            "## 2. User Requirements",
            "",
            userStory,
            "",
            "## 3. Project Info",
            "",
            projectInfo,
            "",
            "## 4. System Architecture Related",
            "",
            sadSections,
            "",
        ].join("\n");

        return {
            success: true,
            context,
            task,
            taskType: task.taskType ?? "common",
            userStoryId: task.userStoryId ?? null,
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
