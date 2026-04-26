/**
 * /api/admin/* — sway-lab style "soul editor" backend.
 *
 *   POST /api/admin/verify     { key }                       → 200 / 401
 *   GET  /api/admin/config?key=...                            → { systemPrompt, memory }
 *   POST /api/admin/config     { key, systemPrompt, memory } → upsert + cache invalidate
 *
 * Auth is a single shared secret in `process.env.ADMIN_SECRET_KEY`.
 * The frontend keeps it in localStorage after the verify step.
 */

import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { upsertAgentConfig } from './db';
import { getAgentConfig, invalidateAgentConfigCache } from './agent-config';

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function checkKey(key: string | undefined): boolean {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) return false;
  if (!key) return false;
  return key === secret;
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

export function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    configureServer(server) {
      // POST /api/admin/verify
      server.middlewares.use('/api/admin/verify', async (req, res) => {
        if (req.method !== 'POST') return sendJson(res, 405, { error: 'method not allowed' });
        try {
          const body = (await readJson(req)) as { key?: string };
          if (!checkKey(body.key)) return sendJson(res, 401, { error: 'unauthorized' });
          sendJson(res, 200, { ok: true });
        } catch (err: any) {
          sendJson(res, 400, { error: err?.message || 'bad request' });
        }
      });

      // /api/admin/config — GET (read) or POST (write)
      server.middlewares.use('/api/admin/config', async (req, res) => {
        if (req.method === 'GET') {
          const url = new URL(req.url ?? '', 'http://localhost');
          const key = url.searchParams.get('key') ?? undefined;
          if (!checkKey(key)) return sendJson(res, 401, { error: 'unauthorized' });
          // getAgentConfig() seeds the default row on first call.
          return sendJson(res, 200, getAgentConfig());
        }
        if (req.method === 'POST') {
          try {
            const body = (await readJson(req)) as {
              key?: string;
              systemPrompt?: string;
              memory?: string;
            };
            if (!checkKey(body.key)) return sendJson(res, 401, { error: 'unauthorized' });
            if (typeof body.systemPrompt !== 'string' || typeof body.memory !== 'string') {
              return sendJson(res, 400, { error: 'systemPrompt and memory must be strings' });
            }
            upsertAgentConfig({ systemPrompt: body.systemPrompt, memory: body.memory });
            invalidateAgentConfigCache();
            return sendJson(res, 200, { ok: true });
          } catch (err: any) {
            return sendJson(res, 400, { error: err?.message || 'bad request' });
          }
        }
        return sendJson(res, 405, { error: 'method not allowed' });
      });
    },
  };
}
