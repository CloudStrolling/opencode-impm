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
 * scripts/install-core.mjs module type declaration
 *
 * install-core.mjs is the ESM install core logic (shared with install.mjs CLI entry).
 * The plugin entry (src/index.ts) dynamically imports it at startup for version-aware asset sync.
 * This file is located outside src/ and cannot be statically referenced via rootDir, so its export types are declared here.
 */

/** runInstall options */
export interface RunInstallOptions {
    /** Plugin package root directory (contains assets/, dist/, scripts/) */
    pluginRoot: string;
    /** Target project root directory (assets copied to projectRoot/.opencode/) */
    projectRoot: string;
    /** Current plugin version number (written to manifest) */
    version: string;
    /** Agent model preset type (empty = do not modify agent config) */
    agentType?: string;
}

declare module "*/install-core.mjs" {
    export function runInstall(options: {
        pluginRoot: string;
        projectRoot: string;
        version: string;
        agentType?: string;
    }): boolean;
    export function loadManifest(
        opencodeDir: string,
    ): null | Record<string, unknown>;
    export function saveManifest(
        opencodeDir: string,
        manifest: Record<string, unknown>,
    ): void;
    export const AGENT_TYPES: string[];
}
