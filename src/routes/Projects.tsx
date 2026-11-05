import type { ReactNode } from 'react';
import { ProjectGallery, type GalleryWork } from '../components/ProjectGallery';

// Keep project copy, screenshots and device frames together. The gallery owns
// the exhibition layout; src/data/projects.ts remains the chat tool's source.
type Accent =
  | 'gold'
  | 'moon'
  | 'rose'
  | 'amber'
  | 'cream'
  | 'ember'
  | 'sky'
  | 'indigo'
  | 'lavender'
  | 'vermilion';

const ACCENT: Record<Accent, string> = {
  gold: 'rgba(240,200,130,0.90)',
  moon: 'rgba(196,208,240,0.88)',
  rose: 'rgba(255,140,220,0.85)',
  amber: 'rgba(255,200,120,0.85)',
  cream: 'rgba(255,240,200,0.80)',
  ember: 'rgba(255,160,120,0.88)',
  sky: 'rgba(140,200,255,0.88)',
  indigo: 'rgba(168,200,255,0.85)',
  lavender: 'rgba(200,180,255,0.85)',
  vermilion: 'rgba(255,128,104,0.88)',
};

const accentSoft = (h: Accent, alpha: number): string =>
  ACCENT[h].replace(/[\d.]+\)$/, `${alpha})`);

/* ===========================================================================
   DATA
=========================================================================== */

type ProjectData = {
  id: string;
  index: string; // P-001..P-010
  en: string;
  zh: string;
  tagline: string;
  body: string;
  tech?: string;
  url: string;
  urlLabel: string; // shown in browser url bar AND in link
  hue: Accent;
  /** Browser frames show a web screenshot; phone clusters show 1-3 app
   *  screens (first one in front). */
  frame: 'browser' | 'phones';
  /** Browser content aspect — match the screenshot so nothing is cropped
   *  or letterboxed. Default 16 / 10. */
  aspect?: string;
  visual:
    | { kind: 'image'; src: string; objectFit?: 'cover' | 'contain'; objectPosition?: string }
    | { kind: 'signature'; render: () => ReactNode }
    | { kind: 'phones'; screens: PhoneScreen[] };
};

/** One app screen, ~9:19.5, top ~5% left for the Dynamic Island of the bezel. */
type PhoneScreen = { src: string; alt: string };

const PROJECTS: ProjectData[] = [
  {
    id: 'xuanji',
    index: 'P-001',
    en: 'Xuanji',
    zh: '璇 玑',
    tagline: 'Three lineages, one chart, read side by side.',
    body: '盲派八字、紫微斗数、印度占星，三套体系各自排盘、各自推演。同一个问题，三家一致的地方和吵起来的地方都并列摆出来，各家的依据也一起给你看，不替你把分歧抹平。',
    tech: '三个流派各一个 agent，结论不投票、不取平均；共识和分歧分开呈现。网页直接用。',
    url: 'https://xuanji.life',
    urlLabel: 'xuanji.life',
    hue: 'gold',
    frame: 'browser',
    visual: { kind: 'image', src: '/projects/xuanji-dark.webp', objectFit: 'cover', objectPosition: 'center' },
  },
  {
    id: 'duanlian',
    index: 'P-002',
    en: 'DuanLian',
    zh: '断 联',
    tagline: 'Leave the missing here. Take your life back.',
    body: '一个陪人走过分手后那段日子的 iPhone App。给这段关系立一块碑；又想联系 TA 的时候，先把想发的话写下来缓一缓；最难熬的那一会儿，有月亮陪你说话。没发出去的话，可以烧掉，也可以撕掉。',
    tech: '不劝你放下，只是让冲动和行动之间多一点距离。核心工具免费，App Store 美国区已上架。',
    url: 'https://duanlianapp.cn',
    urlLabel: 'duanlianapp.cn',
    hue: 'moon',
    frame: 'phones',
    visual: {
      kind: 'phones',
      screens: [
        { src: '/projects/duanlian-main.webp', alt: '断联 · 今天：断联第 272 天，给这段关系立的碑' },
        { src: '/projects/duanlian-moon.webp', alt: '断联 · 月亮：想说的话对月亮说' },
        { src: '/projects/duanlian-pause.webp', alt: '断联 · 想联系 TA：先写下来缓一缓' },
      ],
    },
  },
  {
    id: 'auramate',
    index: 'P-003',
    en: 'AuraMate',
    zh: '灵 伴',
    tagline: 'A presence you can keep, not a one-shot reading.',
    body: '一个可以长期相处的八字灵体。它不是给你一份命盘就走，而是慢慢认得你、记得你的人、理解你这一刻在问的为什么是这件事。',
    tech: '多 agent 工具循环 / 命理本地知识库 RAG / 多流派人格注入 / 长期记忆 / 服务端预计算十神生克。',
    url: 'https://auramate.net',
    urlLabel: 'auramate.net',
    hue: 'rose',
    frame: 'phones',
    visual: {
      kind: 'phones',
      screens: [
        { src: '/projects/auramate-main.webp', alt: 'AuraMate · 灵体与对话：从我的命盘看，我适合创业吗' },
        { src: '/projects/auramate-home.webp', alt: 'AuraMate · 首页' },
        { src: '/projects/auramate-mingpu.webp', alt: 'AuraMate · 命谱' },
      ],
    },
  },
  {
    id: 'fatecouncil',
    index: 'P-004',
    en: 'FateCouncil',
    zh: '命 理 研 讨 会',
    tagline: 'A quorum of ghosts, debating one chart.',
    body: '几个流派围坐一桌，为同一张命盘各自发言、互相质疑、最后给出有张力的共识。每个 agent 都有自己的偏见——这一点没有被磨平。',
    tech: '多 agent 协作辩论 / 共识收敛 / 各派人格保持独立。',
    url: 'https://fatecouncil.auramate.net',
    urlLabel: 'fatecouncil.auramate.net',
    hue: 'amber',
    frame: 'browser',
    aspect: '1600 / 871',
    visual: { kind: 'image', src: '/projects/fatecouncil.webp', objectFit: 'cover' },
  },
  {
    id: 'mangpai',
    index: 'P-005',
    en: 'MangPai',
    zh: '盲 派',
    tagline: 'One voice, one lineage.',
    body: '盲派看命，习惯把命主当成一个故事的主角，而不是一张图。这个 agent 只用一个流派说话——不是工具，是一个有口音的人。',
    tech: '通用大模型「全都懂一点」。这个 agent「只这一种活法」。',
    url: 'https://mangpai.auramate.net',
    urlLabel: 'mangpai.auramate.net',
    hue: 'cream',
    frame: 'browser',
    visual: { kind: 'image', src: '/projects/mangpai-home.webp', objectFit: 'cover' },
  },
  {
    id: 'killboss',
    index: 'P-006',
    en: 'Kill Boss',
    zh: '爆 锤 老 板',
    tagline: 'A weekend toy. Not a product.',
    body: '上班的人都需要一点不讲道理的发泄出口。这是一个写在周末下午的小玩具，不解决任何问题，但能让你出一口气。',
    tech: '一种「玩具优先于产品」的练习：先把自己逗乐了，再说能不能给别人。',
    url: 'https://killboss.bestwishes7319.workers.dev/',
    urlLabel: 'killboss.bestwishes7319.workers.dev',
    hue: 'ember',
    frame: 'phones',
    visual: {
      kind: 'phones',
      screens: [
        { src: '/projects/killboss-play.webp', alt: 'Kill Boss · 开打' },
        { src: '/projects/killboss-home.webp', alt: 'Kill Boss · 首页' },
      ],
    },
  },
  {
    id: 'whack',
    index: 'P-007',
    en: 'Whack-a-Claude',
    zh: '敲 一 下 Claude',
    tagline: 'Waiting is a form of gameplay.',
    body: '一个像素打地鼠。Claude Code 想得超过 8 秒，它就跳出来。等模型的时间不再难熬——你可以一边出气一边等。',
    tech: '对 agent 时代「等待」的小回应。',
    url: 'https://github.com/ChenJiangxi/whack-a-claude',
    urlLabel: 'github.com/ChenJiangxi/whack-a-claude',
    hue: 'sky',
    frame: 'browser',
    aspect: '1600 / 871',
    visual: { kind: 'image', src: '/projects/whack-a-claude.webp', objectFit: 'cover' },
  },
  {
    id: 'tears-in-rain',
    index: 'P-008',
    en: 'Tears in Rain',
    zh: '雨 中 泪',
    tagline: 'A window that will not dry. A typewriter without memory.',
    body: '一扇永远在下雨的起雾窗户。一台没有记忆的打字机。王家卫《花样年华》＋ 银翼杀手 Roy Batty 最后那段独白，做成一个网站。没有存档，没有记录，只有这一次。',
    url: 'https://chenjiangxi.github.io/tears-in-rain/',
    urlLabel: 'chenjiangxi.github.io/tears-in-rain',
    hue: 'indigo',
    frame: 'browser',
    visual: { kind: 'image', src: '/projects/tears-in-rain.jpg', objectFit: 'cover' },
  },
  {
    id: 'rainscripts',
    index: 'P-009',
    en: 'Rain Scripts',
    zh: '雨 夜 念 白',
    tagline: 'A script meant to be read alone.',
    body: '一个「雨夜 · 念白」的合集站。每个剧本是一段内心独白，配一种雨景 shader。字隨語音一個一個、繁體竖排、從右到左，慢慢打在落雨的窗上。',
    tech: '像把电影的某一帧抽出来，让它一直停在那里。',
    url: 'https://github.com/ChenJiangxi/rain-scripts',
    urlLabel: 'rain-scripts · github',
    hue: 'lavender',
    frame: 'browser',
    visual: { kind: 'signature', render: () => <RainVisual /> },
  },
  {
    id: 'temple',
    index: 'P-010',
    en: 'Temple',
    zh: '寺 · 光 与 空 间',
    tagline: 'Sunlight through the sutra, onto the pillar.',
    body: '一座小寺，外壳刻着心经和万字纹。日光穿过字孔落在柱上，穿过屋顶落在白玉佛身上。照着原作的 CAD 图纸和实体模型照片，在浏览器里把它重新建了一遍：可以绕着看，也可以走进殿里。',
    tech: '春分、夏至、秋分、冬至、夜景随手切换，把时间加速，看经文的影子跟着太阳在柱上移动；随时和原作照片对照。',
    url: 'https://temple.jessylab.cc',
    urlLabel: 'temple.jessylab.cc',
    hue: 'vermilion',
    frame: 'browser',
    aspect: '1440 / 900',
    visual: { kind: 'image', src: '/projects/temple.webp', objectFit: 'cover', objectPosition: 'center' },
  },
];

type ChapterData = {
  num: 'I' | 'II' | 'III' | 'IV' | 'V';
  zh: string;
  en: string;
  rationale: string;
  ids: string[];
};

const CHAPTERS: ChapterData[] = [
  {
    num: 'I',
    zh: '上 线',
    en: 'NOW SHIPPING',
    rationale: '最近在做的两个产品，都已经上线：一个看命，一个陪人走出分手。',
    ids: ['xuanji', 'duanlian'],
  },
  {
    num: 'II',
    zh: '命 理',
    en: 'TRINITY OF FATE',
    rationale: '同一个引擎，三种说话方式：长期陪伴 · 众声议会 · 独尊一派。',
    ids: ['auramate', 'fatecouncil', 'mangpai'],
  },
  {
    num: 'III',
    zh: '玩 具',
    en: 'TOYS',
    rationale: '不解决问题。让你出一口气，或者让等模型这件事不那么难熬。',
    ids: ['killboss', 'whack'],
  },
  {
    num: 'IV',
    zh: '雾 中',
    en: 'IN THE FOG',
    rationale: '把电影的某一帧抽出来，让它一直停在那里。',
    ids: ['tears-in-rain', 'rainscripts'],
  },
  {
    num: 'V',
    zh: '空 间',
    en: 'LIGHT & SPACE',
    rationale: '把只存在于图纸和模型里的一座小寺重新建起来，让日光照进去。',
    ids: ['temple'],
  },
];


export default function Projects() {
  const works: GalleryWork[] = PROJECTS.map(project => ({
    id: project.id, index: project.index, en: project.en, zh: project.zh,
    tagline: project.tagline, body: project.body, tech: project.tech,
    url: project.url, urlLabel: project.urlLabel, color: ACCENT[project.hue],
    aspect: project.aspect ? project.aspect.split('/').map(Number).reduce((a, b) => a / b) : 1.6,
    phone: project.frame === 'phones',
    preview: project.visual.kind === 'image' ? project.visual.src
      : project.visual.kind === 'phones' ? project.visual.screens[0]?.src : undefined,
    visual: project.visual.kind === 'phones'
      ? <PhoneCluster screens={project.visual.screens} hue={project.hue} />
      : <BrowserChrome url={project.urlLabel} hue={project.hue} aspectRatio={project.aspect}><ProjectVisualInner data={project} /></BrowserChrome>,
  }));
  return <ProjectGallery works={works} chapters={CHAPTERS} />;
}

function ProjectVisualInner({ data }: { data: ProjectData }) {
  if (data.visual.kind === 'image') {
    return (
      <img
        src={data.visual.src}
        alt={data.en}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 w-full h-full select-none"
        style={{
          userSelect: 'none',
          objectFit: data.visual.objectFit ?? 'cover',
          objectPosition: data.visual.objectPosition ?? '50% 50%',
        }}
      />
    );
  }
  if (data.visual.kind === 'signature') return <>{data.visual.render()}</>;
  return null;
}

/* ===========================================================================
   BROWSER CHROME — traffic lights + URL bar above content area.
   The realistic frame is what makes the screenshots' rectangular bg colors
   read as "intentional device frames" rather than untreated PNGs.
=========================================================================== */

function BrowserChrome({
  url,
  hue,
  children,
  aspectRatio = '16 / 10',
}: {
  url: string;
  hue: Accent;
  children: ReactNode;
  aspectRatio?: string;
}) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        borderRadius: 12,
        border: `1px solid ${accentSoft(hue, 0.18)}`,
        background: '#0d0816',
        boxShadow:
          '0 30px 60px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35), ' +
          `0 0 80px ${accentSoft(hue, 0.10)}`,
        animation: 'pj_drift 9s ease-in-out infinite',
      }}
    >
      {/* chrome bar */}
      <div
        className="flex items-center gap-3 px-3.5 py-2.5"
        style={{
          background: 'linear-gradient(180deg, rgba(28, 22, 42, 0.98), rgba(20, 16, 32, 0.98))',
          borderBottom: '1px solid rgba(240,232,220,0.06)',
        }}
      >
        {/* traffic lights */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="block w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57', opacity: 0.85 }} />
          <span className="block w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e', opacity: 0.85 }} />
          <span className="block w-2.5 h-2.5 rounded-full" style={{ background: '#28c840', opacity: 0.85 }} />
        </div>
        {/* URL pill — slightly indented from center for realism */}
        <div
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1 mx-2 truncate"
          style={{
            background: 'rgba(240,232,220,0.05)',
            borderRadius: 6,
            border: '1px solid rgba(240,232,220,0.05)',
          }}
        >
          <LockIcon />
          <span
            className="font-mono text-[10.5px] truncate text-[#f0e8dc]/55"
            style={{ letterSpacing: '0.02em' }}
          >
            {url}
          </span>
        </div>
        {/* right-side spacer (mimics tab/icon area) */}
        <div className="hidden sm:flex items-center gap-1 shrink-0 opacity-40">
          <span className="block w-3 h-3 rounded-sm border border-[#f0e8dc]/30" />
        </div>
      </div>
      {/* content area */}
      <div className="relative w-full" style={{ aspectRatio }}>
        {children}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" className="shrink-0 opacity-50">
      <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/* ===========================================================================
   PHONE CHROME — used for AuraMate
=========================================================================== */

/**
 * 1-3 phones: the first screen stands in front, the rest sit behind it,
 * tilted and dimmed, so an app shows a few of its screens instead of one
 * small phone in an empty column. With two screens the front phone moves
 * left; with three the back ones flank it.
 */
function PhoneCluster({ screens, hue }: { screens: PhoneScreen[]; hue: Accent }) {
  const [front, ...back] = screens;
  if (!front) return null;
  const slots =
    back.length === 1
      ? [{ left: '68%', rot: 6 }]
      : [
          { left: '21%', rot: -6 },
          { left: '79%', rot: 6 },
        ];
  return (
    <div className="relative w-full py-[4%]">
      {back.map((s, i) => (
        <div
          key={s.src}
          className="absolute z-0"
          style={{
            top: '13%',
            left: slots[i]!.left,
            width: 'min(226px, 38%)',
            transform: `translateX(-50%) rotate(${slots[i]!.rot}deg)`,
            filter: 'brightness(0.68) saturate(0.9)',
          }}
        >
          <PhoneDevice hue={hue} delay={`${-3 - i * 2}s`} glow={false}>
            <PhoneScreenImg screen={s} />
          </PhoneDevice>
        </div>
      ))}
      <div
        className="relative z-10"
        style={{
          width: 'min(270px, 46%)',
          marginLeft: back.length === 1 ? '38%' : '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <PhoneDevice hue={hue}>
          <PhoneScreenImg screen={front} />
        </PhoneDevice>
      </div>
    </div>
  );
}

function PhoneScreenImg({ screen }: { screen: PhoneScreen }) {
  return (
    <img
      src={screen.src}
      alt={screen.alt}
      loading="lazy"
      decoding="async"
      draggable={false}
      className="absolute select-none"
      style={{
        // screen rectangle inside /devices/iphone-silver.webp
        left: '5.10204%',
        top: '2.2%',
        width: '89.79592%',
        height: '95.6%',
        objectFit: 'cover',
        objectPosition: 'center top',
        userSelect: 'none',
      }}
    />
  );
}

/**
 * Real iPhone template, same assets as duanlianapp.cn: the screenshot sits
 * in the screen rectangle, clipped by the rounded-corner mask, and the
 * silver bezel (with its Dynamic Island) is laid on top.
 */
function PhoneDevice({
  hue,
  glow = true,
  delay = '0s',
  children,
}: {
  hue: Accent;
  glow?: boolean;
  delay?: string;
  children: ReactNode;
}) {
  const mask = "url('/devices/iphone-screen-mask.png') center / 100% 100% no-repeat";
  return (
    <div
      className="relative w-full"
      style={{
        aspectRatio: '1470 / 3000',
        filter:
          'drop-shadow(0 26px 28px rgba(0,0,0,0.55))' +
          (glow ? ` drop-shadow(0 0 36px ${accentSoft(hue, 0.22)})` : ''),
        animation: `pj_drift 9s ease-in-out ${delay} infinite`,
      }}
    >
      <div className="absolute inset-0" style={{ mask, WebkitMask: mask }}>
        {children}
      </div>
      <img
        src="/devices/iphone-silver.webp"
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
      />
    </div>
  );
}

/* ===========================================================================
   SIGNATURE VISUALS — used for projects without real screenshots.
   Designed to fill a 16:10 browser-chrome content area cleanly.
=========================================================================== */

function RainVisual() {
  const COLUMNS = [
    { chars: '雨夜念白', delay: 0, speed: 9 },
    { chars: '燈下無人', delay: 1.4, speed: 11 },
    { chars: '誰在說話', delay: 2.8, speed: 10 },
    { chars: '我聽見了', delay: 4.2, speed: 12 },
    { chars: '雨還在落', delay: 0.6, speed: 9.5 },
  ];
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #0e0a1c 0%, #15102a 50%, #0e0a1c 100%)',
      }}
    >
      {/* drizzle */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-8 w-px"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: '-30px',
              background:
                'linear-gradient(180deg, transparent, rgba(160,200,240,0.55), transparent)',
              animation: `pj_descend ${2.2 + (i % 4) * 0.5}s linear infinite ${i * 0.21}s`,
            }}
          />
        ))}
      </div>
      {/* falling traditional CJK columns on the right */}
      <div className="absolute inset-y-0 right-0 w-[60%] overflow-hidden">
        {COLUMNS.map((col, i) => (
          <div
            key={i}
            className="absolute top-0 font-zhSerif"
            style={{
              right: `${i * 12 + 4}%`,
              writingMode: 'vertical-rl',
              color: 'rgba(200,220,255,0.78)',
              fontSize: 'clamp(13px, 1.2vw, 18px)',
              letterSpacing: '0.4em',
              textShadow: '0 0 8px rgba(160,200,240,0.4)',
              animation: `pj_descend ${col.speed}s linear infinite ${col.delay}s`,
            }}
          >
            {col.chars}
          </div>
        ))}
      </div>
      {/* corner stamps */}
      <div className="absolute top-4 left-5 font-mono text-[9px] tracking-[0.45em] text-[#c8dcff]/45">
        雨 夜 念 白
      </div>
      <div className="absolute bottom-4 right-5 font-mono text-[9px] tracking-[0.45em] text-[#c8dcff]/30">
        VERTICAL · TRADITIONAL
      </div>
    </div>
  );
}
