/**
 * SQLite-backed persistence — sway-lab style.
 *
 * Two tables:
 *   - agent_config: a single row (name = "default") holding the editable
 *     systemPrompt + memory blobs. The /admin page rewrites this row;
 *     chat requests read it (with a 60s in-memory cache, see agent-config.ts).
 *   - chat_messages: append-only log keyed by sessionId. The client
 *     generates a UUID into localStorage, so "identity" is just that id.
 */

import Database from 'better-sqlite3';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'personal-site.db');

mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS agent_config (
    id            INTEGER PRIMARY KEY,
    name          TEXT UNIQUE NOT NULL,
    system_prompt TEXT NOT NULL,
    memory        TEXT NOT NULL DEFAULT '',
    created_at    INTEGER NOT NULL,
    updated_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id  TEXT NOT NULL,
    role        TEXT NOT NULL,
    content     TEXT NOT NULL,
    created_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_chat_messages_session
    ON chat_messages(session_id, created_at);
`);

const DEFAULT_NAME = 'default';

export type AgentConfigRow = { systemPrompt: string; memory: string };

export function getAgentConfigRaw(): AgentConfigRow | null {
  const row = db
    .prepare(`SELECT system_prompt, memory FROM agent_config WHERE name = ?`)
    .get(DEFAULT_NAME) as { system_prompt: string; memory: string } | undefined;
  if (!row) return null;
  return { systemPrompt: row.system_prompt, memory: row.memory };
}

export function upsertAgentConfig(input: { systemPrompt: string; memory: string }): void {
  const now = Date.now();
  db.prepare(
    `INSERT INTO agent_config (name, system_prompt, memory, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET
       system_prompt = excluded.system_prompt,
       memory        = excluded.memory,
       updated_at    = excluded.updated_at`,
  ).run(DEFAULT_NAME, input.systemPrompt, input.memory, now, now);
}

/** Insert the seed prompt only if the row doesn't exist. Memory left empty. */
export function seedAgentConfigIfMissing(seedPrompt: string): void {
  const existing = getAgentConfigRaw();
  if (existing) return;
  upsertAgentConfig({ systemPrompt: seedPrompt, memory: '' });
}

export type StoredMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

export function appendMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string,
): void {
  db.prepare(
    `INSERT INTO chat_messages (session_id, role, content, created_at)
     VALUES (?, ?, ?, ?)`,
  ).run(sessionId, role, content, Date.now());
}

export function loadMessages(sessionId: string, limit = 50): StoredMessage[] {
  const rows = db
    .prepare(
      `SELECT id, role, content, created_at FROM chat_messages
       WHERE session_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .all(sessionId, limit) as Array<{
      id: number;
      role: string;
      content: string;
      created_at: number;
    }>;
  return rows
    .reverse()
    .map((r) => ({
      id: r.id,
      role: r.role as 'user' | 'assistant',
      content: r.content,
      createdAt: r.created_at,
    }));
}

export function clearMessages(sessionId: string): void {
  db.prepare(`DELETE FROM chat_messages WHERE session_id = ?`).run(sessionId);
}

export type SessionSummary = {
  sessionId: string;
  msgCount: number;
  lastAt: number;
  firstAt: number;
  /** First user message in the session, truncated for the preview row. */
  firstUserSnippet: string;
};

/** All sessions with at least one message, newest activity first. */
export function listSessions(limit = 200): SessionSummary[] {
  const rows = db
    .prepare(
      `SELECT session_id,
              COUNT(*)        AS msg_count,
              MIN(created_at) AS first_at,
              MAX(created_at) AS last_at
       FROM chat_messages
       GROUP BY session_id
       ORDER BY last_at DESC
       LIMIT ?`,
    )
    .all(limit) as Array<{
      session_id: string;
      msg_count: number;
      first_at: number;
      last_at: number;
    }>;

  const previewStmt = db.prepare(
    `SELECT content FROM chat_messages
     WHERE session_id = ? AND role = 'user'
     ORDER BY created_at ASC LIMIT 1`,
  );

  return rows.map((r) => {
    const preview = previewStmt.get(r.session_id) as { content: string } | undefined;
    const snippet = preview?.content ?? '';
    return {
      sessionId: r.session_id,
      msgCount: r.msg_count,
      firstAt: r.first_at,
      lastAt: r.last_at,
      firstUserSnippet: snippet.length > 120 ? snippet.slice(0, 120) + '…' : snippet,
    };
  });
}

/** Full message history for a session, oldest first. No 50-cap. */
export function loadFullSession(sessionId: string): StoredMessage[] {
  const rows = db
    .prepare(
      `SELECT id, role, content, created_at FROM chat_messages
       WHERE session_id = ?
       ORDER BY created_at ASC`,
    )
    .all(sessionId) as Array<{
      id: number;
      role: string;
      content: string;
      created_at: number;
    }>;
  return rows.map((r) => ({
    id: r.id,
    role: r.role as 'user' | 'assistant',
    content: r.content,
    createdAt: r.created_at,
  }));
}

export { db };
