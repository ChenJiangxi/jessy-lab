/**
 * Builds the system prompt sent to the LLM.
 *
 * `systemPrompt` and `memory` now come from the SQLite agent_config row
 * (edited via /admin), not from a code constant. The shape mirrors
 * sway-lab's `buildSystemContent`.
 *
 * Security directives are appended at the end (after agent prompt + memory
 * + ctx) so they always have the last word — not even an admin
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

export function buildSystemPrompt(
  agent: { systemPrompt: string; memory: string },
  ctx: SessionCtx = {},
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

  content += getSecurityDirectives(riskLevel);

  return content;
}
