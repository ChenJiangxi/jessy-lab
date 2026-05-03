import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';

/* ============================================================================
   PROJECTS — curator's catalogue.

   Design intent (this is the third pass; do not regress to "rotated titles
   per project" or "constellation of dots"):

   - Editorial / asymmetric spread for each work. 12-col grid; each project
     occupies cols 1-7 (visual) and 8-12 (info), alternating sides on every
     other work so the page reads as a turning catalogue rather than a stack.
   - Every web screenshot lives inside a realistic <BrowserChrome> mockup
     (traffic lights + URL pill). AuraMate's phone shot sits inside a
     <PhoneChrome> bezel. The two no-screenshot works (MangPai, RainScripts)
     get hand-rendered visuals INSIDE the same browser chrome — so the
     rectangular PNG backgrounds of game screenshots and the absent shots
     both read as "intentional device frames" rather than untreated assets.
   - Chapter dividers: giant italic-serif Roman numeral filling 3 cols,
     chapter title + rationale filling the rest. A hairline closes the band.
   - Brand wordmark in the top-left uses <BrandMark> — single source of truth
     shared with /v2 and /arts so the italic Jessy never drifts between pages.
   - Type roles fixed across every card: italic serif title at one scale,
     zhSerif Chinese name at one scale, italic tagline at one scale, zhSerif
     body, mono labels. Variation comes from CONTENT, not from per-card
     typography.
============================================================================ */

type Accent =
  | 'rose'
  | 'amber'
  | 'cream'
  | 'ember'
  | 'sky'
  | 'indigo'
  | 'lavender';

const ACCENT: Record<Accent, string> = {
  rose: 'rgba(255,140,220,0.85)',
  amber: 'rgba(255,200,120,0.85)',
  cream: 'rgba(255,240,200,0.80)',
  ember: 'rgba(255,160,120,0.88)',
  sky: 'rgba(140,200,255,0.88)',
  indigo: 'rgba(168,200,255,0.85)',
  lavender: 'rgba(200,180,255,0.85)',
};

const accentSoft = (h: Accent, alpha: number): string =>
  ACCENT[h].replace(/[\d.]+\)$/, `${alpha})`);

/* ===========================================================================
   DATA
=========================================================================== */

type ProjectData = {
  id: string;
  index: string; // P-001..P-007
  en: string;
  zh: string;
  tagline: string;
  body: string;
  tech?: string;
  url: string;
  urlLabel: string; // shown in browser url bar AND in link
  hue: Accent;
  frame: 'browser' | 'phone';
  visual:
    | { kind: 'image'; src: string; objectFit?: 'cover' | 'contain'; objectPosition?: string }
    | { kind: 'signature'; render: () => ReactNode };
};

const PROJECTS: ProjectData[] = [
  {
    id: 'auramate',
    index: 'P-001',
    en: 'AuraMate',
    zh: '灵 伴',
    tagline: 'A presence you can keep, not a one-shot reading.',
    body: '一个可以长期相处的八字灵体。它不是给你一份命盘就走，而是慢慢认得你、记得你的人、理解你这一刻在问的为什么是这件事。',
    tech: '多 agent 工具循环 / 命理本地知识库 RAG / 多流派人格注入 / 长期记忆 / 服务端预计算十神生克。',
    url: 'https://auramate.net',
    urlLabel: 'auramate.net',
    hue: 'rose',
    frame: 'phone',
    visual: { kind: 'image', src: '/projects/auramate-hero.png', objectFit: 'cover', objectPosition: 'center top' },
  },
  {
    id: 'fatecouncil',
    index: 'P-002',
    en: 'FateCouncil',
    zh: '命 理 研 讨 会',
    tagline: 'A quorum of ghosts, debating one chart.',
    body: '几个流派围坐一桌，为同一张命盘各自发言、互相质疑、最后给出有张力的共识。每个 agent 都有自己的偏见——这一点没有被磨平。',
    tech: '多 agent 协作辩论 / 共识收敛 / 各派人格保持独立。',
    url: 'https://fatecouncil.auramate.net',
    urlLabel: 'fatecouncil.auramate.net',
    hue: 'amber',
    frame: 'browser',
    visual: { kind: 'image', src: '/projects/fatecouncil.png', objectFit: 'cover' },
  },
  {
    id: 'mangpai',
    index: 'P-003',
    en: 'MangPai',
    zh: '盲 派',
    tagline: 'One voice, one lineage.',
    body: '盲派看命，习惯把命主当成一个故事的主角，而不是一张图。这个 agent 只用一个流派说话——不是工具，是一个有口音的人。',
    tech: '通用大模型「全都懂一点」。这个 agent「只这一种活法」。',
    url: 'https://mangpai.auramate.net',
    urlLabel: 'mangpai.auramate.net',
    hue: 'cream',
    frame: 'browser',
    visual: { kind: 'image', src: '/projects/mangpai.png', objectFit: 'contain' },
  },
  {
    id: 'killboss',
    index: 'P-004',
    en: 'Kill Boss',
    zh: '爆 锤 老 板',
    tagline: 'A weekend toy. Not a product.',
    body: '上班的人都需要一点不讲道理的发泄出口。这是一个写在周末下午的小玩具，不解决任何问题，但能让你出一口气。',
    tech: '一种「玩具优先于产品」的练习：先把自己逗乐了，再说能不能给别人。',
    url: 'https://killboss.bestwishes7319.workers.dev/',
    urlLabel: 'killboss.bestwishes7319.workers.dev',
    hue: 'ember',
    frame: 'browser',
    visual: { kind: 'image', src: '/projects/killboss.png', objectFit: 'contain' },
  },
  {
    id: 'whack',
    index: 'P-005',
    en: 'Whack-a-Claude',
    zh: '敲 一 下 Claude',
    tagline: 'Waiting is a form of gameplay.',
    body: '一个像素打地鼠。Claude Code 想得超过 8 秒，它就跳出来。等模型的时间不再难熬——你可以一边出气一边等。',
    tech: '对 agent 时代「等待」的小回应。',
    url: 'https://github.com/ChenJiangxi/whack-a-claude',
    urlLabel: 'github.com/ChenJiangxi/whack-a-claude',
    hue: 'sky',
    frame: 'browser',
    visual: { kind: 'image', src: '/projects/whack-a-claude.png', objectFit: 'contain' },
  },
  {
    id: 'tears',
    index: 'P-006',
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
    index: 'P-007',
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
];

type ChapterData = {
  num: 'I' | 'II' | 'III';
  zh: string;
  en: string;
  rationale: string;
  ids: string[];
};

const CHAPTERS: ChapterData[] = [
  {
    num: 'I',
    zh: '命 理',
    en: 'TRINITY OF FATE',
    rationale: '同一个引擎，三种说话方式：长期陪伴 · 众声议会 · 独尊一派。',
    ids: ['auramate', 'fatecouncil', 'mangpai'],
  },
  {
    num: 'II',
    zh: '玩 具',
    en: 'TOYS',
    rationale: '不解决问题。让你出一口气，或者让等模型这件事不那么难熬。',
    ids: ['killboss', 'whack'],
  },
  {
    num: 'III',
    zh: '雾 中',
    en: 'IN THE FOG',
    rationale: '把电影的某一帧抽出来，让它一直停在那里。',
    ids: ['tears', 'rainscripts'],
  },
];

/* ===========================================================================
   PAGE
=========================================================================== */

export default function Projects() {
  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-[#1a1525] text-[#f0e8dc]">
      <PageBg />
      <PageChrome />

      <main className="relative z-10">
        <Hero />
        {CHAPTERS.map((chapter, ci) => {
          // global project counter for left/right alternation
          let globalIndex =
            CHAPTERS.slice(0, ci).reduce((s, c) => s + c.ids.length, 0);
          return (
            <section key={chapter.num}>
              <ChapterBanner chapter={chapter} />
              {chapter.ids.map((pid) => {
                const p = PROJECTS.find((x) => x.id === pid)!;
                const side = globalIndex % 2 === 0 ? 'left' : 'right';
                globalIndex++;
                return <ProjectSpread key={pid} data={p} side={side} />;
              })}
            </section>
          );
        })}
        <Foot />
      </main>

      <style>{`
        @keyframes pj_drift {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        @keyframes pj_descend {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 0.85; }
          90%  { opacity: 0.85; }
          100% { transform: translateY(120%); opacity: 0; }
        }
        @keyframes pj_reveal {
          0%   { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .pj-reveal {
          opacity: 0;
        }
        .pj-reveal.pj-in {
          animation: pj_reveal 900ms cubic-bezier(0.2, 0.65, 0.3, 1) both;
        }
      `}</style>
    </div>
  );
}

/* ===========================================================================
   PAGE BACKGROUND + CHROME
=========================================================================== */

function PageBg() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at -8% 12%, rgba(190,120,210,0.10), transparent 55%),' +
            'radial-gradient(ellipse 70% 50% at 108% 88%, rgba(120,180,255,0.10), transparent 55%)',
        }}
      />
    </>
  );
}

function PageChrome() {
  return (
    <>
      <div className="fixed top-5 left-6 z-40">
        <BrandMark subtitle="PORTFOLIO" />
      </div>
      <Link
        to="/"
        className="fixed bottom-6 left-6 z-40 font-mono text-[10px] tracking-[0.32em] uppercase text-[#f4ecdc]/45 hover:text-[#c8a5ff]"
        style={{ transition: 'color 280ms ease' }}
      >
        ← BACK TO JESSY
      </Link>
    </>
  );
}

/* ===========================================================================
   HERO — no twee meta tag. Just title + subtitle.
=========================================================================== */

function Hero() {
  return (
    <section className="px-6 md:px-16 lg:px-24 pt-32 md:pt-40 pb-20 max-w-7xl mx-auto">
      <h1
        className="font-serif italic text-[#f0e8dc]/95 leading-[0.92]"
        style={{
          fontSize: 'clamp(56px, 9vw, 144px)',
          letterSpacing: '-0.035em',
          fontVariationSettings: "'opsz' 144, 'SOFT' 50, 'WONK' 1",
        }}
      >
        Things I&rsquo;ve made,
        <br />
        <span className="text-[#f0e8dc]/55">a little alive.</span>
      </h1>
      <div className="mt-12 grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-7 md:col-start-6">
          <p
            className="font-zhSerif text-[#f0e8dc]/68 leading-[1.95] tracking-[0.04em]"
            style={{ fontSize: 'clamp(15px, 1.3vw, 18px)' }}
          >
            一个写命的工程师，把一些很私人的念头做成了能被看见的工程。
            玄学、玩具、还有一些只为审美而存在的碎片。
          </p>
        </div>
      </div>
    </section>
  );
}

/* ===========================================================================
   CHAPTER BANNER — giant italic Roman numeral on the left, info on the right.
=========================================================================== */

function ChapterBanner({ chapter }: { chapter: ChapterData }) {
  const ref = useReveal();
  return (
    <section
      ref={ref}
      className="px-6 md:px-16 lg:px-24 pt-32 md:pt-40 pb-14 max-w-7xl mx-auto pj-reveal"
    >
      <div className="grid grid-cols-12 gap-8 items-end">
        <div className="col-span-12 md:col-span-4 lg:col-span-3">
          <span
            className="font-serif italic text-[#f0e8dc]/85 block leading-[0.85]"
            style={{
              fontSize: 'clamp(120px, 18vw, 240px)',
              letterSpacing: '-0.06em',
              fontVariationSettings: "'opsz' 144, 'SOFT' 50, 'WONK' 1",
            }}
          >
            {chapter.num}.
          </span>
        </div>
        <div className="col-span-12 md:col-span-8 lg:col-span-9 md:pl-4">
          <div className="font-mono text-[10px] tracking-[0.5em] text-[#f0e8dc]/45 mb-4">
            {chapter.en} · {chapter.ids.length} {chapter.ids.length > 1 ? 'WORKS' : 'WORK'}
          </div>
          <h2
            className="font-zhSerif text-[#f0e8dc]/95 mb-5"
            style={{
              fontSize: 'clamp(28px, 3.4vw, 44px)',
              letterSpacing: '0.32em',
            }}
          >
            {chapter.zh}
          </h2>
          <p
            className="font-serif italic text-[#f0e8dc]/55 max-w-xl"
            style={{
              fontSize: 'clamp(15px, 1.3vw, 19px)',
              lineHeight: 1.55,
              fontVariationSettings: "'opsz' 96, 'SOFT' 50",
            }}
          >
            {chapter.rationale}
          </p>
        </div>
      </div>
      <div
        className="mt-14 h-px w-full"
        style={{
          background:
            'linear-gradient(90deg, rgba(240,232,220,0.32) 0%, rgba(240,232,220,0.10) 30%, transparent 100%)',
        }}
      />
    </section>
  );
}

/* ===========================================================================
   PROJECT SPREAD — alternating asymmetric 2-col layout.
=========================================================================== */

function ProjectSpread({
  data,
  side,
}: {
  data: ProjectData;
  side: 'left' | 'right';
}) {
  const ref = useReveal();
  const visualLeft = side === 'left';

  return (
    <article
      ref={ref}
      className="px-6 md:px-16 lg:px-24 py-16 md:py-24 max-w-7xl mx-auto pj-reveal"
    >
      <div className="grid grid-cols-12 gap-8 md:gap-12 items-center">
        {/* VISUAL */}
        <div
          className={`col-span-12 ${
            visualLeft
              ? 'md:col-span-7 md:order-1'
              : 'md:col-span-7 md:order-2'
          }`}
        >
          {data.frame === 'phone' ? (
            <PhoneChrome hue={data.hue}>
              <ProjectVisualInner data={data} />
            </PhoneChrome>
          ) : (
            <BrowserChrome url={data.urlLabel} hue={data.hue}>
              <ProjectVisualInner data={data} />
            </BrowserChrome>
          )}
        </div>

        {/* INFO */}
        <div
          className={`col-span-12 ${
            visualLeft
              ? 'md:col-span-5 md:order-2 md:pl-4'
              : 'md:col-span-5 md:order-1 md:pr-4'
          }`}
        >
          {/* index + dot */}
          <div className="flex items-center gap-2 mb-7">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{
                background: ACCENT[data.hue],
                boxShadow: `0 0 6px ${ACCENT[data.hue]}`,
              }}
            />
            <span className="font-mono text-[10px] tracking-[0.45em] text-[#f0e8dc]/55">
              {data.index}
            </span>
          </div>

          <h3
            className="font-serif italic text-[#f0e8dc]/95 leading-[0.95] mb-3"
            style={{
              fontSize: 'clamp(40px, 4.6vw, 68px)',
              letterSpacing: '-0.025em',
              fontVariationSettings: "'opsz' 144, 'SOFT' 50, 'WONK' 1",
            }}
          >
            {data.en}
          </h3>
          <div
            className="font-zhSerif text-[#f0e8dc]/72 mb-3"
            style={{
              fontSize: 'clamp(15px, 1.4vw, 18px)',
              letterSpacing: '0.32em',
            }}
          >
            {data.zh}
          </div>
          <p
            className="font-serif italic text-[#f0e8dc]/55 mb-8"
            style={{
              fontSize: 'clamp(13.5px, 1.05vw, 16px)',
              letterSpacing: '0.005em',
              lineHeight: 1.55,
              maxWidth: '36ch',
              fontVariationSettings: "'opsz' 96, 'SOFT' 50",
            }}
          >
            {data.tagline}
          </p>

          <p className="font-zhSerif text-[14.5px] md:text-[15.5px] text-[#f0e8dc]/82 leading-[1.95] tracking-[0.03em]">
            {data.body}
          </p>
          {data.tech && (
            <p className="mt-4 font-zhSerif text-[13px] md:text-[14px] text-[#f0e8dc]/48 leading-[1.85] tracking-[0.03em]">
              {data.tech}
            </p>
          )}

          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-7 font-mono text-[12px] tracking-[0.18em]"
            style={{
              color: ACCENT[data.hue],
              transition: 'opacity 240ms ease',
            }}
          >
            <span>OPEN</span>
            <span aria-hidden style={{ opacity: 0.7 }}>↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}

function ProjectVisualInner({ data }: { data: ProjectData }) {
  if (data.visual.kind === 'image') {
    return (
      <img
        src={data.visual.src}
        alt=""
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
  return <>{data.visual.render()}</>;
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

function PhoneChrome({
  hue,
  children,
}: {
  hue: Accent;
  children: ReactNode;
}) {
  return (
    <div className="flex justify-center">
      <div
        className="relative"
        style={{
          width: 'min(280px, 78%)',
          aspectRatio: '9 / 19.5',
          borderRadius: 38,
          padding: 8,
          background: 'linear-gradient(140deg, #1c1628, #07050d)',
          border: '1px solid rgba(240,232,220,0.08)',
          boxShadow:
            '0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.5), ' +
            `0 0 80px ${accentSoft(hue, 0.14)}`,
          animation: 'pj_drift 9s ease-in-out infinite',
        }}
      >
        {/* metal-edge inner band */}
        <div
          className="absolute inset-1.5 pointer-events-none"
          style={{
            borderRadius: 32,
            border: '1px solid rgba(240,232,220,0.05)',
          }}
        />
        {/* screen */}
        <div
          className="relative w-full h-full overflow-hidden"
          style={{ borderRadius: 30, background: '#000' }}
        >
          {/* dynamic-island-ish notch */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-1.5 z-10 rounded-full pointer-events-none"
            style={{
              width: '32%',
              height: 18,
              background: '#000',
            }}
          />
          {children}
        </div>
        {/* side button hint */}
        <div
          className="absolute -right-[2px] top-[28%] w-[2px] h-12 rounded-l"
          style={{ background: 'rgba(240,232,220,0.10)' }}
        />
      </div>
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

/* ===========================================================================
   FOOTER
=========================================================================== */

function Foot() {
  const time = useBeijingTime();
  return (
    <footer className="px-6 md:px-16 lg:px-24 pt-24 pb-16 max-w-7xl mx-auto">
      <div
        className="h-px w-full mb-10"
        style={{
          background:
            'linear-gradient(90deg, rgba(240,232,220,0.18), transparent)',
        }}
      />
      <div className="flex items-baseline justify-between font-mono text-[10px] tracking-[0.45em] text-[#f0e8dc]/40">
        <span>END · OF · LINE</span>
        <span className="tabular-nums text-[#f0e8dc]/55">{time}</span>
      </div>
    </footer>
  );
}

/* ===========================================================================
   Helpers
=========================================================================== */

function useReveal() {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add('pj-in');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref as React.MutableRefObject<HTMLElement | null>;
}

function useBeijingTime() {
  const [t, setT] = useState('--:--:--');
  useEffect(() => {
    const tick = () => {
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Shanghai',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setT(fmt.format(new Date()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}
