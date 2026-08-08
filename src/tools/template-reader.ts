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
 * Reads a template file by name. Search order:
 *   1. project root/.opencode/skills/template/
 *   2. project root/assets/skills/template/
 *   3. plugin installation directory/assets/skills/template/
 */

import { existsSync, readdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join } from "path";

/** Tool definition (description) exposed to the plugin registry */
export const templateReaderDefinition = {
    description:
        "Reads template files: reads template content by name from .opencode/skills/template, assets/skills/template, or the plugin's built-in directory (e.g., PROJECT-TEMPLATE.MD, TASK-TEMPLATE.json). Use before generating various documents to read the templates.",
};

/**
 * Find a template file in a directory by name (extension-insensitive match)
 * @param dir The directory to search
 * @param base The template stem (e.g., PROJECT-TEMPLATE)
 * @returns The full path of the matched file, or null when not found
 */
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

/** List the template file names of a directory (skipping dot files) */
function listTemplates(dir: string): string[] {
    if (!existsSync(dir)) {
        return [];
    }
    return readdirSync(dir).filter((n) => !n.startsWith("."));
}

/**
 * Read a template file by name from the standard search directories
 * @param args The tool arguments: projectRoot and templateName
 * @returns The template content on success, or an error with the available template list
 */
export function templateReaderExecute(args: {
    projectRoot: string;
    templateName: string;
}) {
    try {
        const name = (args.templateName ?? "").trim();
        if (!name) {
            return { success: false, error: "Missing required argument templateName (template name)." };
        }
        const base = name.split(".")[0];

        // Search order: project .opencode, project assets, then the plugin built-in assets
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

        // Collect the available templates from every search directory for the error hint
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
            hint: "Choose from the available templates, or make sure the template is placed in the .opencode/skills/template/ directory.",
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
