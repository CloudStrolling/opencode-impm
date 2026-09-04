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
 * impm plugin built-in feature: impm-prompt-recorder
 *
 * Two capabilities (distributed as part of the impm plugin, not a standalone plugin):
 * 1. Automatic user prompt recording: chat.message hook immediately appends the prompt to the
 *    docs/prompts/prompts.md table (session_id, prompt time, prompt content,
 *    input token, output token, cache hit, cache write). When the session ends (session.idle),
 *    the conversation cost for that prompt is aggregated by "prompt window" (assistant messages
 *    after the current prompt and before the next prompt + child sessions created during that period)
 *    and backfills the last 4 columns.
 * 2. Conversation export: Exports the full conversation (including reasoning and responses) of the
 *    main session and all child sessions to docs/prompts/prompt-{YYYYMMDD}-{session_id}.md,
 *    with cumulative token consumption statistics for the entire session recorded at the beginning,
 *    continuously updated at each prompt/session end.
 *
 * Data source (hooks + SQLite hybrid, does not use opencode SDK):
 * - Prompt content: chat.message hook (text parts in output.parts)
 * - Conversation content: Direct read of opencode SQLite database message / part tables (data JSON)
 * - Current conversation cost: message table assistant message data.tokens (including cache.read/write)
 * - Cumulative session cost: session table tokens_* columns, recursively aggregated by parent_id
 *   for main session and all descendant sessions (opencode official API Session type does not include token fields)
 *
 * Triggers: chat.message (record and refresh export on prompt) + event (backfill/export on session.idle),
 * idempotent.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** prompts.md table header */
const TABLE_HEADER = [
    "| session_id | Prompt Time | Prompt Content | Input Token | Output Token | Cache Read | Cache Write |",
    "| --- | --- | --- | --- | --- | --- | --- |",
].join("\n");

/** Prompt window matching tolerance: maximum allowed deviation between prompts.md prompt time and DB message time (5 minutes) */
const TIME_TOLERANCE_MS = 5 * 60 * 1000;

/** Create a string parameter schema (consistent with suite tool style) */
function createStringSchema(description: string) {
    return { type: "string" as const, description };
}

/** Left-pad number with zeros */
function pad2(n: number): string {
    return String(n).padStart(2, "0");
}

/** Millisecond timestamp → YYYY-MM-DD HH:mm:ss (local timezone) */
function formatTime(ms: number): string {
    const d = new Date(ms);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/** Millisecond timestamp → YYYYMMDD (local timezone) */
function formatDate(ms: number): string {
    const d = new Date(ms);
    return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

/** Escape table characters: | → \|, newline → <br> */
function escapeCell(text: string): string {
    return String(text).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

/** Split the table row body (after removing leading/trailing |) into cells; escaped pipes (\|) are not split */
function splitCells(body: string): string[] {
    return body.split(/(?<!\\)\|/).map((c) => c.trim());
}

/** Calculate the database path under the default opencode data directory */
export function defaultDbPath(): string {
    if (process.env.OPENCODE_DATA) {
        return join(process.env.OPENCODE_DATA, "opencode.db");
    }
    const home =
        process.env.HOME ||
        process.env.USERPROFILE ||
        join(process.env.HOMEDRIVE || "", process.env.HOMEPATH || "");
    return join(home, ".local", "share", "opencode", "opencode.db");
}

/** Session table row (SQLite direct read) */
interface SessionRow {
    id: string;
    parent_id: string | null;
    title: string;
    time_created: number;
    tokens_input: number | null;
    tokens_output: number | null;
    tokens_reasoning: number | null;
    tokens_cache_read: number | null;
    tokens_cache_write: number | null;
}

/** Message table row (data is a JSON string) */
interface MessageRow {
    id: string;
    session_id: string;
    time_created: number;
    data: string;
}

/** Part table row (data is a JSON string) */
interface PartRow {
    id: string;
    message_id: string;
    session_id: string;
    time_created: number;
    data: string;
}

/** Token consumption statistics (one metric: output and reasoning recorded separately, merged during aggregation) */
interface TokenTotal {
    input: number;
    output: number;
    reasoning: number;
    cacheRead: number;
    cacheWrite: number;
}

/** Database operation handle (compatible with node:sqlite and bun:sqlite) */
export interface SqliteHandle {
    db: {
        prepare(sql: string): { all(...params: unknown[]): unknown[]; get(...params: unknown[]): unknown };
        close(): void;
    };
    close(): void;
}

/**
 * Open read-only database: prefer node:sqlite, fall back to bun:sqlite on failure
 * (compatible with Node ≥22.5 and Bun plugin runtimes)
 */
export async function openDb(dbPath: string): Promise<SqliteHandle> {
    try {
        const { DatabaseSync } = await import("node:sqlite");
        const db = new DatabaseSync(dbPath, { readOnly: true });
        return {
            db,
            close() {
                try {
                    db.close();
                } catch {
                    /* Ignore duplicate close */
                }
            },
        };
    } catch (err) {
        try {
            const { Database } = await import("bun:sqlite");
            const db = new Database(dbPath, { readonly: true });
            return {
                db,
                close() {
                    try {
                        db.close();
                    } catch {
                        /* Ignore duplicate close */
                    }
                },
            };
        } catch (err2) {
            throw new Error(
                `Failed to open opencode database: ${dbPath} (${String(err)} / ${String(err2)})`,
            );
        }
    }
}

/** Query the main session and all descendant sessions (recursively by parent_id) */
function querySessionTree(db: SqliteHandle["db"], rootId: string): SessionRow[] {
    const rows = db
        .prepare(
            "SELECT id, parent_id, title, time_created, tokens_input, tokens_output, tokens_reasoning, tokens_cache_read, tokens_cache_write FROM session",
        )
        .all() as SessionRow[];
    const byId = new Map<string, SessionRow>();
    const children = new Map<string | null, SessionRow[]>();
    for (const r of rows) {
        byId.set(r.id, r);
        const list = children.get(r.parent_id) || [];
        list.push(r);
        children.set(r.parent_id, list);
    }
    const result: SessionRow[] = [];
    const seen = new Set<string>();
    const visit = (id: string): void => {
        if (seen.has(id)) {
            return;
        }
        seen.add(id);
        const r = byId.get(id);
        if (!r) {
            return;
        }
        result.push(r);
        for (const c of children.get(id) || []) {
            visit(c.id);
        }
    };
    visit(rootId);
    return result;
}

/** Parse existing data rows from prompts.md (skip header), return raw lines and 7-column 2D array */
function parsePromptRows(text: string): Array<{ raw: string; cols: string[] }> {
    const rows: Array<{ raw: string; cols: string[] }> = [];
    for (const raw of String(text).replace(/^\uFEFF/, "").split(/\r?\n/)) {
        const trimmed = raw.trim();
        if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
            continue;
        }
        const parts = splitCells(trimmed.slice(1, -1));
        if (parts.length < 7 || parts[0] === "session_id") {
            continue;
        }
        // Prompt content (column 3) may contain escaped \| (splitCells preserves them), take 4 token columns from right, merge the rest back to the left
        const left = parts.slice(0, parts.length - 4);
        rows.push({
            raw: trimmed,
            cols: [
                left[0],
                left[1],
                left.slice(2).join("|"),
                parts[parts.length - 4],
                parts[parts.length - 3],
                parts[parts.length - 2],
                parts[parts.length - 1],
            ],
        });
    }
    return rows;
}

/** Return the prompts.md file path for the project, and ensure the directory exists */
function promptsFile(projectRoot: string): string {
    const dir = join(projectRoot, "docs", "prompts");
    mkdirSync(dir, { recursive: true });
    return join(dir, "prompts.md");
}

/**
 * Append a prompt record row to prompts.md (idempotent: deduplicated by session_id + prompt time)
 * The last 4 columns are initially written as "pending", backfilled by finalizeTokens at session end
 */
function appendPromptRow(projectRoot: string, sessionId: string, timeMs: number, prompt: string): number {
    const text = prompt.trim();
    if (!text) {
        return 0;
    }
    const timeStr = formatTime(timeMs);
    const file = promptsFile(projectRoot);
    const rows = existsSync(file)
        ? parsePromptRows(readFileSync(file, "utf8"))
        : [];
    if (rows.some((r) => r.cols[0] === sessionId && r.cols[1] === timeStr)) {
        return 0;
    }
    let content = "";
    if (existsSync(file)) {
        content = readFileSync(file, "utf8");
    } else {
        content = `# Prompt Records\n\n${TABLE_HEADER}\n`;
    }
    const body = content.endsWith("\n") ? content : `${content}\n`;
    writeFileSync(file, `${body}| ${sessionId} | ${timeStr} | ${escapeCell(text)} | pending | pending | pending | pending |\n`, "utf8");
    return 1;
}

/** Read all messages (including parts) for a session from SQLite, sorted by time */
function readSessionMessages(db: SqliteHandle["db"], sessionId: string): Array<{
    id: string;
    sessionId: string;
    role: string;
    timeCreated: number;
    info: Record<string, unknown>;
    parts: Array<{ id: string; type: string; data: Record<string, unknown>; timeCreated: number }>;
}> {
    const messages = db
        .prepare("SELECT id, session_id, time_created, data FROM message WHERE session_id = ? ORDER BY time_created")
        .all(sessionId) as MessageRow[];
    const parts = db
        .prepare("SELECT id, message_id, session_id, time_created, data FROM part WHERE session_id = ? ORDER BY time_created")
        .all(sessionId) as PartRow[];

    const partsByMessage = new Map<string, Array<{ id: string; type: string; data: Record<string, unknown>; timeCreated: number }>>();
    for (const p of parts) {
        let data: Record<string, unknown> = {};
        try {
            data = JSON.parse(p.data);
        } catch {
            /* Ignore parse failure */
        }
        const list = partsByMessage.get(p.message_id) || [];
        list.push({ id: p.id, type: String(data.type || ""), data, timeCreated: p.time_created });
        partsByMessage.set(p.message_id, list);
    }

    const result: Array<{
        id: string;
        sessionId: string;
        role: string;
        timeCreated: number;
        info: Record<string, unknown>;
        parts: Array<{ id: string; type: string; data: Record<string, unknown>; timeCreated: number }>;
    }> = [];
    for (const m of messages) {
        let info: Record<string, unknown> = {};
        try {
            info = JSON.parse(m.data);
        } catch {
            /* Ignore parse failure */
        }
        result.push({
            id: m.id,
            sessionId: m.session_id,
            role: String(info.role || ""),
            timeCreated: m.time_created,
            info,
            parts: partsByMessage.get(m.id) || [],
        });
    }
    return result;
}

/** Read all user messages for a session (sorted by time), extract text */
function readUserMessages(db: SqliteHandle["db"], sessionId: string): Array<{ time: number; text: string }> {
    return readSessionMessages(db, sessionId)
        .filter((m) => m.role === "user")
        .map((m) => ({
            time: m.timeCreated,
            text: m.parts
                .filter((p) => p.type === "text" && !p.data.synthetic)
                .map((p) => String(p.data.text || ""))
                .join("\n")
                .trim(),
        }))
        .filter((m) => m.text)
        .sort((a, b) => a.time - b.time);
}

/** Read token statistics for all assistant messages in a session (message.data.tokens, with timestamp) */
function readAssistantCosts(db: SqliteHandle["db"], sessionId: string): Array<{ time: number; cost: TokenTotal }> {
    const out: Array<{ time: number; cost: TokenTotal }> = [];
    for (const m of readSessionMessages(db, sessionId)) {
        if (m.role !== "assistant") {
            continue;
        }
        const t = (m.info.tokens || {}) as {
            input?: number;
            output?: number;
            reasoning?: number;
            cache?: { read?: number; write?: number };
        };
        out.push({
            time: m.timeCreated,
            cost: {
                input: Number(t.input) || 0,
                output: Number(t.output) || 0,
                reasoning: Number(t.reasoning) || 0,
                cacheRead: Number(t.cache?.read) || 0,
                cacheWrite: Number(t.cache?.write) || 0,
            },
        });
    }
    return out;
}

/** Empty token statistics */
function emptyTotal(): TokenTotal {
    return { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 };
}

/** Accumulate two token statistics */
function addTotal(a: TokenTotal, b: TokenTotal): TokenTotal {
    return {
        input: a.input + b.input,
        output: a.output + b.output,
        reasoning: a.reasoning + b.reasoning,
        cacheRead: a.cacheRead + b.cacheRead,
        cacheWrite: a.cacheWrite + b.cacheWrite,
    };
}

/**
 * Calculate the conversation cost for each prompt by "prompt window":
 * Window i = [time of prompt i, time of prompt i+1);
 * Cost in window = main session assistant message tokens in that period + cumulative tokens of child sessions created in that period
 */
function buildWindowCosts(
    db: SqliteHandle["db"],
    sessionId: string,
): TokenTotal[] {
    const users = readUserMessages(db, sessionId);
    if (users.length === 0) {
        return [];
    }
    const windows = users.map(() => emptyTotal());
    // Assistant message attribution: time not earlier than this prompt, earlier than next prompt → belongs to this window
    for (const a of readAssistantCosts(db, sessionId)) {
        let idx = -1;
        for (let k = 0; k < users.length; k++) {
            if (users[k].time <= a.time) {
                idx = k;
            }
        }
        if (idx >= 0) {
            windows[idx] = addTotal(windows[idx], a.cost);
        }
    }
    // Child session attribution: by their creation time falling into which window
    const children = querySessionTree(db, sessionId).filter((s) => s.parent_id);
    for (const c of children) {
        let idx = -1;
        for (let k = 0; k < users.length; k++) {
            if (users[k].time <= c.time_created) {
                idx = k;
            }
        }
        if (idx >= 0) {
            windows[idx].input += Number(c.tokens_input) || 0;
            windows[idx].output += Number(c.tokens_output) || 0;
            windows[idx].reasoning += Number(c.tokens_reasoning) || 0;
            windows[idx].cacheRead += Number(c.tokens_cache_read) || 0;
            windows[idx].cacheWrite += Number(c.tokens_cache_write) || 0;
        }
    }
    return windows;
}

/**
 * Backfill "conversation cost" for each prompt row in prompts.md (prompt window basis, idempotent)
 * Rows and DB user messages are matched by closest time (within TIME_TOLERANCE_MS tolerance)
 */
async function finalizeTokens(
    projectRoot: string,
    dbPath: string,
    sessionId: string,
): Promise<{ updated: number }> {
    const file = promptsFile(projectRoot);
    if (!existsSync(file)) {
        return { updated: 0 };
    }
    const opened = await openDb(dbPath);
    try {
        const users = readUserMessages(opened.db, sessionId);
        const windows = buildWindowCosts(opened.db, sessionId);
        if (users.length === 0 || windows.length === 0) {
            return { updated: 0 };
        }
        // For each user message, compute the closest row match (when one user matches multiple rows, take the closest)
        const lines = String(readFileSync(file, "utf8")).replace(/^\uFEFF/, "").split(/\r?\n/);
        const out: string[] = [];
        let updated = 0;
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
                out.push(line);
                continue;
            }
            const parts = splitCells(trimmed.slice(1, -1));
            if (parts.length < 7 || parts[0] === "session_id") {
                out.push(line);
                continue;
            }
            const rowSession = parts[0];
            if (rowSession !== sessionId) {
                out.push(line);
                continue;
            }
            const rowTime = Date.parse(parts[1]);
            if (Number.isNaN(rowTime)) {
                out.push(line);
                continue;
            }
            // Find the user message with the smallest time difference
            let bestIdx = -1;
            let bestDiff = TIME_TOLERANCE_MS;
            for (let k = 0; k < users.length; k++) {
                const diff = Math.abs(users[k].time - rowTime);
                if (diff <= bestDiff) {
                    bestDiff = diff;
                    bestIdx = k;
                }
            }
            if (bestIdx < 0) {
                out.push(line);
                continue;
            }
            const w = windows[bestIdx];
            // Keep id/time/prompt columns as-is (prompt may contain escaped \|, splitCells ensures they aren't split),
            // only backfill the last 4 token columns to avoid column misalignment from pipe characters
            out.push(
                `| ${parts[0]} | ${parts[1]} | ${parts[2]} | ${w.input} | ${w.output + w.reasoning} | ${w.cacheRead} | ${w.cacheWrite} |`,
            );
            updated += 1;
        }
        if (updated > 0) {
            writeFileSync(file, out.join("\n"), "utf8");
        }
        return { updated };
    } finally {
        opened.close();
    }
}

/** Render a single message as Markdown lines (including reasoning and response) */
function renderMessage(msg: {
    role: string;
    timeCreated: number;
    info: Record<string, unknown>;
    parts: Array<{ id: string; type: string; data: Record<string, unknown>; timeCreated: number }>;
}): string[] {
    const lines: string[] = [];
    const role = msg.role === "user" ? "User" : "Assistant";
    lines.push(`### ${role} ${formatTime(msg.timeCreated)}`);
    if (msg.role === "assistant") {
        const model = msg.info.modelID ? `${msg.info.providerID}/${msg.info.modelID}` : "";
        const agent = msg.info.agent ? ` | agent: ${msg.info.agent}` : "";
        lines.push(`> Model: ${model || "unknown"}${agent}`);
    }
    lines.push("");
    for (const p of msg.parts) {
        switch (p.type) {
            case "text":
                if (p.data.synthetic) {
                    break;
                }
                if (p.data.text && String(p.data.text).trim()) {
                    lines.push(String(p.data.text).trim());
                    lines.push("");
                }
                break;
            case "reasoning":
                if (p.data.text && String(p.data.text).trim()) {
                    lines.push("> **Reasoning Process**");
                    lines.push(">");
                    lines.push(
                        String(p.data.text)
                            .trim()
                            .split(/\r?\n/)
                            .map((l) => `> ${l}`)
                            .join("\n"),
                    );
                    lines.push("");
                }
                break;
            case "tool":
                lines.push(`- Tool call: \`${String(p.data.tool || "unknown")}\` (status: ${String(p.data.state || "unknown")})`);
                break;
            case "subtask":
                lines.push(`- Dispatched subtask: **${String(p.data.agent || "?")}** — ${String(p.data.description || p.data.prompt || "")}`);
                break;
            case "step-start":
                lines.push(`- Step start${p.data.snapshot ? " (with snapshot)" : ""}`);
                break;
            case "step-finish": {
                const t = p.data.tokens as { input?: number; output?: number; reasoning?: number } | undefined;
                const tok = t ? `tokens: ${t.input ?? 0}+${(t.output ?? 0) + (t.reasoning ?? 0)}` : "";
                lines.push(`- Step finish (reason: ${String(p.data.reason || "?")}${tok ? `, ${tok}` : ""})`);
                break;
            }
            case "patch":
                lines.push(`- File patch: ${((p.data.files as string[]) || []).join(", ") || String(p.data.hash || "?")}`);
                break;
            case "agent":
                lines.push(`- Sub-agent: ${String(p.data.name || "")}`);
                break;
            default:
                break;
        }
    }
    lines.push("");
    return lines;
}

/**
 * Export conversation snapshots of the main session and all child sessions to docs/prompts/
 * File header records cumulative token consumption statistics for the entire session (session table basis, continuously updated during export)
 * Data source: SQLite message / part table direct read (including reasoning and responses)
 */
async function exportSession(
    projectRoot: string,
    dbPath: string,
    sessionId: string,
): Promise<{ exported: number; file: string }> {
    const opened = await openDb(dbPath);
    try {
        const sessions = querySessionTree(opened.db, sessionId);
        if (sessions.length === 0) {
            return { exported: 0, file: "" };
        }
        const main = sessions[0];
        const lines: string[] = [];
        lines.push(`# Conversation Record${main.title ? `: ${main.title}` : ""}`);
        lines.push("");
        lines.push(`- Main session: ${main.id}`);
        lines.push(`- Export time: ${formatTime(Date.now())}`);
        lines.push(`- Session count: ${sessions.length} (main session + ${sessions.length - 1} child sessions)`);
        lines.push("");

        // Cumulative token consumption statistics for the entire session (at the beginning, continuously updated during export)
        const totals = sessions.map((s) => ({
            id: s.id,
            title: s.title,
            isMain: !s.parent_id,
            input: Number(s.tokens_input) || 0,
            output: Number(s.tokens_output) || 0,
            reasoning: Number(s.tokens_reasoning) || 0,
            cacheRead: Number(s.tokens_cache_read) || 0,
            cacheWrite: Number(s.tokens_cache_write) || 0,
        }));
        const sum = totals.reduce<TokenTotal>(
            (acc, s) => ({
                input: acc.input + s.input,
                output: acc.output + s.output,
                reasoning: acc.reasoning + s.reasoning,
                cacheRead: acc.cacheRead + s.cacheRead,
                cacheWrite: acc.cacheWrite + s.cacheWrite,
            }),
            emptyTotal(),
        );
        lines.push("## Token Consumption Statistics");
        lines.push("");
        lines.push("| Session | Input Token | Output Token (incl. reasoning) | Reasoning Token | Cache Read | Cache Write |");
        lines.push("| --- | --- | --- | --- | --- | --- |");
        for (const s of totals) {
            const label = s.isMain ? "Main session" : "Child session";
            lines.push(
                `| ${label} \`${s.id}\`${s.title ? ` (${s.title})` : ""} | ${s.input} | ${s.output + s.reasoning} | ${s.reasoning} | ${s.cacheRead} | ${s.cacheWrite} |`,
            );
        }
        lines.push(
            `| **Total** | **${sum.input}** | **${sum.output + sum.reasoning}** | **${sum.reasoning}** | **${sum.cacheRead}** | **${sum.cacheWrite}** |`,
        );
        lines.push("");
        lines.push("## Session Tree");
        lines.push("");
        for (const s of sessions) {
            lines.push(`- ${s.parent_id ? "Child session" : "Main session"} \`${s.id}\`${s.title ? ` (${s.title})` : ""}`);
        }
        lines.push("");
        for (const s of sessions) {
            lines.push(`## Session ${s.id}`);
            lines.push("");
            lines.push(`> Created: ${formatTime(s.time_created)}${s.title ? ` | Title: ${s.title}` : ""}`);
            lines.push("");
            if (s.parent_id) {
                lines.push(`> Child session (parent: ${s.parent_id})`);
                lines.push("");
            }
            const messages = readSessionMessages(opened.db, s.id);
            for (const m of messages) {
                lines.push(...renderMessage(m));
            }
        }
        const dir = join(projectRoot, "docs", "prompts");
        mkdirSync(dir, { recursive: true });
        const file = join(dir, `prompt-${formatDate(main.time_created)}-${main.id}.md`);
        writeFileSync(file, lines.join("\n").replace(/\n{3,}/g, "\n\n"), "utf8");
        return { exported: sessions.length, file };
    } finally {
        opened.close();
    }
}

/**
 * Create prompt-recorder feature (chat.message hook + event hook + 3 tools)
 * @param projectRoot Project root directory
 */
export async function createPromptRecorder(projectRoot: string) {
    let busy = false; // Event processing mutex lock: prevents session.idle concurrent re-entry
    let exporting = false; // Export mutex lock: prevents concurrent export file writes

    /** Refresh export file (prevents concurrent writes) */
    const refreshExport = async (dbPath: string, sessionId: string): Promise<void> => {
        if (exporting) {
            return;
        }
        exporting = true;
        try {
            await exportSession(projectRoot, dbPath, sessionId);
        } catch (err) {
            console.error("[impm] prompt-recorder export refresh failed:", String(err));
        } finally {
            exporting = false;
        }
    };

    /**
     * chat.message hook: immediately record to prompts.md when user asks a question, and refresh the export file
     * input: { sessionID, agent?, model?, messageID? }
     * output: { message: UserMessage, parts: Part[] }
     */
    const chatMessage = async (input: { sessionID?: string; messageID?: string }, output: { parts?: Array<{ type?: string; text?: string; synthetic?: boolean }> }): Promise<void> => {
        try {
            const sessionID = input?.sessionID;
            if (!sessionID) {
                return;
            }
            const prompt = (output?.parts || [])
                .filter((p) => p && p.type === "text" && !p.synthetic)
                .map((p) => p.text || "")
                .join("\n")
                .trim();
            if (!prompt) {
                return;
            }
            // Only record main session prompts: check SQLite to determine if the session is a child session (treat as main session if not found)
            try {
                const opened = await openDb(defaultDbPath());
                try {
                    const row = opened.db
                        .prepare("SELECT parent_id FROM session WHERE id = ?")
                        .get(sessionID) as { parent_id: string | null } | undefined;
                    if (row && row.parent_id) {
                        return;
                    }
                } finally {
                    opened.close();
                }
            } catch {
                /* Still record when database is unreadable, don't block main flow */
            }
            const recorded = appendPromptRow(projectRoot, sessionID, Date.now(), prompt);
            if (recorded) {
                console.log(`[impm] prompt-recorder recorded prompt: ${sessionID} (${prompt.slice(0, 50)}...)`);
            }
            // Refresh export file immediately after prompt (token statistics and conversation content update accordingly)
            await refreshExport(defaultDbPath(), sessionID);
        } catch (err) {
            console.error("[impm] prompt-recorder chat.message handling failed:", String(err));
        }
    };

    /** Event hook: backfill tokens and export conversation when main session turn ends */
    const event = async (input: { event: unknown }): Promise<void> => {
        const eventData = input?.event as { type?: string; properties?: { sessionID?: string } } | undefined;
        if (!eventData || eventData.type !== "session.idle") {
            return;
        }
        const sessionId = eventData.properties?.sessionID;
        if (!sessionId || busy) {
            return;
        }
        busy = true;
        try {
            // Only process main sessions (root sessions without parent); child sessions are exported together by the main session
            const opened = await openDb(defaultDbPath());
            let isMain = true;
            try {
                const row = opened.db
                    .prepare("SELECT parent_id FROM session WHERE id = ?")
                    .get(sessionId) as { parent_id: string | null } | undefined;
                isMain = !row || !row.parent_id;
            } finally {
                opened.close();
            }
            if (!isMain) {
                return;
            }
            const r2 = await finalizeTokens(projectRoot, defaultDbPath(), sessionId);
            const r3 = await refreshExport(defaultDbPath(), sessionId);
            if (r2.updated || r3) {
                console.log(
                    `[impm] prompt-recorder main session ${sessionId}: backfilled ${r2.updated} rows of tokens, refreshed export file`,
                );
            }
        } catch (err) {
            console.error("[impm] prompt-recorder auto-processing failed:", String(err));
        } finally {
            busy = false;
        }
    };

    return {
        chatMessage,
        event,
        tool: {
            /** Manually backfill user prompts for a specified session into prompts.md */
            impm_prompt_record: {
                description:
                    "Backfill user prompts for a specified session into the docs/prompts/prompts.md table (idempotent, repeated runs do not produce duplicate rows)",
                args: {
                    projectRoot: createStringSchema("Absolute path of the project root directory"),
                    sessionID: createStringSchema("Session ID (required, main session)"),
                },
                async execute(args: Record<string, unknown>): Promise<string> {
                    const root = (args.projectRoot as string) || projectRoot;
                    const sessionId = String(args.sessionID || "");
                    if (!sessionId) {
                        return "No session ID specified (sessionID), this parameter is required.";
                    }
                    // Extract user prompts from SQLite message/part tables for the session and backfill
                    let recorded = 0;
                    try {
                        const opened = await openDb(defaultDbPath());
                        try {
                            const messages = readSessionMessages(opened.db, sessionId);
                            for (const m of messages) {
                                if (m.role !== "user") {
                                    continue;
                                }
                                const text = m.parts
                                    .filter((p) => p.type === "text" && !p.data.synthetic)
                                    .map((p) => String(p.data.text || ""))
                                    .join("\n")
                                    .trim();
                                if (text) {
                                    recorded += appendPromptRow(root, sessionId, m.timeCreated, text);
                                }
                            }
                        } finally {
                            opened.close();
                        }
                    } catch (err) {
                        console.error("[impm] prompt-recorder backfill failed:", String(err));
                    }
                    return `Recorded ${recorded} prompts (${root}/docs/prompts/prompts.md)`;
                },
            },
            /** Manually recalculate conversation cost and backfill prompts.md */
            impm_prompt_finalize: {
                description:
                    "Recalculate token consumption per prompt for a specified session by prompt window (assistant messages after each prompt + child sessions), backfilling the input/output/cache columns in prompts.md",
                args: {
                    projectRoot: createStringSchema("Absolute path of the project root directory"),
                    sessionID: createStringSchema("Session ID (required, main session)"),
                    dbPath: createStringSchema(
                        "opencode database path (optional, default ~/.local/share/opencode/opencode.db)",
                    ),
                },
                async execute(args: Record<string, unknown>): Promise<string> {
                    const root = (args.projectRoot as string) || projectRoot;
                    const dbPath = (args.dbPath as string) || defaultDbPath();
                    const result = await finalizeTokens(root, dbPath, String(args.sessionID || ""));
                    return `Backfilled ${result.updated} rows of token statistics (${dbPath})`;
                },
            },
            /** Manually export session conversation snapshot */
            impm_prompt_export: {
                description:
                    "Export a specified session (main session + all child sessions, including reasoning and responses) to docs/prompts/prompt-{YYYYMMDD}-{session_id}.md, with cumulative session token consumption statistics at the beginning",
                args: {
                    projectRoot: createStringSchema("Absolute path of the project root directory"),
                    sessionID: createStringSchema("Session ID (required, main session)"),
                    dbPath: createStringSchema(
                        "opencode database path (optional, default ~/.local/share/opencode/opencode.db)",
                    ),
                },
                async execute(args: Record<string, unknown>): Promise<string> {
                    const root = (args.projectRoot as string) || projectRoot;
                    const dbPath = (args.dbPath as string) || defaultDbPath();
                    const result = await exportSession(root, dbPath, String(args.sessionID || ""));
                    return `Exported ${result.exported} sessions → ${result.file}`;
                },
            },
        },
    };
}
