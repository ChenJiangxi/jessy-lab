/**
 * Cached read of the agent config (systemPrompt + memory).
 *
 * Mirrors sway-lab's pattern: reads are hot-pathed (every chat request
 * does one), so a 60-second in-memory cache absorbs the bursts. The
 * /admin save endpoint calls invalidateAgentConfigCache() so edits take
 * effect on the next request.
 */

import { getAgentConfigRaw, seedAgentConfigIfMissing } from './db';
import { SYSTEM_PROMPT as SEED_SYSTEM_PROMPT } from '../config/agent';

type Cached = { systemPrompt: string; memory: string; cachedAt: number };
const TTL_MS = 60_000;
let cached: Cached | null = null;

let seeded = false;
function ensureSeeded(): void {
  if (seeded) return;
  seedAgentConfigIfMissing(SEED_SYSTEM_PROMPT);
  seeded = true;
}

export function getAgentConfig(): { systemPrompt: string; memory: string } {
  ensureSeeded();
  if (cached && Date.now() - cached.cachedAt < TTL_MS) {
    return { systemPrompt: cached.systemPrompt, memory: cached.memory };
  }
  const row = getAgentConfigRaw();
  if (!row) {
    // Should not happen — seed runs above. Defensive fallback.
    return { systemPrompt: SEED_SYSTEM_PROMPT, memory: '' };
  }
  cached = { ...row, cachedAt: Date.now() };
  return { systemPrompt: row.systemPrompt, memory: row.memory };
}

export function invalidateAgentConfigCache(): void {
  cached = null;
}
