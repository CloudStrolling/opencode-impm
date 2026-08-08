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
 * Type declaration of the bun:sqlite module
 * It only exists in the Bun runtime and is not loaded in the Node environment;
 * the declaration lets TypeScript compile the dynamic import of prompt-recorder.
 */
declare module "bun:sqlite" {
    /** Minimal shape of the bun:sqlite Database used by the plugin (read-only queries) */
    export class Database {
        constructor(path: string, options?: { readonly?: boolean });
        /** Prepare a SQL statement; all()/get() execute it with the given parameters */
        prepare(sql: string): { all(...params: unknown[]): unknown[]; get(...params: unknown[]): unknown };
        close(): void;
    }
}
