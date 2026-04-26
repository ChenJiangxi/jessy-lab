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

  CREATE TABLE IF NOT EXISTS face_tape (
    id          INTEGER PRIMARY KEY,
    fps         INTEGER NOT NULL,
    frame_count INTEGER NOT NULL,
    data        BLOB NOT NULL,
    updated_at  INTEGER NOT NULL
  );
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

export type FaceTapeRow = {
  fps: number;
  frameCount: number;
  data: Buffer;
  updatedAt: number;
};

export function getFaceTape(): FaceTapeRow | null {
  const row = db
    .prepare(
      `SELECT fps, frame_count, data, updated_at FROM face_tape WHERE id = 1`,
    )
    .get() as
    | { fps: number; frame_count: number; data: Buffer; updated_at: number }
    | undefined;
  if (!row) return null;
  return {
    fps: row.fps,
    frameCount: row.frame_count,
    data: row.data,
    updatedAt: row.updated_at,
  };
}

export function upsertFaceTape(input: {
  fps: number;
  frameCount: number;
  data: Buffer;
}): void {
  const now = Date.now();
  db.prepare(
    `INSERT INTO face_tape (id, fps, frame_count, data, updated_at)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       fps         = excluded.fps,
       frame_count = excluded.frame_count,
       data        = excluded.data,
       updated_at  = excluded.updated_at`,
  ).run(input.fps, input.frameCount, input.data, now);
}

export { db };
