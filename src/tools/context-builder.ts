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
 * Collects the requirement information relevant to a coding task and builds a compact context:
 *   task information + matching user story (PRD) + project information (project.md) + architecture-related sections (sad.md)
 */

import { existsSync, readFileSync } from "fs";
import { getDocPath } from "../utils/paths.js";
import { latestVersion, resolveAbbrev } from "../utils/project.js";

export const contextBuilderDefinition = {
    description:
        "Builds the task coding context: summarizes the task information, the matching user story (extracted from the PRD), the project information (project.md), and the architecture-related sections (sad.md) by taskId, and generates a compact context Markdown for the coding phase.",
};

/** Extract the section matching a user story id from the PRD */
function extractUserStory(prdContent: string, userStoryId?: string): string {
    if (!userStoryId) {
        return "(the task is not associated with a user story userStoryId)";
    }
    const lines = prdContent.split(/\r?\n/);
    const idToken = userStoryId.trim().toLowerCase();
    let start = -1;
    let startLevel = 0;
    for (let i = 0; i < lines.length; i++) {
        const m = /^(#{1,6})\s+(.*)$/.exec(lines[i].trim());
        if (m) {
            const heading = m[2].toLowerCase();
            if (start < 0 && heading.includes(idToken)) {
                start = i;
                startLevel = m[1].length;
                break;
            }
        }
    }
    if (start < 0) {
        return `(no user story section found in the PRD: ${userStoryId})`;
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

/** Extract the architecture sections relevant to the task from the SAD */
function extractSadSections(sadContent: string): string {
    const lines = sadContent.split(/\r?\n/);
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
        return "(no architecture sections related to the task found in sad.md)";
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
            return { success: false, error: "Missing required argument taskId (task ID)." };
        }
        const abbrev = resolveAbbrev(args.projectRoot, args.projectName);
        let version = args.version?.trim();
        if (!version) {
            version = latestVersion(args.projectRoot, abbrev) ?? undefined;
            if (!version) {
                return {
                    success: false,
                    error: `No version directory found (docs/${abbrev}-v{x.y.z}). Please run /impm-init or /impm-version-create to create a version directory first.`,
                };
            }
        }

        // 1. Task information
        const taskFile = getDocPath(args.projectRoot, abbrev, version, "task");
        if (!existsSync(taskFile)) {
            return {
                success: false,
                error: `The task list does not exist: ${taskFile}. Run /impm-task-create to generate the task list first.`,
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
        let userStory = "(PRD document missing)";
        const prdPath = getDocPath(args.projectRoot, abbrev, version, "prd");
        if (existsSync(prdPath)) {
            userStory = extractUserStory(readFileSync(prdPath, "utf8"), task.userStoryId);
        }

        // 3. Project information (project.md)
        let projectInfo = "(docs/project.md missing)";
        const projectPath = getDocPath(args.projectRoot, abbrev, version, "project");
        if (existsSync(projectPath)) {
            projectInfo = readFileSync(projectPath, "utf8");
        }

        // 4. Architecture-related sections (sad.md)
        let sadSections = "(docs/sad.md missing)";
        const sadPath = getDocPath(args.projectRoot, abbrev, version, "sad");
        if (existsSync(sadPath)) {
            sadSections = extractSadSections(readFileSync(sadPath, "utf8"));
        }

        const context = [
            `# Task Context (#${task.id} ${task.title ?? ""})`,
            "",
            "## 1. Task Information",
            "",
            "```json",
            JSON.stringify(task, null, 2),
            "```",
            "",
            "## 2. User Requirements",
            "",
            userStory,
            "",
            "## 3. Project Information",
            "",
            projectInfo,
            "",
            "## 4. System Architecture",
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
