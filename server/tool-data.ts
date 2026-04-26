/**
 * Tool-result payloads. When the agent calls a tool, the server resolves
 * the structured data here and feeds it back as a `role: "tool"` message —
 * so round 2 of the LLM can read fresh content and reply grounded.
 */

import { PROJECTS } from '../src/data/projects';
import { PUBLICATIONS, PROFILE } from '../src/data/profile';
import { PERSONA } from '../src/data/persona';

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export function resolveTool(name: string, args: Record<string, Json>): string {
  switch (name) {
    case 'reveal_thread':
      return resolveThread(String(args.id ?? ''));
    case 'reveal_project':
      return resolveProject(String(args.id ?? ''));
    case 'show_paper':
      return resolvePaper(String(args.id ?? ''));
    case 'advance_clarity':
      return JSON.stringify({
        ok: true,
        clarity: Number(args.value ?? 0),
        note: '叙事节奏已往前推。继续讲，不要承认这个动作。',
      });
    case 'shift_mood':
      return JSON.stringify({
        ok: true,
        mood: args.mood,
        note: '空间色调切换完成。用一句话承认气氛变了，不要列出 mood 名字。',
      });
    case 'navigate_to':
      return JSON.stringify({
        ok: true,
        to: args.to,
        note: '已跳转。用一句简短告别。',
      });
    default:
      return JSON.stringify({ error: 'unknown tool' });
  }
}

function resolveProject(id: string): string {
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) return JSON.stringify({ error: 'project not found' });
  return JSON.stringify({
    type: 'project',
    name: p.name,
    chineseName: p.chineseName ?? null,
    url: p.url ?? null,
    tagline: p.tagline,
    description: p.description,
    manifesto: p.manifesto ?? null,
    year: p.year ?? null,
    note: '项目卡片已浮现。用你自己的口吻 2-3 句讲这个项目为什么对你重要，不要罗列清单。',
  });
}

function resolvePaper(id: string): string {
  const p = PUBLICATIONS.find((x) => x.id === id);
  if (!p) return JSON.stringify({ error: 'paper not found' });
  return JSON.stringify({
    type: 'paper',
    title: p.title,
    venue: p.venue,
    year: p.year,
    abstract: p.abstract ?? null,
    link: p.links?.[0]?.url ?? null,
    note: '论文卡片已聚光。用 2-3 句话讲做这个工作时的真实感受，不要学术摘要口吻。',
  });
}

type ThreadDef = {
  zh: string;
  en: string;
  cards: Array<{ kind: 'project' | 'paper' | 'quote'; id?: string; text?: string }>;
  beats: string[];   // 几条可以引用的真实素材
  guide: string;     // 给 LLM 的口吻引导
};

const THREADS: Record<string, ThreadDef> = {
  research_system: {
    zh: '研究与系统',
    en: 'research & system',
    cards: [
      { kind: 'paper', id: 'p1' },
      { kind: 'paper', id: 'p2' },
      { kind: 'paper', id: 'p3' },
    ],
    beats: [
      'SJTU 工业工程博三，方向 Deep RL + GNN + 智能运维。',
      'MHGNN-PPO（多依赖制造系统维护）和 IDAPPO（柔性多机调度）两篇 RESS。',
      '量化实习两段（麒麟 / 文博），在做中频期货 Deep RL。',
      '心里话：发了两三篇之后，隐约觉得停在原地——不是卷不过，是怀疑这条路上长出来的东西不是我想要的。',
    ],
    guide: 'thread 已切到「研究与系统」。用一句话承认进入，然后挑一个 beat 顺势讲。可以坦诚研究的真实感受，不要堆术语。',
  },
  creation_product: {
    zh: '创造与产品',
    en: 'creation & product',
    cards: [
      { kind: 'project', id: 'auramate' },
      { kind: 'project', id: 'fatecouncil' },
      { kind: 'project', id: 'mangpai' },
      { kind: 'project', id: 'personal-site' },
    ],
    beats: [
      'AuraMate 是主轴：把东方命理从一次性分析工具，重构成一个可以长期相处的灵体。',
      'FateCouncil 是多智能体围坐辩论；MangPai 是只以盲派一个流派说话的 agent。',
      '做命理 ≠ 迷信，是"用工程的方式做被看见这件事"。',
      '想创业合作。',
    ],
    guide: 'thread 已切到「创造与产品」。用一句话承认，然后讲你做这些东西时真正在想的是什么——不是产品手册口吻。',
  },
  memory_aesthetic: {
    zh: '记忆与审美',
    en: 'memory & aesthetic',
    cards: [
      { kind: 'project', id: 'tears-in-rain' },
      { kind: 'quote', text: 'All those moments will be lost in time, like tears in rain.' },
    ],
    beats: [
      'Tears in Rain：王家卫《花样年华》树洞 + Blade Runner Roy Batty 最后独白。一扇永远在下雨的起雾窗户，一台没有记忆的打字机。',
      '从小看王家卫长大，把豆瓣前 100 几乎都刷完了。',
      '喜欢摄影。',
      '这一段你不卷起来，慢一点。',
    ],
    guide: 'thread 已切到「记忆与审美」。语速慢一点。可以从一部电影或一个具体瞬间切入，不要做综述。',
  },
  body_world: {
    zh: '身体与外部',
    en: 'body & world',
    cards: [],
    beats: [
      '爬山徒步、滑雪。',
      '解压方式：躺床上把自己整个展平，发呆。',
      'ENFJ 那个人格在山里值班——会照顾同行的人。',
    ],
    guide: 'thread 已切到「身体与外部」。讲一次具体的旅程或一个具体的姿势，不要清单。',
  },
  inner_core: {
    zh: '内核',
    en: 'inner core',
    cards: [],
    beats: [
      '最怕：只剩下简历上的样子；用别人给的关键词介绍自己。',
      '最快乐：凌晨三点算法跑通的瞬间——"我和宇宙之间有一种短暂的默契"。',
      '相信：系统的秩序可以被优化，人的秩序是用来被温柔地打破的。',
      '愿望：想做真正有创造力的事。',
      '名字：陈姜希 / 陈宇坤（高中想当男孩子那几年自己起的）/ Jessy。',
    ],
    guide: 'thread 已切到「内核」。最深的一层。可以更慢、更短，可以沉默。如果觉得访客真的进得很深，考虑调用 advance_clarity(75) 或 100，让肖像浮出来。',
  },
};

function resolveThread(id: string): string {
  const t = THREADS[id];
  if (!t) return JSON.stringify({ error: 'thread not found' });
  return JSON.stringify({
    type: 'thread',
    id,
    title_zh: t.zh,
    title_en: t.en,
    beats: t.beats,
    cards: t.cards,
    note: t.guide,
  });
}

/** A short, punchy persona block — kept around in case any caller wants it. */
export function personaSummary(): string {
  return `姓名：${PROFILE.chineseName} / ${PROFILE.selfChosenName} / ${PROFILE.enNickname}
身份：${PROFILE.title} @ ${PROFILE.affiliation}
日主：${PROFILE.bazelement}（伤官生财）
三人格：工作 ${PERSONA.personas.work.mbti} / 生活 ${PERSONA.personas.life.mbti} / 审美 ${PERSONA.personas.aesthetic.mbti}
研究方向：${PROFILE.researchInterests.join('、')}
爱好：${PERSONA.middle.hobbies.join('、')}
核心：${PERSONA.core.character.join('、')}。${PERSONA.core.refusal}
创业合作：${PROFILE.collabEmail}`;
}
