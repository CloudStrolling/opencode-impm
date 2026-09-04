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
 * impm_project_analyzer tool
 * Scans the source code directories and generates a project map Markdown (list of files, functions
 * and classes). Used for reverse-engineering the structure of existing projects during initialization
 * and for updating the project map via impm-project-update.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { EXCLUDED_DIRS, listFilesRecursive } from "../utils/paths.js";

/** Code file extension → language */
const EXT_LANG: Record<string, string> = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".py": "Python",
    ".java": "Java",
    ".kt": "Kotlin",
    ".go": "Go",
    ".c": "C",
    ".cpp": "C++",
    ".h": "C/C++",
    ".hpp": "C++",
    ".cs": "C#",
    ".rs": "Rust",
    ".php": "PHP",
    ".rb": "Ruby",
    ".swift": "Swift",
    ".sql": "SQL",
    ".vue": "Vue",
    ".svelte": "Svelte",
};

/** Extract function/class names by language */
function extractSymbols(content: string, ext: string): string[] {
    const symbols: string[] = [];
    const add = (re: RegExp) => {
        for (const m of content.matchAll(re)) {
            if (m[1]) {
                symbols.push(m[1]);
            }
        }
    };
    switch (ext) {
        case ".ts":
        case ".tsx":
        case ".js":
        case ".jsx":
            add(/^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm);
            add(/^\s*(?:export\s+)?(?:default\s+)?class\s+([A-Za-z_$][\w$]*)/gm);
            add(/^\s*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/gm);
            break;
        case ".py":
            add(/^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)/gm);
            add(/^\s*class\s+([A-Za-z_]\w*)/gm);
            break;
        case ".java":
        case ".kt":
            add(/^\s*(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?(?:[\w<>\[\],.\s]+?)\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*(?:\{|throws|$)/gm);
            add(/^\s*(?:public|private|protected)?\s*(?:abstract\s+)?(?:class|interface|enum)\s+([A-Za-z_]\w*)/gm);
            break;
        case ".go":
            add(/^func\s+([A-Za-z_]\w*)/gm);
            add(/^type\s+([A-Za-z_]\w*)\s+(?:struct|interface)/gm);
            break;
        case ".c":
        case ".cpp":
        case ".h":
        case ".hpp":
            add(/^\s*(?:class|struct|namespace)\s+([A-Za-z_]\w*)/gm);
            add(/^\s*[\w:*<>\[\],\s]+\s+([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/gm);
            break;
        case ".cs":
            add(/^\s*(?:public|private|protected|internal)?\s*(?:static\s+)?(?:async\s+)?[\w<>\[\],\s]+\s+([A-Za-z_]\w*)\s*\([^)]*\)/gm);
            add(/^\s*(?:public|private|protected|internal)?\s*(?:abstract\s+)?(?:sealed\s+)?class\s+([A-Za-z_]\w*)/gm);
            break;
        case ".php":
            add(/^\s*(?:public|private|protected)?\s*function\s+([A-Za-z_]\w*)/gm);
            add(/^\s*(?:abstract\s+)?class\s+([A-Za-z_]\w*)/gm);
            break;
        case ".sql":
            add(/CREATE\s+(?:TABLE|VIEW|PROCEDURE|FUNCTION|INDEX)\s+(?:`?[\w]+`?\.)?`?([\w]+)`?/gim);
            break;
        default:
            break;
    }
    return [...new Set(symbols)];
}

/** Extract the first comment line of the file as the description (skip shebang lines; a shebang is not a comment) */
function firstComment(content: string, ext: string): string {
    const line = content
        .split(/\r?\n/)
        .find((l) => {
            const t = l.trim();
            return !/^#!/.test(t) && /^\s*(\/\/|\*|#|--|;)/.test(t);
        });
    if (!line) {
        return "";
    }
    return line.trim().replace(/^(\/\/|\*|#|--|;)\s*/, "").slice(0, 80);
}

export const projectAnalyzerDefinition = {
    description:
        "Scan the source code directories to generate a project map: list the code files under each directory and their function/class lists (recognized by language). Use for reverse-engineering the structure of existing projects during initialization and for updating the project map.",
};

export function projectAnalyzerExecute(args: {
    projectRoot: string;
    sourceDirs?: string[];
    excludeDirs?: string[];
}) {
    try {
        const extraExcluded = new Set(
            (args.excludeDirs ?? []).map((d) => d.trim()).filter(Boolean),
        );
        const excluded = new Set([...EXCLUDED_DIRS, ...extraExcluded]);

        let rootDirs: string[];
        if (args.sourceDirs && args.sourceDirs.length > 0) {
            rootDirs = args.sourceDirs;
        } else {
            const top = existsSync(args.projectRoot)
                ? readdirSync(args.projectRoot).filter((n) => !n.startsWith("."))
                : [];
            rootDirs = top.filter((n) => !excluded.has(n));
        }

        // Collect all code/config files under the target directories (recognize the language by extension)
        const files: Array<{ path: string; lang: string }> = [];
        for (const dir of rootDirs) {
            const full = join(args.projectRoot, dir);
            if (!existsSync(full) || !statSync(full).isDirectory()) {
                continue;
            }
            for (const f of listFilesRecursive(full)) {
                if (typeof f !== "string") {
                    continue;
                }
                const parts = f.split(/[\\/]/);
                if (parts.some((p) => excluded.has(p))) {
                    continue;
                }
                const finalName = parts[parts.length - 1];
                const dot = finalName.lastIndexOf(".");
                const ext = dot > 0 ? finalName.slice(dot).toLowerCase() : "";
                if (EXT_LANG[ext] || /\.(md|json|ya?ml|toml|ini|cfg|txt)$/i.test(f)) {
                    files.push({ path: f, lang: EXT_LANG[ext] ?? "config" });
                }
            }
        }

        files.sort((a, b) => a.path.localeCompare(b.path));

        const lines = ["# Project Map", "", `Scanned ${files.length} files in total.`, ""];
        let currentGroup = "";
        for (const f of files) {
            const rel = relative(args.projectRoot, f.path).replace(/\\/g, "/");
            const group = rel.includes("/") ? rel.split("/")[0] : "(root)";
            if (group !== currentGroup) {
                currentGroup = group;
                lines.push(`## ${group}/`, "");
            }
            let entry = `- \`${rel}\``;
            if (f.lang) {
                entry += ` (${f.lang})`;
            }
            try {
                const content = readFileSync(f.path, "utf8").slice(0, 200_000);
                const desc = firstComment(content, f.path.slice(f.path.lastIndexOf(".")));
                if (desc) {
                    entry += ` — ${desc}`;
                }
                const symbols = extractSymbols(content, f.path.slice(f.path.lastIndexOf(".")));
                if (symbols.length > 0) {
                    entry += `: ${symbols.slice(0, 20).join(", ")}${symbols.length > 20 ? "…" : ""}`;
                }
            } catch {
                // Binary or unreadable file, skip extraction
            }
            lines.push(entry);
        }
        lines.push("");

        return {
            success: true,
            sourceDirs: rootDirs,
            fileCount: files.length,
            map: lines.join("\n"),
        };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}
