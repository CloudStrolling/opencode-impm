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
 * Built-in feature of the impm plugin: impm-prompt-recorder
 *
 * Two capabilities (distributed together with the impm plugin, not as a separate plugin):
 * 1. Automatic user prompt recording: the chat.message hook appends the prompt to the
 *    docs/prompts/prompts.md table immediately when the user asks (session_id, prompt time,
 *    prompt content, input tokens, output tokens, cache read, cache write); when the session
 *    ends (session.idle), the conversation cost of that prompt is aggregated per "prompt
 *    window" (the assistant messages after that prompt and before the next prompt, plus the
 *    sub-sessions created during that period) and backfilled into the last 4 columns.
 * 2. Conversation export: exports the full conversation of the main session and all
 *    sub-sessions (including reasoning and replies) to
 *    docs/prompts/prompt-{YYYYMMDD}-{session_id}.md; the file starts with the cumulative
 *    token usage statistics of the whole session, and is continuously updated after each
 *    prompt and at the end of the session.
 *
 * Data sources (hooks + SQLite, without using the opencode SDK):
 * - Prompt content: the chat.message hook (the text parts of output.parts)
 * - Conversation content: reads the message / part tables of the opencode SQLite database directly (data JSON)
 * - Current conversation cost: the data.tokens of assistant messages in the message table (including cache.read/write)
 * - Whole-session cumulative cost: the tokens_* columns of the session table, aggregating the
 *   main session and all descendant sessions recursively by parent_id (the Session type of the
 *   official opencode API does not include token fields)
 *
 * Trigger: chat.message (records the prompt and refreshes the export) + event (session.idle
 * backfills/exports), idempotent.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** prompts.md table header */
const TABLE_HEADER = [
    "| session_id | Time | Prompt content | Input tokens | Output tokens | Cache read | Cache write |",
    "| --- | --- | --- | --- | --- | --- | --- |",
].join("\n");

/** Prompt window matching tolerance: the maximum allowed deviation between the prompts.md prompt time and the DB message time (5 minutes) */
const TIME_TOLERANCE_MS = 5 * 60 * 1000;

/** Create a string argument schema (consistent with the style of the suite tools) */
function createStringSchema(description: string) {
    return { type: "string" as const, description };
}

/** Left-pad a number to two digits */
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

/** Escape table characters: | → \|, newlines → <br> */
function escapeCell(text: string): string {
    return String(text).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

/** Compute the database path under the default opencode data directory */
function defaultDbPath(): string {
    if (process.env.OPENCODE_DATA) {
        return join(process.env.OPENCODE_DATA, "opencode.db");
    }
    const home =
        process.env.HOME ||
        process.env.USERPROFILE ||
        join(process.env.HOMEDRIVE || "", process.env.HOMEPATH || "");
    return join(home, ".local", "share", "opencode", "opencode.db");
}

/** Row of the session table (read directly from SQLite) */
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

/** Row of the message table (data is a JSON string) */
interface MessageRow {
    id: string;
    session_id: string;
    time_created: number;
    data: string;
}

/** Row of the part table (data is a JSON string) */
interface PartRow {
    id: string;
    message_id: string;
    session_id: string;
    time_created: number;
    data: string;
}

/** Token usage statistics (one caliber: output and reasoning are recorded separately and merged in the summary) */
interface TokenTotal {
    input: number;
    output: number;
    reasoning: number;
    cacheRead: number;
    cacheWrite: number;
}

/** Database operation handle (compatible with node:sqlite and bun:sqlite) */
interface SqliteHandle {
    db: {
        prepare(sql: string): { all(...params: unknown[]): unknown[]; get(...params: unknown[]): unknown };
        close(): void;
    };
    close(): void;
}

/**
 * Open a read-only database: prefer node:sqlite, fall back to bun:sqlite
 * (compatible with both the Node ≥22.5 and Bun plugin runtimes)
 */
async function openDb(dbPath: string): Promise<SqliteHandle> {
    try {
        const { DatabaseSync } = await import("node:sqlite");
        const db = new DatabaseSync(dbPath, { readOnly: true });
        return {
            db,
            close() {
                try {
                    db.close();
                } catch {
                    /* Ignore repeated close */
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
                        /* Ignore repeated close */
                    }
                },
            };
        } catch (err2) {
            throw new Error(
                `Unable to open the opencode database: ${dbPath} (${String(err)} / ${String(err2)})`,
            );
        }
    }
}

/** Query the main session and all its descendant sessions (recursive by parent_id) */
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

/**
 * Aggregate the cumulative tokens of a session and all its descendant sessions
 * (read directly from the SQLite session table, i.e., the "whole-session cost",
 * used for the statistics at the beginning of the export file)
 */
async function collectSessionTokens(dbPath: string, sessionId: string): Promise<TokenTotal> {
    const opened = await openDb(dbPath);
    try {
        const sessions = querySessionTree(opened.db, sessionId);
        const total: TokenTotal = { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 };
        for (const r of sessions) {
            total.input += Number(r.tokens_input) || 0;
            total.output += Number(r.tokens_output) || 0;
            total.reasoning += Number(r.tokens_reasoning) || 0;
            total.cacheRead += Number(r.tokens_cache_read) || 0;
            total.cacheWrite += Number(r.tokens_cache_write) || 0;
        }
        return total;
    } finally {
        opened.close();
    }
}

/** Parse the existing data rows of prompts.md (skipping the header), returning the raw lines and a 2D array of 7 columns */
function parsePromptRows(text: string): Array<{ raw: string; cols: string[] }> {
    const rows: Array<{ raw: string; cols: string[] }> = [];
    for (const raw of String(text).replace(/^\uFEFF/, "").split(/\r?\n/)) {
        const trimmed = raw.trim();
        if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
            continue;
        }
        const parts = trimmed.slice(1, -1).split("|").map((c) => c.trim());
        if (parts.length < 7 || parts[0] === "session_id") {
            continue;
        }
        // The prompt content (column 3) may contain escaped \| that gets split; take the 4 token columns
        // from the right and merge the rest back into the left side
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

/** Return the prompts.md file path of the project, ensuring the directory exists */
function promptsFile(projectRoot: string): string {
    const dir = join(projectRoot, "docs", "prompts");
    mkdirSync(dir, { recursive: true });
    return join(dir, "prompts.md");
}

/**
 * Append a prompt row to prompts.md (idempotent: deduplicated by session_id + prompt time)
 * The last 4 columns are first written as "pending" and backfilled by finalizeTokens at the end of the session
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

/** Read all messages of a session from SQLite (including parts), sorted by time */
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
            /* Ignore parse failures */
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
            /* Ignore parse failures */
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

/** Read all user messages of a session (sorted by time), extracting the text */
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

/** Read the token statistics of all assistant messages of a session (message.data.tokens, including time) */
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

/** Add two token statistics together */
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
 * Compute the current conversation cost of each prompt by "prompt window":
 * window i = [time of the i-th prompt, time of the (i+1)-th prompt);
 * window cost = the tokens of the main-session assistant messages during that period
 * + the cumulative tokens of the sub-sessions created during that period
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
    // Assistant message attribution: not earlier than that prompt and earlier than the next prompt → that window
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
    // Sub-session attribution: by which window its creation time falls into
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
 * Backfill the "current conversation cost" of each prompt row in prompts.md
 * (prompt window caliber, idempotent)
 * Rows and DB user messages are matched by the nearest time (tolerance TIME_TOLERANCE_MS)
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
        // Compute the nearest-row match for each user message (when one user can match multiple rows, take the nearest)
        const lines = String(readFileSync(file, "utf8")).replace(/^\uFEFF/, "").split(/\r?\n/);
        const out: string[] = [];
        let updated = 0;
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
                out.push(line);
                continue;
            }
            const parts = trimmed.slice(1, -1).split("|").map((c) => c.trim());
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
            const left = parts.slice(0, parts.length - 4).map((s) => s.trim()).join(" | ");
            out.push(
                `| ${left} | ${w.input} | ${w.output + w.reasoning} | ${w.cacheRead} | ${w.cacheWrite} |`,
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

/** Render a single message as Markdown lines (including reasoning and replies) */
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
                    lines.push("> **Reasoning**");
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
                lines.push(`- Tool call: \`${String(p.data.tool || "unknown")}\` (state: ${String(p.data.state || "unknown")})`);
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
                lines.push(`- Subagent: ${String(p.data.name || "")}`);
                break;
            default:
                break;
        }
    }
    lines.push("");
    return lines;
}

/**
 * Export the conversation snapshot of the main session and all sub-sessions to docs/prompts/
 * The file starts with the cumulative token usage statistics of the whole session
 * (the session table caliber, continuously updated with the export)
 * Data source: direct reads of the SQLite message / part tables (including reasoning and replies)
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
        lines.push(`- Exported at: ${formatTime(Date.now())}`);
        lines.push(`- Session count: ${sessions.length} (main session + ${sessions.length - 1} sub-sessions)`);
        lines.push("");

        // Cumulative token usage statistics of the whole session (at the beginning, continuously updated with the export)
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
        lines.push("## Token Usage");
        lines.push("");
        lines.push("| Session | Input tokens | Output tokens (incl. reasoning) | Reasoning tokens | Cache read | Cache write |");
        lines.push("| --- | --- | --- | --- | --- | --- |");
        for (const s of totals) {
            const label = s.isMain ? "Main session" : "Sub-session";
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
            lines.push(`- ${s.parent_id ? "Sub-session" : "Main session"} \`${s.id}\`${s.title ? ` (${s.title})` : ""}`);
        }
        lines.push("");
        for (const s of sessions) {
            lines.push(`## Session ${s.id}`);
            lines.push("");
            lines.push(`> Created: ${formatTime(s.time_created)}${s.title ? ` | Title: ${s.title}` : ""}`);
            lines.push("");
            if (s.parent_id) {
                lines.push(`> Sub-session (parent session: ${s.parent_id})`);
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
 * Create the prompt-recorder feature (chat.message hook + event hook + 3 tools)
 * @param projectRoot the project root directory
 */
export async function createPromptRecorder(projectRoot: string) {
    let busy = false;
    let exporting = false;

    /** Refresh the export file (to prevent concurrent writes) */
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
     * chat.message hook: records the prompt to prompts.md immediately when the user asks,
     * and refreshes the export file
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
            // Only record main-session prompts: query SQLite to determine whether this session is a
            // sub-session (when not found, treat it as a main session)
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
                /* Still record when the database is unreadable; do not block the main flow */
            }
            const recorded = appendPromptRow(projectRoot, sessionID, Date.now(), prompt);
            if (recorded) {
                console.log(`[impm] prompt-recorder recorded a prompt: ${sessionID} (${prompt.slice(0, 50)}...)`);
            }
            // Refresh the export file right after the prompt (token statistics and conversation content follow the updates)
            await refreshExport(defaultDbPath(), sessionID);
        } catch (err) {
            console.error("[impm] prompt-recorder chat.message processing failed:", String(err));
        }
    };

    /** event hook: backfills the tokens and exports the conversation when the main session turn ends */
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
            // Only handle the main session (the root session without a parent); sub-sessions are
            // exported uniformly by the main session
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
                    `[impm] prompt-recorder main session ${sessionId}: backfilled ${r2.updated} token rows, refreshed the export file`,
                );
            }
        } catch (err) {
            console.error("[impm] prompt-recorder automatic processing failed:", String(err));
        } finally {
            busy = false;
        }
    };

    return {
        chatMessage,
        event,
        tool: {
            /** Manually backfill the user prompts of the specified session into prompts.md */
            impm_prompt_record: {
                description:
                    "Backfills the user prompts of the specified session into the docs/prompts/prompts.md table (idempotent; repeated runs do not produce duplicate rows)",
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    sessionID: createStringSchema("The session ID (required, the main session)"),
                },
                async execute(args: Record<string, unknown>): Promise<string> {
                    const root = (args.projectRoot as string) || projectRoot;
                    const sessionId = String(args.sessionID || "");
                    if (!sessionId) {
                        return "No sessionID specified";
                    }
                    // Extract the user prompts of the session from the SQLite message/part tables and backfill them
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
            /** Manually recompute the current conversation cost and backfill prompts.md */
            impm_prompt_finalize: {
                description:
                    "Recomputes the current conversation token cost of each prompt of the specified session by prompt window (assistant messages after that prompt + sub-sessions), and backfills the input/output/cache columns of prompts.md",
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    sessionID: createStringSchema("The session ID (required, the main session)"),
                    dbPath: createStringSchema(
                        "The opencode database path (optional; default ~/.local/share/opencode/opencode.db)",
                    ),
                },
                async execute(args: Record<string, unknown>): Promise<string> {
                    const root = (args.projectRoot as string) || projectRoot;
                    const dbPath = (args.dbPath as string) || defaultDbPath();
                    const result = await finalizeTokens(root, dbPath, String(args.sessionID || ""));
                    return `Backfilled ${result.updated} token statistic rows (${dbPath})`;
                },
            },
            /** Manually export the conversation snapshot of a session */
            impm_prompt_export: {
                description:
                    "Exports the conversation snapshot of the specified session (main session + all sub-sessions, including reasoning and replies) to docs/prompts/prompt-{YYYYMMDD}-{session_id}.md, with the whole-session token usage statistics at the beginning",
                args: {
                    projectRoot: createStringSchema("The absolute path of the project root directory"),
                    sessionID: createStringSchema("The session ID (required, the main session)"),
                    dbPath: createStringSchema(
                        "The opencode database path (optional; default ~/.local/share/opencode/opencode.db)",
                    ),
                },
                async execute(args: Record<string, unknown>): Promise<string> {
                    const root = (args.projectRoot as string) || projectRoot;
                    const dbPath = (args.dbPath as string) || defaultDbPath();
                    const result = await exportSession(root, dbPath, String(args.sessionID || ""));
                    return `Exported ${result.exported} sessions -> ${result.file}`;
                },
            },
        },
    };
}
