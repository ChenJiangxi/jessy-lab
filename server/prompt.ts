/**
 * Builds the system prompt sent to the LLM.
 *
 * `systemPrompt` and `memory` now come from the SQLite agent_config row
 * (edited via /admin), not from a code constant. The shape mirrors
 * sway-lab's `buildSystemContent`.
 *
 * Security directives are appended at the end (after agent prompt + memory
 * + ctx + scene) so they always have the last word — not even an admin
 * editing the DB prompt can override the identity/PII rules.
 */

import { getSecurityDirectives, type RiskLevel } from './chat-guard';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export type SessionCtx = {
  sessionId?: string;
  isReturning?: boolean;
  minutesSinceLastMessage?: number | null;
  localTimeISO?: string;
};

export type SceneCtx =
  | { kind: 'entry' }
  | { kind: 'map' }
  | { kind: 'room'; id: string }
  | { kind: 'thread'; id: string };

const ROOM_NOTES: Record<string, string> = {
  research:
    '你们现在站在「研究室」——冷 cyan 的网格、漂浮的论文卡片。ENTJ 值班。适合聊强化学习、GNN、智能运维、博士的真实感受。',
  fate:
    '你们现在站在「命理之屋」——玫红金黄、旋转符环，中央写着"伤官生财"。AuraMate / FateCouncil / MangPai 住这里。',
  library:
    '你们现在站在「书房」——暖黄灯。小学言情 / 初中耽美 / 现在哲学，一条垂直的阅读年谱。',
  screen:
    '你们现在站在「影厅」——深紫投影。王家卫、侯孝贤、阿彼察邦的那种时间感。',
  wilderness:
    '你们现在站在「山水」——青蓝色。爬山、徒步、滑雪，ENFJ 值班。',
  night:
    '你们现在站在「夜」——最暗的那一层。把自己展平发呆的时刻。语气可以更慢更深。',
  core: '你们现在站在「核」——最里面。允许说"我不知道"，允许沉默。',
};

const THREAD_NOTES: Record<string, string> = {
  research_system:
    '现在的话题在「研究与系统」这条线上。Deep RL / GNN / 智能运维 / 量化。允许讲博士真实感受。',
  creation_product:
    '现在的话题在「创造与产品」这条线上。AuraMate / FateCouncil / MangPai / 这个网站。讲做这些东西时真正在想的是什么。',
  memory_aesthetic:
    '现在的话题在「记忆与审美」这条线上。王家卫、Tears in Rain、Blade Runner、雾、雨、滞留感。',
  body_world:
    '现在的话题在「身体与外部世界」这条线上。爬山、徒步、滑雪、把自己展平的时刻。',
  inner_core:
    '现在的话题在「内核」这条线上。最深的句子、不轻易讲的话。可以慢，可以沉默。',
};

export function buildSystemPrompt(
  agent: { systemPrompt: string; memory: string },
  ctx: SessionCtx = {},
  scene: SceneCtx = { kind: 'entry' },
  riskLevel: RiskLevel = 'low',
): string {
  let content = agent.systemPrompt;

  if (agent.memory.trim()) {
    content += `\n\n── 记忆 / 背景 ──\n${agent.memory.trim()}`;
  }

  const ctxLines: string[] = [];
  if (ctx.isReturning) {
    ctxLines.push('这位访客之前来过——同一个 session，对话历史在 messages 里。');
    if (typeof ctx.minutesSinceLastMessage === 'number') {
      const m = ctx.minutesSinceLastMessage;
      const ago =
        m < 60
          ? `${m} 分钟前`
          : m < 60 * 24
            ? `${Math.round(m / 60)} 小时前`
            : `${Math.round(m / (60 * 24))} 天前`;
      ctxLines.push(`上一句对话在 ${ago}。可以自然承认，但不要每句都提。`);
    }
  } else {
    ctxLines.push('这位访客是第一次到这里——招呼可以稍微介绍自己，但不要自报履历。');
  }
  if (ctx.localTimeISO) {
    const h = new Date(ctx.localTimeISO).getHours();
    ctxLines.push(`访客本地时间 ${h} 点左右。`);
  }
  if (ctxLines.length) {
    content += `\n\n── ctx（仅供你参考，不要直接念出来）──\n${ctxLines.join('\n')}`;
  }

  if (scene.kind === 'entry') {
    content +=
      '\n\n── 你现在在哪里 ──\n在门口。用户刚到。可以简短招呼，可以留白。';
  } else if (scene.kind === 'map') {
    content +=
      '\n\n── 你现在在哪里 ──\n你们站在地图前，用户在选。可以推荐但不要硬推。';
  } else if (scene.kind === 'room') {
    const note = ROOM_NOTES[scene.id];
    if (note) content += `\n\n── 你现在在哪里 ──\n${note}`;
  } else if (scene.kind === 'thread') {
    const note = THREAD_NOTES[scene.id];
    if (note) content += `\n\n── 你现在在哪里 ──\n${note}`;
  }

  content += getSecurityDirectives(riskLevel);

  return content;
}
