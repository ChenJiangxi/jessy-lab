/**
 * Card-style starter prompts. Each layer = a few three-card sets matched
 * to the visitor's current clarity. Cards have a title (the angle) and a
 * subtitle (what's behind that angle).
 */

export type SuggestionCard = {
  title: string;       // "从「当下」开始"
  subtitle: string;    // "正在做什么、关注什么"
  message: string;     // 实际发给 agent 的话
  icon?: string;       // small mono symbol on the card
};

const SIGNAL: SuggestionCard[] = [
  {
    title: '从「状态」开始',
    subtitle: '她最近的状态',
    message: '她最近的状态是什么样的？',
    icon: '◐',
  },
  {
    title: '从「当下」开始',
    subtitle: '正在做什么、关注什么',
    message: '她现在在做什么？最近在关注什么？',
    icon: '⊡',
  },
  {
    title: '从「作品」开始',
    subtitle: '她创造了什么',
    message: '带我看看她做过的有创造力的作品',
    icon: '✺',
  },
];

const FLAME: SuggestionCard[] = [
  {
    title: '从「丁火」开始',
    subtitle: '为什么把自己画成一束烛火',
    message: '你为什么把自己画成丁火？',
    icon: '✦',
  },
  {
    title: '从「AuraMate」开始',
    subtitle: '一个长期相处的灵体',
    message: 'AuraMate 到底是个什么东西？',
    icon: '◈',
  },
  {
    title: '从「研究」开始',
    subtitle: 'Deep RL × 智能运维',
    message: '你的强化学习是研究什么场景？',
    icon: '◇',
  },
];

const FIGURE: SuggestionCard[] = [
  {
    title: '从「转向」开始',
    subtitle: '从学术走向创造',
    message: '你说一直在找属于自己的路——到底在找什么？',
    icon: '↻',
  },
  {
    title: '从「博士」开始',
    subtitle: '读到现在的真实感受',
    message: '博士读到现在你真实的感受是什么？',
    icon: '◊',
  },
  {
    title: '从「害怕」开始',
    subtitle: '她最怕什么',
    message: '你最怕什么？',
    icon: '◬',
  },
];

const PORTRAIT: SuggestionCard[] = [
  {
    title: '从「此刻」开始',
    subtitle: '屏幕另一头，心里在想什么',
    message: '此刻坐在屏幕另一头的你，心里在想什么？',
    icon: '✶',
  },
  {
    title: '从「肖像」开始',
    subtitle: '让我看看你本人',
    message: '让我看看你本人的样子。',
    icon: '◉',
  },
  {
    title: '从「秘密」开始',
    subtitle: '一件几乎没说过的事',
    message: '告诉我一件你几乎没对别人说过的事。',
    icon: '✷',
  },
];

export function suggestionsForClarity(clarity: number): SuggestionCard[] {
  if (clarity < 10) return SIGNAL;
  if (clarity < 40) return FLAME;
  if (clarity < 75) return FIGURE;
  return PORTRAIT;
}
