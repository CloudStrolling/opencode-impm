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
 * impm plugin built-in feature: impm-heartbeat (subagent ↔ PM main session heartbeat detection and auto-recovery)
 *
 * Problems solved:
 * 1. Subagent child session stall: When the PM dispatches subagents concurrently via the task tool,
 *    individual child sessions may become "not finished but inactive for a long time" due to LLM service
 *    unresponsiveness, network interruptions, etc., causing the main flow to wait indefinitely.
 *    Upon detection, the child session is automatically aborted and a warning is logged; the task tool
 *    then returns a failure result to the PM, which re-dispatches the same task according to scheduling
 *    rules (restarting the skill).
 * 2. PM main session stall / abnormal termination: The main session has been inactive for a long time
 *    during execution (both itself and all child sessions have no heartbeats), or a turn ends in error
 *    (session.error followed by idle, or assistant message carries an error field). After detection and
 *    confirmation, residual turns are automatically aborted, and a message containing "current version
 *    number + continue execution" is injected into the main session via client.session.chat, restarting
 *    the previous command flow.
 *
 * Working principle (event hooks + scheduled scanning + SQLite direct reading + OpenCode client):
 * 1. Activity signals: Event hooks listen to message.updated / message.part.updated /
 *    session.status(busy); each event refreshes the last activity time of the corresponding session;
 * 2. Session classification: Directly read the opencode SQLite session table for parent_id; sessions
 *    with a parent are subagent child sessions, otherwise they are the main session;
 * 3. Stall detection (child session): If the last activity exceeds the threshold (default 10 minutes),
 *    it is considered stalled; before aborting, the latest timestamp from message/part in SQLite is
 *    used as a final check to prevent false positives;
 * 4. Stall detection (main session): The main session is considered stalled only if it is silent
 *    beyond the threshold AND all its child sessions have also been inactive recently (PM waiting for
 *    task returns is a healthy state); permission approval waiting is not specially distinguished
 *    (user decision);
 * 5. Abnormal termination detection (main session): When session.idle is received, the error field
 *    of the last assistant message is checked — UnknownError/ProviderAuthError etc. are treated as
 *    abnormal termination; MessageAbortedError is a manual or plugin-initiated abort, not a failure;
 * 6. Recovery actions: Child session stall → abort only (PM re-dispatches); Main session stall /
 *    abnormal termination → abort + chat injection of resume command (with current version number),
 *    retrying up to IMPM_HEARTBEAT_MAX_NUDGES times (default 2), after which only a warning is
 *    issued and manual intervention is awaited. All processing records are appended to
 *    docs/prompts/heartbeat.md.
 *
 * Environment variable configuration:
 * - IMPM_HEARTBEAT_DISABLED=1          Disable heartbeat detection (enabled by default)
 * - IMPM_HEARTBEAT_TIMEOUT_MS          Stall detection threshold, default 600000 (10 minutes)
 * - IMPM_HEARTBEAT_INTERVAL_MS         Scanning interval, default 60000 (60 seconds)
 * - IMPM_HEARTBEAT_MAIN_RECOVER=0      Disable main session auto-recovery (enabled by default)
 * - IMPM_HEARTBEAT_MAX_NUDGES          Maximum auto-recovery attempts for main session, default 2
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultDbPath, openDb } from "./prompt-recorder.js";
import { versionExecute } from "./version.js";

/** Maximum abort attempts for a single child session (first attempt + one retry after timeout), after which only a warning is issued */
const MAX_ABORT_ATTEMPTS = 2;

/** Maximum retention time for tracking entries: cleaned up regardless of completion status afterwards (prevents memory leaks) */
const ENTRY_TTL_MS = 24 * 60 * 60 * 1000;

/** Minimum retry interval after parent_id resolution failure (child session rows may be persisted later than the first event) */
const RESOLVE_RETRY_MS = 30 * 1000;

/** Error names for abnormal termination (any error other than MessageAbortedError is abnormal) */
const ABNORMAL_ERROR_NAMES = new Set([
    "UnknownError",
    "ProviderAuthError",
    "MessageOutputLengthError",
]);

/** Read a positive integer from environment variables, using fallback for invalid or missing values */
function envPositiveInt(name: string, fallback: number): number {
    const v = Number(process.env[name]);
    return Number.isFinite(v) && v > 0 ? v : fallback;
}

/** Whether heartbeat detection is disabled */
function isDisabled(): boolean {
    return process.env.IMPM_HEARTBEAT_DISABLED === "1";
}

/** Milliseconds → human-readable duration (e.g., 25s / 3m05s / 1h02m) */
function formatDuration(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000));
    if (s < 60) {
        return `${s}s`;
    }
    const m = Math.floor(s / 60);
    if (m < 60) {
        return `${m}m${String(s % 60).padStart(2, "0")}s`;
    }
    return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}m`;
}

/** Millisecond timestamp → YYYY-MM-DD HH:mm:ss (local timezone) */
function formatTime(ms: number): string {
    const d = new Date(ms);
    const pad = (n: number): string => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Extract sessionID from event properties via multiple paths:
 * Compatible with different opencode version event payload shapes
 * (message.updated: { info }, message.part.updated: { part }, some versions have top-level fields)
 */
function extractSessionId(props: unknown): string | undefined {
    if (!props || typeof props !== "object") {
        return undefined;
    }
    const p = props as Record<string, unknown>;
    const info = p.info as Record<string, unknown> | undefined;
    const part = p.part as Record<string, unknown> | undefined;
    const message = p.message as Record<string, unknown> | undefined;
    const candidates = [
        p.sessionID,
        p.sessionId,
        info?.sessionID,
        info?.sessionId,
        part?.sessionID,
        part?.sessionId,
        message?.sessionID,
    ];
    for (const c of candidates) {
        if (typeof c === "string" && c) {
            return c;
        }
    }
    return undefined;
}

/** Heartbeat state for a single tracked session */
interface TrackEntry {
    sessionId: string;
    /** Parent session ID: string = child session; null = main session; undefined = not yet resolved (retry during scanning) */
    parentId: string | null | undefined;
    /** Session directory (SQLite session.directory, used to only monitor sessions of this project) */
    directory: string | null;
    firstSeen: number;
    lastActivity: number;
    lastEvent: string;
    /** Whether session.idle / session.error has been received (session finished) */
    finished: boolean;
    /** Number of abort attempts executed (child session scope) */
    abortAttempts: number;
    /** Number of main session auto-recovery attempts (resume message injection) executed */
    nudges: number;
    /** Timestamp of last stall detection (triggers grace period reset to prevent repeated triggering per scan) */
    lastStallAt: number;
    /** Timestamp of last auto-recovery (cooldown control) */
    lastRecoverAt: number;
    /** Timestamp of last parent_id resolution attempt (failure backoff) */
    lastResolveAt: number;
    /** Whether parent_id is currently being resolved (prevents duplicate queries) */
    resolving: boolean;
}

/** Whether parent_id has been resolved (null also counts as resolved = main session) */
function parentResolved(e: TrackEntry): boolean {
    return e.parentId !== undefined;
}

/** Operation result */
interface OpResult {
    ok: boolean;
    detail: string;
}

/** Minimal OpenCode client interface (only uses session.abort / session.chat, compatible with old and new parameter shapes) */
interface OpencodeClientLike {
    session?: {
        abort?: (arg: unknown) => Promise<unknown>;
        chat?: (arg: unknown, body?: unknown) => Promise<unknown>;
    };
}

/**
 * Create heartbeat detection feature (event hooks + scheduled scanning + impm_heartbeat tool)
 * @param projectRoot Project root directory (warning file written to docs/prompts/heartbeat.md)
 * @param client OpenCode injected SDK client (used to abort and wake sessions; degraded to warning-only when missing)
 */
export async function createHeartbeatMonitor(
    projectRoot: string,
    client?: unknown,
) {
    const enabled = !isDisabled();
    const timeoutMs = envPositiveInt("IMPM_HEARTBEAT_TIMEOUT_MS", 10 * 60 * 1000);
    const intervalMs = envPositiveInt("IMPM_HEARTBEAT_INTERVAL_MS", 60 * 1000);
    const mainRecover = process.env.IMPM_HEARTBEAT_MAIN_RECOVER !== "0";
    const maxNudges = envPositiveInt("IMPM_HEARTBEAT_MAX_NUDGES", 2);

    /** Session tracking table: sessionId → heartbeat state */
    const entries = new Map<string, TrackEntry>();
    let scanning = false; // Scan mutex lock

    /** Alert file path (docs/prompts/heartbeat.md), ensures directory exists */
    const alertFile = (): string => {
        const dir = join(projectRoot, "docs", "prompts");
        mkdirSync(dir, { recursive: true });
        return join(dir, "heartbeat.md");
    };

    /** Append an alert record to heartbeat.md (writes header explanation if file doesn't exist) */
    function appendAlert(row: string[]): void {
        try {
            const file = alertFile();
            if (!existsSync(file)) {
                const header = [
                    "# Heartbeat Detection Records (auto-generated by impm-heartbeat)",
                    "",
                    "> The impm plugin monitors heartbeat for the PM main session and its dispatched subagent child sessions:",
                    "> - Child session not finished and inactive beyond threshold → detected as stalled and automatically aborted (abort),",
                    ">   PM receives task failure and re-dispatches with the original prompt (restarting the skill);",
                    "> - Main session silent beyond threshold during execution (and all child sessions also inactive) or turn abnormally terminated →",
                    ">   Automatically aborts residual turns and injects [current version number + continue execution] message into the main session,",
                    ">   restarting the previous command flow (limited by IMPM_HEARTBEAT_MAX_NUDGES).",
                    "",
                    "| Detection Time | Session | Ownership | Trigger Reason | Inactive Duration | Action Taken |",
                    "| --- | --- | --- | --- | --- | --- |",
                    "",
                ].join("\n");
                appendFileSync(file, header, "utf8");
            }
            appendFileSync(file, `| ${row.join(" | ")} |\n`, "utf8");
        } catch (err) {
            console.error("[impm][heartbeat] Failed to write alert file:", String(err));
        }
    }

    /**
     * SQLite fallback check: returns the latest timestamp from message/part in the database for the session.
     * Used as final confirmation before abort — if the database shows recent writes, the session is still active,
     * the plugin just didn't recognize the event payload shape, and it should be treated as a normal heartbeat rather than a stall.
     * Returns null if no data found.
     */
    async function latestDbActivity(sessionId: string): Promise<number | null> {
        try {
            const opened = await openDb(defaultDbPath());
            try {
                const row = opened.db
                    .prepare(
                        "SELECT MAX(t) AS latest FROM (" +
                            "SELECT MAX(time_created) AS t FROM message WHERE session_id = ? " +
                            "UNION ALL SELECT MAX(time_updated) AS t FROM message WHERE session_id = ? " +
                            "UNION ALL SELECT MAX(time_created) AS t FROM part WHERE session_id = ? " +
                            "UNION ALL SELECT MAX(time_updated) AS t FROM part WHERE session_id = ?" +
                        ")",
                    )
                    .get(sessionId, sessionId, sessionId, sessionId) as
                        { latest: number | null } | undefined;
                return row?.latest ?? null;
            } finally {
                opened.close();
            }
        } catch {
            return null;
        }
    }

    /**
     * Main session health check: the latest activity time of all its child sessions (parent_id = main session) in the database.
     * PM silent but child sessions still working is a healthy wait state and should not be considered stalled.
     * Returns null if no data found.
     */
    async function latestChildActivity(mainId: string): Promise<number | null> {
        // Check in-memory tracking table first (best real-time accuracy)
        let best = 0;
        for (const e of entries.values()) {
            if (e.parentId === mainId && !e.finished) {
                best = Math.max(best, e.lastActivity);
            }
        }
        try {
            const opened = await openDb(defaultDbPath());
            try {
                const row = opened.db
                    .prepare(
                        "SELECT MAX(t) AS latest FROM (" +
                            "SELECT m.time_updated AS t FROM message m JOIN session c ON m.session_id = c.id WHERE c.parent_id = ? " +
                            "UNION ALL SELECT p.time_updated AS t FROM part p JOIN session c ON p.session_id = c.id WHERE c.parent_id = ?" +
                        ")",
                    )
                    .get(mainId, mainId) as { latest: number | null } | undefined;
                best = Math.max(best, row?.latest ?? 0);
            } finally {
                opened.close();
            }
        } catch {
            /* Database unreadable, use in-memory signals only */
        }
        return best > 0 ? best : null;
    }

    /** Read the error name from the last assistant message of the session (returns null if no error) */
    async function lastAssistantError(sessionId: string): Promise<string | null> {
        try {
            const opened = await openDb(defaultDbPath());
            try {
                const row = opened.db
                    .prepare(
                        "SELECT json_extract(data,'$.error') AS err FROM message " +
                            "WHERE session_id = ? AND json_extract(data,'$.role') = 'assistant' " +
                            "ORDER BY time_created DESC LIMIT 1",
                    )
                    .get(sessionId) as { err: string | null } | undefined;
                if (!row?.err) {
                    return null;
                }
                try {
                    const parsed = JSON.parse(row.err) as { name?: string };
                    return parsed.name || row.err;
                } catch {
                    return row.err;
                }
            } finally {
                opened.close();
            }
        } catch {
            return null;
        }
    }

    /** Read model information used by the session (session.model column JSON or last assistant message) */
    async function sessionModel(
        sessionId: string,
    ): Promise<{ providerID: string; modelID: string } | null> {
        try {
            const opened = await openDb(defaultDbPath());
            try {
                const row = opened.db
                    .prepare("SELECT model FROM session WHERE id = ?")
                    .get(sessionId) as { model: string | null } | undefined;
                if (row?.model) {
                    try {
                        const m = JSON.parse(row.model) as {
                            id?: string;
                            providerID?: string;
                        };
                        if (m.id && m.providerID) {
                            return { providerID: m.providerID, modelID: m.id };
                        }
                    } catch {
                        /* Fall through to fallback below */
                    }
                }
                const msg = opened.db
                    .prepare(
                        "SELECT json_extract(data,'$.providerID') AS p, json_extract(data,'$.modelID') AS m " +
                            "FROM message WHERE session_id = ? AND json_extract(data,'$.role')='assistant' " +
                            "ORDER BY time_created DESC LIMIT 1",
                    )
                    .get(sessionId) as { p: string | null; m: string | null } | undefined;
                if (msg?.p && msg?.m) {
                    return { providerID: msg.p, modelID: msg.m };
                }
            } finally {
                opened.close();
            }
        } catch {
            /* Ignore */
        }
        return null;
    }

    /** Asynchronously resolve a session's parent_id and directory (SQLite direct reading, failure keeps unresolved for retry) */
    async function resolveParent(sessionId: string): Promise<void> {
        const e = entries.get(sessionId);
        if (!e || e.resolving || parentResolved(e)) {
            return;
        }
        e.resolving = true;
        e.lastResolveAt = Date.now();
        try {
            const opened = await openDb(defaultDbPath());
            try {
                const row = opened.db
                    .prepare("SELECT parent_id, directory FROM session WHERE id = ?")
                    .get(sessionId) as
                        { parent_id: string | null; directory: string | null }
                        | undefined;
                const cur = entries.get(sessionId);
                if (cur && !parentResolved(cur) && row) {
                    cur.parentId = row.parent_id;
                    cur.directory = row.directory ?? null;
                    // Only monitor sessions of this project: discard when directory is known but doesn't match (prevents cross-project false positives in shared instances)
                    if (!sameProject(row.directory)) {
                        entries.delete(sessionId);
                    }
                }
            } finally {
                opened.close();
            }
        } catch {
            /* Database temporarily unreadable: keep unresolved, retry on next scan */
        } finally {
            const cur = entries.get(sessionId);
            if (cur) {
                cur.resolving = false;
            }
        }
    }

    /** Compare directories after normalization to determine same project (Windows ignores case and path separator differences) */
    function sameProject(directory: string | null | undefined): boolean {
        if (directory === null || directory === undefined) {
            return true; // Unknown directory doesn't exclude (older versions may not have this column)
        }
        const norm = (s: string): string => s.replace(/\\/g, "/").replace(/\/+$/, "");
        const a = norm(projectRoot);
        const b = norm(directory);
        return process.platform === "win32"
            ? a.toLowerCase() === b.toLowerCase()
            : a === b;
    }

    /** Refresh a session's last activity time (creates a new tracking entry and asynchronously resolves its parent if not exists) */
    function touch(sessionId: string, eventName: string): void {
        const now = Date.now();
        let e = entries.get(sessionId);
        if (!e) {
            e = {
                sessionId,
                parentId: undefined,
                directory: null,
                firstSeen: now,
                lastActivity: now,
                lastEvent: eventName,
                finished: false,
                abortAttempts: 0,
                nudges: 0,
                lastStallAt: 0,
                lastRecoverAt: 0,
                lastResolveAt: 0,
                resolving: false,
            };
            entries.set(sessionId, e);
            void resolveParent(sessionId);
            return;
        }
        // Activity resumes heartbeat; if previously detected as stalled but still running (e.g., abort failed), extend grace period
        e.lastActivity = now;
        e.lastEvent = eventName;
        e.finished = false;
    }

    /** Mark session as finished (session.idle / session.error), cleaned up by scan afterwards */
    function markFinished(sessionId: string, eventName: string): void {
        const e = entries.get(sessionId);
        if (!e) {
            return;
        }
        e.finished = true;
        e.lastEvent = eventName;
    }

    /** Abort a specified session: prefer new SDK shape abort(id), fall back to old abort({ path }) on failure */
    async function abortSession(sessionId: string): Promise<OpResult> {
        const c = (client || {}) as OpencodeClientLike;
        const fn = c.session?.abort;
        if (typeof fn !== "function") {
            return {
                ok: false,
                detail: "OpenCode client unavailable (missing session.abort)",
            };
        }
        try {
            await fn.call(c.session, sessionId);
            return { ok: true, detail: "abort(id)" };
        } catch (err1) {
            try {
                await fn.call(c.session, { path: { id: sessionId } });
                return { ok: true, detail: "abort({path})" };
            } catch (err2) {
                const msg =
                    (err2 as Error)?.message || String(err2) || String(err1) || "unknown error";
                return { ok: false, detail: `Abort failed: ${msg}` };
            }
        }
    }

    /** Inject a user message into a specified session (wake up): prefer chat(id, body), fall back to chat({path,body}) */
    async function chatSession(
        sessionId: string,
        body: Record<string, unknown>,
    ): Promise<OpResult> {
        const c = (client || {}) as OpencodeClientLike;
        const fn = c.session?.chat;
        if (typeof fn !== "function") {
            return {
                ok: false,
                detail: "OpenCode client unavailable (missing session.chat)",
            };
        }
        try {
            await fn.call(c.session, sessionId, body);
            return { ok: true, detail: "chat(id,body)" };
        } catch (err1) {
            try {
                await fn.call(c.session, { path: { id: sessionId }, body });
                return { ok: true, detail: "chat({path},body)" };
            } catch (err2) {
                const msg =
                    (err2 as Error)?.message || String(err2) || String(err1) || "unknown error";
                return { ok: false, detail: `Message injection failed: ${msg}` };
            }
        }
    }

    /**
     * Build the main session resume command (injected user message text).
     * Includes the current version number (latest version directory under docs, may be empty),
     * instructing the PM to resume the interrupted command flow.
     */
    function buildNudgeText(reason: string): string {
        let versionInfo = "Version directory not found (if the flow requires a version number, please use impm_version to infer it first)";
        try {
            const r = versionExecute({ projectRoot, action: "current" }) as {
                success?: boolean;
                version?: string | null;
            };
            if (r?.success && r.version) {
                versionInfo = r.version;
            }
        } catch {
            /* Keep default text */
        }
        return [
            `[impm-heartbeat auto-recovery] Your previous turn was interrupted due to ${reason}. The system has automatically aborted residual processing and is requesting you to continue.`,
            `Current version: ${versionInfo}.`,
            "Please immediately restart the previously interrupted command flow: first use impm_version (action=current) to verify the version number, then check version_progress.md to find the last incomplete step, and continue dispatching execution from that step (subagent skills and task dispatch proceed as usual); do not re-execute steps that are already complete with intact output. No need to confirm with the user again, continue directly.",
        ].join("\n");
    }

    /**
     * Main session auto-recovery chain: detect stall/abnormal termination → abort to clear → chat injection of resume command.
     * Limited by IMPM_HEARTBEAT_MAX_NUDGES count; beyond that only a warning is issued awaiting manual intervention.
     * @returns Processing description (for alert record)
     */
    async function recoverMain(e: TrackEntry, reason: string): Promise<string> {
        if (e.nudges >= maxNudges) {
            e.lastStallAt = Date.now();
            return `Auto-recovery limit reached (${maxNudges}), manual intervention required`;
        }
        e.nudges += 1;
        e.lastRecoverAt = Date.now();
        console.error(
            `[impm][heartbeat] Main session ${e.sessionId} ${reason}, executing auto-recovery (${e.nudges}/${maxNudges}): aborting residual turns and injecting resume command`,
        );
        // 1. Clear field: abort if there are still pending turns (abort is idempotent when already idle)
        const ab = await abortSession(e.sessionId);
        // 2. Assemble resume command (with model info; still attempts injection without model field when model info is missing)
        const model = await sessionModel(e.sessionId);
        const text = buildNudgeText(reason);
        const body: Record<string, unknown> = { parts: [{ type: "text", text }] };
        if (model) {
            body.providerID = model.providerID;
            body.modelID = model.modelID;
        }
        // 3. Inject; session may still be wrapping up immediately after abort, short wait then retry once
        let sent = await chatSession(e.sessionId, body);
        if (!sent.ok) {
            await new Promise((r) => setTimeout(r, 3000));
            sent = await chatSession(e.sessionId, body);
        }
        // 4. Record
        const action = `abort(${ab.ok ? "success" : ab.detail}) + inject resume command(${sent.ok ? "success" : sent.detail}), attempt ${e.nudges}/${maxNudges}`;
        if (!sent.ok) {
            console.error(`[impm][heartbeat] Main session ${e.sessionId} resume command injection failed: ${sent.detail}, manual intervention required`);
        }
        // After recovery, give a full threshold period as observation window
        e.lastActivity = Math.max(e.lastActivity, Date.now());
        e.lastStallAt = Date.now();
        return action;
    }

    /** Handle a single child session stall: DB fallback check → alert → attempt abort → record → reset grace period */
    async function handleChildStall(e: TrackEntry, idleMs: number): Promise<void> {
        e.lastStallAt = Date.now();

        // Final check using latest message/part time from database before abort, prevents false positives from event payload changes
        const dbLatest = await latestDbActivity(e.sessionId);
        if (dbLatest !== null && Date.now() - dbLatest < timeoutMs * 0.8) {
            e.lastActivity = Math.max(e.lastActivity, dbLatest);
            console.warn(
                `[impm][heartbeat] Child session ${e.sessionId} database shows recent writes (${formatDuration(Date.now() - dbLatest)} ago), treating as active, skipping this stall detection`,
            );
            return;
        }

        console.error(
            `[impm][heartbeat] Detected subagent child session ${e.sessionId} stalled: not finished and inactive for ${formatDuration(idleMs)} (last event: ${e.lastEvent})`,
        );
        let action = "Warning only (client unavailable)";
        if (e.abortAttempts < MAX_ABORT_ATTEMPTS) {
            e.abortAttempts += 1;
            const r = await abortSession(e.sessionId);
            action = r.ok
                ? `Automatically aborted (attempt ${e.abortAttempts}), awaiting PM re-dispatch`
                : r.detail;
        } else {
            action = `Maximum abort attempts reached (${MAX_ABORT_ATTEMPTS}), manual intervention required`;
        }
        appendAlert([
            formatTime(Date.now()),
            `\`${e.sessionId}\``,
            "Subagent child session",
            "Stalled (not finished and inactive beyond timeout)",
            formatDuration(idleMs),
            action,
        ]);
        // Reset grace period after trigger: next scan won't immediately re-detect
        e.lastActivity = Math.max(e.lastActivity, Date.now());
    }

    /** Scan all tracking entries: two-pass processing — first handle stalled child sessions, then re-check main sessions (prevents false positives on healthy waiting) */
    async function scan(): Promise<string[]> {
        if (scanning || !enabled) {
            return [];
        }
        scanning = true;
        const reports: string[] = [];
        try {
            const now = Date.now();
            // Pass 1: ownership resolution, expiration cleanup, child session stall handling
            for (const [sid, e] of Array.from(entries.entries())) {
                if (e.finished || now - e.firstSeen > ENTRY_TTL_MS) {
                    entries.delete(sid);
                    continue;
                }
                if (!parentResolved(e)) {
                    // Child session rows may be persisted later than the first event: continuously resolve with backoff interval
                    if (!e.resolving && now - e.lastResolveAt >= RESOLVE_RETRY_MS) {
                        void resolveParent(sid);
                    }
                    continue;
                }
                if (e.parentId === null) {
                    continue; // Main session, deferred to pass 2
                }
                const idleMs = now - e.lastActivity;
                if (
                    idleMs >= timeoutMs &&
                    now - e.lastStallAt >= timeoutMs &&
                    e.abortAttempts <= MAX_ABORT_ATTEMPTS
                ) {
                    await handleChildStall(e, idleMs);
                    reports.push(`Child session (subagent) \`${sid}\` inactive for ${formatDuration(idleMs)}`);
                }
            }
            // Pass 2: main session stall / abnormal termination handling
            for (const [, e] of Array.from(entries.entries())) {
                if (e.finished || !parentResolved(e) || e.parentId !== null) {
                    continue;
                }
                const now2 = Date.now();
                // Health check: any child session active recently → PM is waiting for task return, refresh main session heartbeat
                const childLatest = await latestChildActivity(e.sessionId);
                if (childLatest !== null && childLatest > now2 - timeoutMs) {
                    e.lastActivity = Math.max(e.lastActivity, childLatest);
                    continue;
                }
                const idleMs = now2 - e.lastActivity;
                if (idleMs < timeoutMs || now2 - e.lastStallAt < timeoutMs) {
                    continue;
                }
                if (!mainRecover) {
                    console.error(
                        `[impm][heartbeat] Main session ${e.sessionId} suspected stalled (inactive for ${formatDuration(idleMs)}), auto-recovery is disabled, manual check required`,
                    );
                    e.lastStallAt = now2;
                    appendAlert([
                        formatTime(now2),
                        `\`${e.sessionId}\``,
                        "PM main session",
                        "Suspected stalled (auto-recovery disabled)",
                        formatDuration(idleMs),
                        "Warning only",
                    ]);
                    reports.push(`Main session \`${e.sessionId}\` inactive for ${formatDuration(idleMs)} (warning only)`);
                    continue;
                }
                const reason = "Long inactivity during execution (suspected stall)";
                const action = await recoverMain(e, reason);
                appendAlert([
                    formatTime(Date.now()),
                    `\`${e.sessionId}\``,
                    "PM main session",
                    reason,
                    formatDuration(idleMs),
                    action,
                ]);
                reports.push(`Main session \`${e.sessionId}\` inactive for ${formatDuration(idleMs)} → auto-recovery attempted`);
            }
        } finally {
            scanning = false;
        }
        return reports;
    }

    /**
     * Main session abnormal termination handling: on idle, check the error field of the last assistant message,
     * errors other than MessageAbortedError (auth failure, unknown error, output limit exceeded, etc.) trigger auto-recovery.
     * Note: must be called before markFinished (depends on entry not yet marked as finished);
     * only takes effect for main sessions confirmed to belong to this project, executed asynchronously without blocking the event bus.
     */
    function handleIdleMaybeAbnormal(sessionId: string): void {
        const e = entries.get(sessionId);
        if (!e || !parentResolved(e) || e.parentId !== null) {
            return; // Not tracked / ownership unresolved / child session: skip
        }
        void (async () => {
            try {
                const errName = await lastAssistantError(sessionId);
                if (!errName || !ABNORMAL_ERROR_NAMES.has(errName)) {
                    return; // Normal termination or manual abort
                }
                const reason = `Abnormal termination (${errName})`;
                if (!mainRecover) {
                    console.error(`[impm][heartbeat] Main session ${sessionId} ${reason}, auto-recovery is disabled, manual check required`);
                    appendAlert([
                        formatTime(Date.now()),
                        `\`${sessionId}\``,
                        "PM main session",
                        reason,
                        "-",
                        "Warning only (auto-recovery disabled)",
                    ]);
                    return;
                }
                const action = await recoverMain(e, reason);
                console.error(`[impm][heartbeat] Main session ${sessionId} ${reason} → ${action}`);
                appendAlert([
                    formatTime(Date.now()),
                    `\`${sessionId}\``,
                    "PM main session",
                    reason,
                    "-",
                    action,
                ]);
            } catch (err) {
                console.error("[impm][heartbeat] Abnormal termination handling failed:", String(err));
            }
        })();
    }

    /**
     * Event hook: track session activity and termination signals
     * Events of interest: message.updated / message.part.updated / session.status(busy) (activity),
     * session.idle / session.error (termination and error)
     */
    const event = async (input: { event?: unknown }): Promise<void> => {
        if (!enabled) {
            return;
        }
        try {
            const ev = input?.event as
                | { type?: string; properties?: unknown }
                | undefined;
            const type = ev?.type || "";
            const props = ev?.properties;
            switch (type) {
                case "message.updated":
                case "message.part.updated": {
                    const sid = extractSessionId(props);
                    if (sid) {
                        touch(sid, type);
                    }
                    break;
                }
                case "session.status": {
                    // v1.18+: { sessionID, status: { type: "busy" | "idle", ... } }
                    const p = props as Record<string, unknown> | undefined;
                    const sid = extractSessionId(p);
                    const statusType = (p?.status as Record<string, unknown> | undefined)?.type;
                    if (sid && statusType === "busy") {
                        touch(sid, type);
                    } else if (sid && statusType === "idle") {
                        markFinished(sid, type);
                    }
                    break;
                }
                case "session.idle":
                case "session.error": {
                    const sid =
                        extractSessionId(props) ||
                        ((props as Record<string, unknown> | undefined)?.info as
                            | Record<string, unknown>
                            | undefined)?.id;
                    if (typeof sid === "string" && sid) {
                        // idle needs abnormal termination check first (depends on entry not yet marked finished), then mark as finished
                        if (type === "session.idle") {
                            handleIdleMaybeAbnormal(sid);
                        }
                        markFinished(sid, type);
                    }
                    break;
                }
                default:
                    break;
            }
        } catch (err) {
            console.error("[impm][heartbeat] Event handling failed:", String(err));
        }
    };

    // Scheduled scanning; unref ensures it doesn't block process exit
    if (enabled) {
        const timer = setInterval(() => {
            void scan().catch((err) =>
                console.error("[impm][heartbeat] Scan error:", String(err)),
            );
        }, intervalMs);
        if (typeof timer.unref === "function") {
            timer.unref();
        }
    }

    /** Render current tracking status (status action output) */
    function renderStatus(): string {
        const rows: string[] = [];
        for (const e of entries.values()) {
            const kind = e.parentId
                ? "Child session (subagent)"
                : e.parentId === null
                  ? "Main session"
                  : "Ownership unknown";
            rows.push(
                `- ${kind} \`${e.sessionId}\`: ${e.finished ? "Finished" : "Running"}, inactive for ${formatDuration(Date.now() - e.lastActivity)}, last event ${e.lastEvent}${e.abortAttempts ? `, abort attempts ${e.abortAttempts}` : ""}${e.nudges ? `, auto-recoveries ${e.nudges}` : ""}`,
            );
        }
        return [
            `Heartbeat detection: ${enabled ? "Enabled" : "Disabled"}; stall threshold ${formatDuration(timeoutMs)}; scan interval ${formatDuration(intervalMs)}; main session auto-recovery: ${mainRecover ? `Enabled (limit ${maxNudges})` : "Disabled"}`,
            `Currently tracked sessions: ${entries.size}`,
            ...rows,
        ].join("\n");
    }

    return {
        event,

        /** Manual tool: status=view tracking state, check=run an immediate scan, alerts=view recent alerts */
        tool: {
            impm_heartbeat: {
                description:
                    "subagent/PM heartbeat detection tool: status=view current tracked session heartbeat state and configuration; check=run an immediate stall scan and return report; alerts=read recent alert records from docs/prompts/heartbeat.md",
                args: {
                    projectRoot: {
                        type: "string",
                        description: "Absolute path of the project root directory",
                    },
                    action: {
                        type: "string",
                        description: "Action type: status | check | alerts",
                    },
                    limit: {
                        type: "number",
                        description: "Number of recent records to return for alerts (default 20)",
                    },
                },
                async execute(args: Record<string, unknown>): Promise<string> {
                    const action = String(args.action || "status").toLowerCase();
                    if (action === "alerts") {
                        const file = alertFile();
                        if (!existsSync(file)) {
                            return "No heartbeat alert records yet (docs/prompts/heartbeat.md does not exist).";
                        }
                        const lines = readFileSync(file, "utf8")
                            .split(/\r?\n/)
                            .filter(Boolean);
                        const limit = Number(args.limit) > 0 ? Number(args.limit) : 20;
                        return lines.slice(-limit).join("\n");
                    }
                    if (action === "check") {
                        const reports = await scan();
                        return reports.length
                            ? `Scan found and processed ${reports.length} items:\n- ${reports.join("\n- ")}`
                            : "No stalled sessions found in this scan.";
                    }
                    return renderStatus();
                },
            },
        },
    };
}
