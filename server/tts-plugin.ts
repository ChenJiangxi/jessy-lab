import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * /api/tts — proxy to MiniMax T2A v2 (international tier, api.minimax.io).
 *
 * Request: { text: string }
 * Response: audio/mpeg stream (non-streaming synth for v0 — good enough to
 *   start speaking while the LLM finishes; future version can switch to
 *   MiniMax's streaming endpoint and pipe audio chunks as they arrive.)
 *
 * Why do this server-side: the API key must not touch the browser, and
 * MiniMax international sometimes requires GroupId as a query param.
 */
export function ttsApiPlugin(): Plugin {
  return {
    name: 'tts-api',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('method not allowed');
          return;
        }

        try {
          const body = (await readJson(req)) as { text?: string };
          const text = (body.text || '').trim();
          if (!text) {
            res.statusCode = 400;
            res.end('empty text');
            return;
          }

          const apiKey = process.env.MINIMAX_API_KEY;
          const baseUrl = process.env.MINIMAX_BASE_URL || 'https://api.minimax.io';
          const model = process.env.MINIMAX_MODEL || 'speech-2.5-hd-preview';
          const groupId = process.env.MINIMAX_GROUP_ID || '';

          if (!apiKey) {
            res.statusCode = 503;
            res.end('MINIMAX_API_KEY not set');
            return;
          }

          const url = `${baseUrl}/v1/t2a_v2${groupId ? `?GroupId=${encodeURIComponent(groupId)}` : ''}`;
          const upstream = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              text: text.slice(0, 2000),
              stream: false,
              // pitch=0 per memory (pitch!=0 breaks clone fidelity).
              // MINIMAX_VOICE_ID env var lets us swap to a cloned voice
              // without touching code.
              voice_setting: {
                voice_id: process.env.MINIMAX_VOICE_ID || 'female-shaonv',
                speed: 1.0,
                vol: 1.0,
                pitch: 0,
                emotion: 'neutral',
              },
              audio_setting: {
                sample_rate: 32000,
                bitrate: 128000,
                format: 'mp3',
                channel: 1,
              },
            }),
          });

          if (!upstream.ok) {
            const text = await upstream.text().catch(() => '');
            console.error('[tts] upstream error', upstream.status, text.slice(0, 200));
            res.statusCode = 502;
            res.end(`minimax ${upstream.status}`);
            return;
          }

          // MiniMax returns JSON with a hex-encoded audio payload.
          const json = (await upstream.json()) as {
            data?: { audio?: string; status?: number };
            base_resp?: { status_code?: number; status_msg?: string };
          };

          if (json.base_resp?.status_code && json.base_resp.status_code !== 0) {
            console.error('[tts] minimax non-zero:', json.base_resp);
            res.statusCode = 502;
            res.end(`minimax: ${json.base_resp.status_msg}`);
            return;
          }

          const hex = json.data?.audio;
          if (!hex) {
            res.statusCode = 502;
            res.end('no audio');
            return;
          }

          const buf = Buffer.from(hex, 'hex');
          res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'Content-Length': String(buf.length),
            'Cache-Control': 'no-store',
          });
          res.end(buf);
        } catch (err: any) {
          console.error('[tts-api]', err);
          res.statusCode = 500;
          res.end(err?.message || 'unknown error');
        }
      });
    },
  };
}

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

export type { ServerResponse };
