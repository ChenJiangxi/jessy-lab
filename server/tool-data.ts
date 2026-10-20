/**
 * Tool-result payloads. When the agent calls a tool, the server resolves
 * the structured data here and feeds it back as a `role: "tool"` message —
 * so round 2 of the LLM can read fresh content and reply grounded.
 *
 * Only lookup tools are left. The v1 "presence" tools (reveal_thread,
 * advance_clarity, shift_mood, navigate_to) drove UI that the current page
 * never rendered: the agent would say "带你过去了" and nothing moved.
 */

import { PROJECTS } from '../src/data/projects';
import { PUBLICATIONS } from '../src/data/profile';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export type ToolResult = {
  /** JSON string fed back to the model. */
  content: string;
  /** Link the page shows under the reply (external URL or site path). */
  link?: string;
};

export function resolveTool(name: string, args: Record<string, Json>): ToolResult {
  switch (name) {
    case 'reveal_project':
      return resolveProject(String(args.id ?? ''));
    case 'show_paper':
      return resolvePaper(String(args.id ?? ''));
    default:
      return { content: JSON.stringify({ error: 'unknown tool' }) };
  }
}

function resolveProject(id: string): ToolResult {
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return { content: JSON.stringify({ error: 'project not found' }) };
  const link = p.url ?? `/projects#${p.id}`;
  return {
    link,
    content: JSON.stringify({
      type: 'project',
      name: p.name,
      chineseName: p.chineseName ?? null,
      url: p.url ?? null,
      page: `/projects#${p.id}`,
      tagline: p.tagline,
      description: p.description,
      manifesto: p.manifesto ?? null,
      year: p.year ?? null,
      note: `这是这个项目的资料。用你自己的口吻 1-3 句讲它为什么对你重要，不要罗列清单。页面会在你这条回复下面自动附上链接（${link}），访客点一下就能打开，所以不要说"带你过去了""已经打开了"；访客要网址时直接写 ${link}。`,
    }),
  };
}

function resolvePaper(id: string): ToolResult {
  const p = PUBLICATIONS.find((x) => x.id === id);
  if (!p) return { content: JSON.stringify({ error: 'paper not found' }) };
  const link = p.links?.[0]?.url;
  return {
    link,
    content: JSON.stringify({
      type: 'paper',
      title: p.title,
      venue: p.venue,
      year: p.year,
      abstract: p.abstract ?? null,
      link: link ?? null,
      note: '这是论文资料。用 2-3 句话讲做这个工作时的真实感受，不要学术摘要口吻。页面会在回复下面附上论文链接。',
    }),
  };
}
