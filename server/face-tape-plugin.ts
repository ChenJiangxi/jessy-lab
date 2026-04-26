/**
 * /api/face-tape — server-side persistent storage for the recorded
 * face-mesh animation she replays whenever the agent is "speaking."
 *
 *   GET  /api/face-tape                            → 200 { fps, frameCount, data: base64 }
 *                                                    404 if no tape yet
 *   POST /api/face-tape  { key, fps, frameCount, data: base64 }
 *                                                    → upserts the single global tape
 *
 * Auth on POST is the same shared admin secret used by /api/admin/*.
 * One row only (id = 1) — recording overwrites the previous take.
 */

import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { getFaceTape, upsertFaceTape } from './db';

const FRAME_FLOATS = 478 * 3;
const FLOAT_BYTES = 4;
const MAX_BODY_BYTES = 8 * 1024 * 1024; // 8MB safety ceiling

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on('data', (c: Buffer) => {
      total += c.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
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

export function faceTapeApiPlugin(): Plugin {
  return {
    name: 'face-tape-api',
    configureServer(server) {
      server.middlewares.use('/api/face-tape', async (req, res) => {
        if (req.method === 'GET') {
          const row = getFaceTape();
          if (!row) return sendJson(res, 404, { error: 'no tape' });
          return sendJson(res, 200, {
            fps: row.fps,
            frameCount: row.frameCount,
            updatedAt: row.updatedAt,
            data: row.data.toString('base64'),
          });
        }

        if (req.method === 'POST') {
          try {
            const body = (await readJson(req)) as {
              key?: string;
              fps?: number;
              frameCount?: number;
              data?: string;
            };
            if (!checkKey(body.key)) {
              return sendJson(res, 401, { error: 'unauthorized' });
            }
            if (
              typeof body.fps !== 'number' ||
              typeof body.frameCount !== 'number' ||
              typeof body.data !== 'string'
            ) {
              return sendJson(res, 400, { error: 'invalid payload' });
            }
            if (body.fps <= 0 || body.frameCount <= 0) {
              return sendJson(res, 400, { error: 'fps/frameCount must be positive' });
            }
            const buf = Buffer.from(body.data, 'base64');
            const expected = body.frameCount * FRAME_FLOATS * FLOAT_BYTES;
            if (buf.length !== expected) {
              return sendJson(res, 400, {
                error: `data size mismatch (got ${buf.length} bytes, expected ${expected})`,
              });
            }
            upsertFaceTape({
              fps: body.fps,
              frameCount: body.frameCount,
              data: buf,
            });
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
