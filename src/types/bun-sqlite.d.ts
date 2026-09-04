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
 * bun:sqlite module type declarations
 * Only exists in Bun runtime, will not be loaded in Node environment;
 * Declarations used to allow TypeScript compilation of prompt-recorder's dynamic imports.
 */
declare module "bun:sqlite" {
    export class Database {
        /** Open database file (readonly is read-only mode) */
        constructor(path: string, options?: { readonly?: boolean });
        /** Pre-compile SQL, returns a statement handle that can be executed with parameters (all queries multiple rows, get queries a single row) */
        prepare(sql: string): { all(...params: unknown[]): unknown[]; get(...params: unknown[]): unknown };
        /** Close database connection */
        close(): void;
    }
}