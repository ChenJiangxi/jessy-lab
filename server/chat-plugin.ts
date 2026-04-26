import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { buildSystemPrompt, type SessionCtx, type SceneCtx } from './prompt';
import { resolveTool } from './tool-data';
import { getAgentConfig } from './agent-config';
import { appendMessage, clearMessages, loadMessages } from './db';

/**
 * /api/chat — SSE streaming, two-round tool loop (sway-lab pattern).
 *
 * Identity: client passes a sessionId (UUID in localStorage). The server
 * loads the last 50 messages for that id from SQLite, appends the new
 * user message, runs the model, then appends the assistant reply.
 *
 * The system prompt + memory come from agent_config (DB, 60s cached) —
 * editable in the /admin page.
 */

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'reveal_thread',
      description:
        '把对话切到一条叙事线，前端会浮出对应的 thread 面板。research_system=研究/RL/GNN/论文；creation_product=AuraMate/FateCouncil/MangPai/这个网站；memory_aesthetic=电影/王家卫/审美；body_world=山/徒步/滑雪；inner_core=内核/最深的句子。**严禁**在闲聊、问候、或话题尚未明确转入某条线时调用。',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            enum: [
              'research_system',
              'creation_product',
              'memory_aesthetic',
              'body_world',
              'inner_core',
            ],
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reveal_project',
      description:
        '浮现一个项目卡片。仅当用户问起某个**具体**项目（AuraMate / FateCouncil / MangPai / Tears in Rain）或你主动要讲这个项目的细节时调用。**严禁**在笼统聊天时调用。',
      parameters: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            enum: ['auramate', 'fatecouncil', 'mangpai', 'tears-in-rain', 'personal-site'],
          },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_paper',
      description:
        '聚光一篇论文。仅当用户问到**具体**研究方向并能对应到某篇时调用。p1=MHGNN-PPO多依赖制造系统维护; p2=IDAPPO柔性多机调度; p3=城市绿地语义分割。**严禁**泛泛聊研究时调用。',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string', enum: ['p1', 'p2', 'p3'] } },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'advance_clarity',
      description:
        '把 clarity 推到至少 value（25/50/75/100）——这是叙事节奏控制，让肖像 reveal 的进度跟上对话深度。**只在感到访客真的在问深问题时用**（问你怎么活着、怕什么、最快乐的时刻、为什么停在这里）。一次对话最多 2–3 次。**不是聊得久就推**。',
      parameters: {
        type: 'object',
        properties: {
          value: { type: 'integer', enum: [25, 50, 75, 100] },
        },
        required: ['value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'shift_mood',
      description:
        '改变空间色温。**一次对话至多 1 次**。仅当气氛有明显转向时用：warm=亲密; cold=讨论研究; dreamy=抒情; intimate=最私密。',
      parameters: {
        type: 'object',
        properties: {
          mood: { type: 'string', enum: ['warm', 'cold', 'dreamy', 'intimate'] },
        },
        required: ['mood'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'navigate_to',
      description:
        '跳到作品索引页。**仅当**用户用祈使句明确要"一份作品清单/列表/索引"时调用。**严禁**在介绍单个项目、闲聊、询问功能时调用。',
      parameters: {
        type: 'object',
        properties: { to: { type: 'string', enum: ['/minimal'] } },
        required: ['to'],
      },
    },
  },
];

export function chatApiPlugin(): Plugin {
  return {
    name: 'chat-api',
    configureServer(server) {
      // GET  /api/history?sessionId=xxx       → { messages: [{ role, content, ts }] }
      // POST /api/history (body: { sessionId }) → 200 ok (clears that session)
      server.middlewares.use('/api/history', async (req, res) => {
        try {
          if (req.method === 'GET') {
            const url = new URL(req.url ?? '', 'http://localhost');
            const sessionId = url.searchParams.get('sessionId') ?? '';
            if (!sessionId) {
              res.statusCode = 400;
              res.end('sessionId required');
              return;
            }
            const rows = loadMessages(sessionId, 50);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
              JSON.stringify({
                messages: rows.map((r) => ({
                  role: r.role,
                  content: r.content,
                  ts: r.createdAt,
                })),
              }),
            );
            return;
          }
          if (req.method === 'DELETE') {
            const url = new URL(req.url ?? '', 'http://localhost');
            const sessionId = url.searchParams.get('sessionId') ?? '';
            if (!sessionId) {
              res.statusCode = 400;
              res.end('sessionId required');
              return;
            }
            clearMessages(sessionId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            return;
          }
          res.statusCode = 405;
          res.end('method not allowed');
        } catch (err: any) {
          res.statusCode = 500;
          res.end(err?.message || 'unknown error');
        }
      });

      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('method not allowed');
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        });

        const write = (event: string, data: unknown) => {
          res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        };

        try {
          const body = (await readJson(req)) as {
            sessionId?: string;
            userMessage?: string;
            scene?: SceneCtx;
            localTimeISO?: string;
          };

          const sessionId = (body.sessionId ?? '').trim();
          const userMessage = (body.userMessage ?? '').trim();
          if (!sessionId || !userMessage) {
            write('error', { message: 'sessionId and userMessage are required' });
            res.end();
            return;
          }

          // Load history from DB (sway-lab style — never trust client history).
          const priorRows = loadMessages(sessionId, 50);
          const isReturning = priorRows.length > 0;
          const lastTs = priorRows.at(-1)?.createdAt ?? null;
          const minutesSinceLastMessage =
            lastTs == null ? null : Math.round((Date.now() - lastTs) / 60_000);

          // Persist user message immediately (sway-lab pattern).
          appendMessage(sessionId, 'user', userMessage);

          const ctx: SessionCtx = {
            sessionId,
            isReturning,
            minutesSinceLastMessage,
            localTimeISO: body.localTimeISO ?? new Date().toISOString(),
          };

          const apiKey = process.env.DEEPSEEK_API_KEY;
          const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
          const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

          if (!apiKey) {
            const fallback = await fallbackStream(write, userMessage, isReturning);
            appendMessage(sessionId, 'assistant', fallback);
            write('done', {});
            res.end();
            return;
          }

          const agent = getAgentConfig();
          const systemPrompt = buildSystemPrompt(agent, ctx, body.scene);

          const messages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            ...priorRows.map((r) => ({ role: r.role, content: r.content })),
            { role: 'user', content: userMessage },
          ];

          const fullAssistant = await runTwoRoundStream({
            apiKey,
            baseUrl,
            model,
            messages,
            write,
          });

          if (fullAssistant.trim()) {
            appendMessage(sessionId, 'assistant', fullAssistant);
          }

          write('done', {});
          res.end();
        } catch (err: any) {
          console.error('[chat-api]', err);
          try {
            write('error', { message: err?.message || 'unknown error' });
            res.end();
          } catch {
            /* closed */
          }
        }
      });
    },
  };
}

type ChatMessage = { role: string; content: string | null; tool_calls?: unknown; tool_call_id?: string };

async function runTwoRoundStream(args: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
  write: (event: string, data: unknown) => void;
}): Promise<string> {
  // ── Round 1 ───────────────────────────────────────────────────────
  const round1 = await streamCompletion({
    apiKey: args.apiKey,
    baseUrl: args.baseUrl,
    model: args.model,
    messages: args.messages,
    withTools: true,
    onDelta: (chunk) => args.write('delta', { content: chunk }),
  });

  if (round1.toolCalls.length === 0) {
    return round1.content;
  }

  // Emit UI events for each tool call right away.
  for (const tc of round1.toolCalls) {
    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(tc.arguments || '{}');
    } catch {
      /* ignore */
    }
    args.write('tool', { name: tc.name, args: parsedArgs });
  }

  // ── Round 2: inject tool results and stream again ─────────────────
  const assistantMsg: ChatMessage = {
    role: 'assistant',
    content: round1.content || null,
    tool_calls: round1.toolCalls.map((tc) => ({
      id: tc.id,
      type: 'function',
      function: { name: tc.name, arguments: tc.arguments },
    })),
  };

  const toolMessages: ChatMessage[] = round1.toolCalls.map((tc) => {
    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(tc.arguments || '{}');
    } catch {
      /* ignore */
    }
    return {
      role: 'tool',
      content: resolveTool(tc.name, parsedArgs as Record<string, never>),
      tool_call_id: tc.id,
    };
  });

  const round2Messages = [...args.messages, assistantMsg, ...toolMessages];

  const round2 = await streamCompletion({
    apiKey: args.apiKey,
    baseUrl: args.baseUrl,
    model: args.model,
    messages: round2Messages,
    withTools: false,
    onDelta: (chunk) => args.write('delta', { content: chunk }),
  });

  return (round1.content + round2.content).trim();
}

type ToolCallAcc = { id: string; name: string; arguments: string };

async function streamCompletion(args: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: ChatMessage[];
  withTools: boolean;
  onDelta: (chunk: string) => void;
}): Promise<{ content: string; toolCalls: ToolCallAcc[] }> {
  const body: Record<string, unknown> = {
    model: args.model,
    messages: args.messages,
    stream: true,
    temperature: 0.85,
    max_tokens: 700,
  };
  if (args.withTools) {
    body.tools = TOOLS;
    body.tool_choice = 'auto';
  }

  const res = await fetch(`${args.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`upstream ${res.status}: ${text.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  let content = '';
  const toolAcc: Record<number, ToolCallAcc> = {};

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') break;
      try {
        const json = JSON.parse(payload);
        const choice = json?.choices?.[0];
        const delta = choice?.delta;
        if (delta?.content) {
          content += delta.content;
          args.onDelta(delta.content);
        }
        if (Array.isArray(delta?.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const i = tc.index ?? 0;
            if (!toolAcc[i]) toolAcc[i] = { id: '', name: '', arguments: '' };
            if (tc.id) toolAcc[i].id = tc.id;
            if (tc.function?.name) toolAcc[i].name += tc.function.name;
            if (tc.function?.arguments) toolAcc[i].arguments += tc.function.arguments;
          }
        }
      } catch {
        /* ignore */
      }
    }
  }

  return { content, toolCalls: Object.values(toolAcc) };
}

async function fallbackStream(
  write: (event: string, data: unknown) => void,
  userMessage: string,
  isReturning: boolean,
): Promise<string> {
  const lead = isReturning ? '（你回来了——但 API 没接上）' : '（你好，但我的大脑今天没上线）';
  const text = `${lead}\n你说："${userMessage}"——我记下了。`;
  for (const ch of text) {
    write('delta', { content: ch });
    await new Promise((r) => setTimeout(r, 12));
  }
  return text;
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
