export const PROFILE = {
  name: 'Jiangxi Chen',
  chineseName: '陈姜希',
  /** 高中时给自己起的中文名。想当男孩子那几年。 */
  selfChosenName: '陈宇坤',
  /** 她自己挑的英文名。比 Jiangxi 更近。 */
  enNickname: 'Jessy',
  title: 'Ph.D. Candidate (3rd Year)',
  affiliation: 'Shanghai Jiao Tong University',
  email: 'chen731925@sjtu.edu.cn',
  /** Founder / collab inbox — kept separate from the academic one. */
  collabEmail: 'jiangxi_chen@163.com',
  /** 自画像小注：做命理项目的人自曝命盘特质。 */
  bazi: '伤官生财',
  /** 她的日主就是这一束小火——全站视觉的核心意象。 */
  bazelement: '丁火',
  bio: `Ph.D. candidate in Industrial Engineering and Management at SJTU.
Bachelor's from SJTU 2023, IE major with Economics minor.
Research: Deep Reinforcement Learning, Intelligent Manufacturing, Graph Neural Networks —
with a focus on maintenance optimization and scheduling in complex systems.`,
  researchInterests: [
    'Deep Reinforcement Learning',
    'Intelligent Manufacturing',
    'Graph Neural Networks',
    'Quantitative Finance',
  ],
  socials: [
    { label: 'Google Scholar', url: 'https://scholar.google.com/citations?user=hzanzkYAAAAJ&hl=zh-CN&oi=ao' },
    { label: 'GitHub', url: 'http://github.com/ChenJiangxi' },
    { label: 'Email', url: 'mailto:chen731925@sjtu.edu.cn' },
  ],
};

export type Publication = {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  highlight?: boolean;
  abstract?: string;
  links?: { label: string; url: string }[];
};

export const PUBLICATIONS: Publication[] = [
  {
    id: 'p1',
    title:
      'Multi-dependence manufacturing system intelligent maintenance optimization based on graph structure and reinforcement learning (MHGNN-PPO)',
    authors: ['Jiangxi Chen', 'Xiaojun Zhou'],
    venue: 'Reliability Engineering & System Safety',
    year: 2025,
    highlight: true,
    abstract:
      'Proposed MHGNN-PPO to model unified economic, degradation, and resource dependencies via hypergraphs and directed graphs.',
    links: [
      { label: 'Paper', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0951832025012864' },
    ],
  },
  {
    id: 'p2',
    title:
      'Maintenance scheduling of flexible multi-machine manufacturing systems with different interaction degradation based on deep reinforcement learning (IDAPPO)',
    authors: ['Jiangxi Chen', 'Xiaojun Zhou'],
    venue: 'Reliability Engineering & System Safety',
    year: 2025,
    highlight: true,
    abstract:
      'Proposed IDAPPO for non-stationary environments and multi-component dependencies in flexible manufacturing, using GNN for spatial degradation correlations.',
    links: [
      { label: 'Paper', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0951832025002194' },
    ],
  },
  {
    id: 'p3',
    title: 'Urban community green space extraction based on semantic segmentation',
    authors: ['Jiangxi Chen', 'Siyu Shao', 'Yifei Zhu', 'Yu Wang', 'Fujie Rao', 'Xilei Dai', 'Dayi Lai'],
    venue: 'Land',
    year: 2022,
    abstract:
      'Improved HRNetV2 for extracting urban green spaces in Shanghai, mapping them to satellite imagery.',
    links: [{ label: 'Paper', url: 'https://www.mdpi.com/2073-445x/11/6/905' }],
  },
];

export type NewsItem = { date: string; title: string; description?: string };

export const NEWS: NewsItem[] = [
  { date: 'Dec 2025', title: 'Paper on MHGNN-PPO accepted by Reliability Engineering & System Safety.' },
  { date: 'Oct 2025', title: 'First Prize, AI for Science Hackathon (Shanghai Station).' },
  { date: 'Mar 2025', title: 'MHGNN-PPO submitted to RESS.' },
  { date: 'Jan 2025', title: 'Finished Quantitative Strategy Internship at Shanghai Qilin Investment.' },
  { date: 'Sep 2023', title: 'Started Ph.D. journey at SJTU.' },
];

export type Experience = { role: string; company: string; period: string; description?: string };

export const EXPERIENCE: Experience[] = [
  {
    role: 'Quant Strategy Research Intern',
    company: 'Shanghai Qilin Investment',
    period: '2024.10 – 2025.01',
    description: 'Mid-frequency futures trading with Deep RL. Backtesting frameworks, RL environment design.',
  },
  {
    role: 'Quant Strategy Research Intern',
    company: 'Shanghai Wenbo Investment',
    period: '2023.03 – 2023.08',
    description: 'ML feature engineering, factor mining, BARRA risk optimization for stock selection.',
  },
  {
    role: 'Ph.D. Candidate',
    company: 'Shanghai Jiao Tong University',
    period: '2023.09 – Present',
    description: 'Department of Industrial Engineering and Management.',
  },
  {
    role: 'B.Eng.',
    company: 'Shanghai Jiao Tong University',
    period: '2019.09 – 2023.06',
    description: 'Industrial Engineering. Minor in Economics.',
  },
];

export const HONORS = [
  'AI for Science Hackathon, Shanghai First Prize (2025.10)',
  'Rongchang Technology Innovation Scholarship Nomination (2022.11)',
  'Mathematical Contest in Modeling, Finalist (2021.04)',
];
