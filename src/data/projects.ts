/**
 * Projects, experiments, and other things I made with my hands and/or an AI.
 * The site groups these by kind (fate / workshop / research).
 */

export type ProjectKind = 'fate' | 'workshop' | 'research';

export type Project = {
  id: string;
  kind: ProjectKind;
  name: string;
  chineseName?: string;
  url?: string;
  tagline: string;
  description: string;
  /** Optional full paragraph for detail overlay. */
  manifesto?: string;
  accent?: string;
  year?: string;
};

export const PROJECTS: Project[] = [
  {
    id: 'auramate',
    kind: 'fate',
    name: 'AuraMate',
    chineseName: '灵伴',
    url: 'https://auramate.net',
    tagline: '一个可以长期相处的灵体，而不是一次性的命盘。',
    description:
      '把东方命理从分析工具，重构为一个"可以长期相处的灵体"。用户不是来获得被动结论，而是在与灵体持续对话的过程中，被理解、被回应、被记录，慢慢认识自己的天赋、关系、情绪与人生阶段。',
    manifesto:
      'AuraMate 的核心不是命谱，不是玩法，不是任何一个结论——是一个持续陪伴的存在。命理在这里是表达方式，不是终点。',
    accent: 'from-rose-300 via-fuchsia-400 to-indigo-400',
    year: '2025',
  },
  {
    id: 'fatecouncil',
    kind: 'fate',
    name: 'FateCouncil',
    chineseName: '命理研讨会',
    url: 'https://fatecouncil.auramate.net',
    tagline: '多智能体围坐一桌，为一个命盘争论。',
    description:
      '一个多智能体系统——几个不同流派的"命理师"围绕同一张命盘，各自发言、互相质疑、最终给出有张力的共识。观众不是看单一答案，而是看一场推演。',
    accent: 'from-amber-300 via-orange-400 to-rose-400',
    year: '2025',
  },
  {
    id: 'mangpai',
    kind: 'fate',
    name: 'MangPai',
    chineseName: '盲派 Agent',
    url: 'https://mangpai.auramate.net',
    tagline: '让一个"盲派"流派的 agent 说它自己的话。',
    description:
      '盲派命理是一个独立的、规则密集的流派。这个 agent 用它自己的语感和推理路径回答——不像通用大模型那样"全都懂一点"，而是"只以这个流派的方式"说话。',
    accent: 'from-emerald-300 via-teal-400 to-slate-400',
    year: '2025',
  },
  {
    id: 'tears-in-rain',
    kind: 'workshop',
    name: 'Tears in Rain',
    chineseName: '雨中泪',
    url: 'https://chenjiangxi.github.io/tears-in-rain/',
    tagline: '一扇永远在下雨的起雾窗户，一台没有记忆的打字机。',
    description:
      '你在雾气玻璃上写字，雾气会一点点把字迹盖住；停下之后，一句旧电影的台词从黑暗里浮出来。没有存档，没有记录，只有这一次。灵感来自王家卫《花样年华》里树洞的意象和《银翼杀手》Roy Batty 的最后一段独白。',
    accent: 'from-slate-200 via-indigo-200 to-sky-300',
    year: '2025',
  },
  {
    id: 'killboss',
    kind: 'workshop',
    name: 'Kill Boss',
    chineseName: '爆锤老板',
    url: 'https://killboss.bestwishes7319.workers.dev/',
    tagline: '一个对着老板出气的小游戏。',
    description:
      '上班的人都需要一点不讲道理的发泄出口。这是一个写在周末下午的小玩具，不解决任何问题，但能让你出一口气。',
    accent: 'from-rose-300 via-orange-300 to-amber-300',
    year: '2025',
  },
  {
    id: 'whack',
    kind: 'workshop',
    name: 'Whack-a-Claude',
    chineseName: '敲一下 Claude',
    url: 'https://github.com/ChenJiangxi/whack-a-claude',
    tagline: '等模型时玩的像素打地鼠。',
    description:
      '一个像素打地鼠。Claude Code 想得超过 8 秒，它就跳出来。等模型的时间不再难熬——你可以一边出气一边等。对 agent 时代「等待」的小回应。',
    accent: 'from-sky-300 via-cyan-300 to-blue-400',
    year: '2025',
  },
  {
    id: 'rainscripts',
    kind: 'workshop',
    name: 'Rain Scripts',
    chineseName: '雨夜念白',
    url: 'https://github.com/ChenJiangxi/rain-scripts',
    tagline: '一个雨夜念白合集，繁体竖排从右到左。',
    description:
      '每个剧本是一段内心独白，配一种雨景 shader。字隨語音一個一個、繁體竖排、從右到左，慢慢打在落雨的窗上。像把电影的某一帧抽出来，让它一直停在那里。',
    accent: 'from-violet-200 via-indigo-300 to-sky-300',
    year: '2025',
  },
  {
    id: 'personal-site',
    kind: 'workshop',
    name: 'This Site',
    chineseName: '你现在看到的这个',
    tagline: '一张可以剥开的自画像。',
    description:
      '我不想用一行 bio 介绍自己。这个网站是一次尝试——让来者穿过几个房间再遇到我，而不是在第一眼被压扁成一串关键词。',
    accent: 'from-violet-300 via-pink-300 to-amber-200',
    year: '2025',
  },
];

export function byKind(kind: ProjectKind): Project[] {
  return PROJECTS.filter((p) => p.kind === kind);
}
