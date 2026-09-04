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
 * File write lock utility: based on directory lock (atomicity of mkdir) to implement same-process/cross-process file write mutex.
 *
 * During the coding development phase, the PM concurrently dispatches sub-steps of multiple tasks in phase waves. These subagents
 * simultaneously perform "read-modify-write" operations on shared files like version_progress.md and task list JSON.
 * Without locking, two concurrent calls may both read old content and write back separately, causing progress rows/task states
 * to be lost (last-write-wins overwrites). withFileLock ensures the entire "read-modify-write" flow holds a lock,
 * thereby avoiding lost updates due to concurrency.
 *
 * Lock implementation:
 *   - Lock file: {file}.lock directory, atomicity of mkdir ensures only one holder at a time;
 *   - Waiting: retries at intervals when occupied, until timeout (default 60s);
 *   - Heartbeat: periodically refreshes lock directory mtime while holding the lock, preventing long critical sections from being incorrectly identified as expired locks;
 *   - Expired lock: mtime exceeding STALE_LOCK_MS (default 30s) is considered a residual from abnormal process exit, automatically cleaned up and retried;
 *   - Release: deletes the lock directory after fn completes (whether success or failure).
 */

import { mkdirSync, rmSync, statSync, utimesSync } from "fs";
import { dirname } from "path";

/** Lock wait total timeout (milliseconds) */
const DEFAULT_TIMEOUT_MS = 60_000;
/** Expired lock determination threshold (milliseconds): duration exceeding this is considered a residual from abnormal process exit */
const STALE_LOCK_MS = 30_000;
/** Lock heartbeat interval (milliseconds): refreshes lock directory mtime while holding the lock, must be less than STALE_LOCK_MS */
const HEARTBEAT_INTERVAL_MS = 10_000;
/** Lock retry interval (milliseconds) */
const RETRY_INTERVAL_MS = 120;

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Executes fn while holding the file lock, returns fn's result.
 * @param file Target file path (lock directory is file + ".lock")
 * @param fn Critical section function (can be synchronous or asynchronous; must re-read the latest file content within the critical section before writing back)
 * @param timeoutMs Lock wait timeout (milliseconds, default 60000)
 */
export async function withFileLock<T>(
    file: string,
    fn: () => T | Promise<T>,
    timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
    const lockDir = `${file}.lock`;
    // Ensure the parent directory of the lock directory exists (the version directory containing the target file may not have been created yet),
    // otherwise mkdirSync throws ENOENT, which would be misinterpreted as "lock occupied" causing an infinite loop
    mkdirSync(dirname(lockDir), { recursive: true });
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        if (Date.now() > deadline) {
            throw new Error(`File write lock wait timeout (${timeoutMs}ms): ${lockDir}`);
        }
        try {
            mkdirSync(lockDir);
            break;
        } catch (err) {
            const code = (err as NodeJS.ErrnoException)?.code;
            if (code === "ENOENT") {
                // Extreme case where parent directory was concurrently deleted: rebuild parent directory and retry
                mkdirSync(dirname(lockDir), { recursive: true });
                await sleep(RETRY_INTERVAL_MS);
                continue;
            }
            if (code !== "EEXIST") {
                // Non-"already exists" error is thrown directly to avoid infinite loop
                throw err;
            }
            // Lock is occupied: first try to clean up expired locks, otherwise wait and retry
            let stale = false;
            try {
                stale = Date.now() - statSync(lockDir).mtimeMs > STALE_LOCK_MS;
            } catch {
                // Lock directory just disappeared (race window), retry acquiring directly
                await sleep(RETRY_INTERVAL_MS);
                continue;
            }
            if (stale) {
                try {
                    rmSync(lockDir, { recursive: true, force: true });
                } catch {
                    // Cleanup failed, retry later
                }
                continue;
            }
            await sleep(RETRY_INTERVAL_MS);
        }
    }
    // Periodically refresh lock directory mtime while holding the lock (heartbeat)
    // Prevents other processes from incorrectly cleaning up as expired lock when the critical section execution exceeds STALE_LOCK_MS.
    // When the process crashes, the heartbeat stops, lock mtime stops refreshing, and after 30s it will still be correctly cleaned up.
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    try {
        heartbeat = setInterval(() => {
            const now = new Date();
            try {
                utimesSync(lockDir, now, now);
            } catch {
                // Lock directory may have been cleaned up or is unwritable, ignore and let expired cleanup logic handle it
            }
        }, HEARTBEAT_INTERVAL_MS);
        return await fn();
    } finally {
        if (heartbeat) {
            clearInterval(heartbeat);
        }
        try {
            rmSync(lockDir, { recursive: true, force: true });
        } catch {
            // Ignore release failure (lock directory may have been cleaned up by expiration logic)
        }
    }
}