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
 * impm_template_reader tool
 * Reads the template file by template name, in the following search order:
 *   1. project root/.opencode/skills/template/
 *   2. project root/assets/skills/template/
 *   3. plugin installation directory/assets/skills/template/
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join } from "path";

export const templateReaderDefinition = {
    description:
        "Read the template file: read the template content by template name from .opencode/skills/template, assets/skills/template, or the plugin's built-in directory (e.g. PROJECT-TEMPLATE.MD, TASK-TEMPLATE.json, etc.). Use when reading templates before generating various documents.",
};

/** Find the template in a directory: the file name and the template name are matched case-insensitively, and omitting the extension is supported */
function matchTemplate(dir: string, base: string): string | null {
    if (!existsSync(dir)) {
        return null;
    }
    for (const name of readdirSync(dir)) {
        if (name.toLowerCase() === base.toLowerCase()) {
            return join(dir, name);
        }
        const [stem] = name.split(".");
        if (stem?.toLowerCase() === base.toLowerCase()) {
            return join(dir, name);
        }
    }
    return null;
}

/** List all template file names in a directory (exclude hidden files) */
function listTemplates(dir: string): string[] {
    if (!existsSync(dir)) {
        return [];
    }
    return readdirSync(dir).filter((n) => !n.startsWith("."));
}

export function templateReaderExecute(args: {
    projectRoot: string;
    templateName: string;
}) {
    try {
        const name = (args.templateName ?? "").trim();
        if (!name) {
            return { success: false, error: "Missing required parameter templateName (template name)." };
        }
        const base = name.split(".")[0];

        const searchDirs = [
            join(args.projectRoot, ".opencode", "skills", "template"),
            join(args.projectRoot, "assets", "skills", "template"),
            fileURLToPath(new URL("../../assets/skills/template/", import.meta.url)),
        ];

        for (const dir of searchDirs) {
            const found = matchTemplate(dir, base);
            if (found) {
                return {
                    success: true,
                    path: found,
                    templateName: base,
                    content: readFileSync(found, "utf8"),
                };
            }
        }

        const available = new Set<string>();
        for (const dir of searchDirs) {
            for (const t of listTemplates(dir)) {
                available.add(t);
            }
        }
        return {
            success: false,
            error: `Template does not exist: ${name}`,
            available: [...available],
            hint: "Please choose from the available templates, or confirm the template has been placed in the .opencode/skills/template/ directory.",
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
