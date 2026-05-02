import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Portfolio: 7 works across 3 chapters (MYSTIC / TOYS / FRAGMENTS).
 * Each card carries its own atmosphere — the visual element on the
 * right is a tiny "signature" of that project's mood. Style stays
 * locked to the V2 home (cream-on-aubergine, gradient HUD, mono
 * tracking, dotted rings).
 */
export default function Projects() {
  const time = useBeijingTime();

  return (
    <div className="fixed inset-0 bg-[#1a1525] text-[#f0e8dc] overflow-y-auto overflow-x-hidden">
      {/* page-wide vignette so center reads as the focus */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      {/* faint moving gradient wash */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 18% 0%, rgba(255,120,200,0.10), transparent 60%),' +
            'radial-gradient(ellipse 70% 60% at 82% 100%, rgba(120,180,255,0.10), transparent 60%)',
        }}
      />

      {/* ── HUD: top-left brand (desktop only — mobile gets inline back link) ─ */}
      <div className="fixed top-6 left-7 z-30 pointer-events-none hidden md:block">
        <div
          className="font-mono font-light text-[#f0e8dc]"
          style={{ fontSize: 26, letterSpacing: '0.18em' }}
        >
          JESSY
        </div>
        <div className="mt-1 font-mono text-[10px] tracking-[0.4em] text-[#f0e8dc]/55">
          PORTFOLIO
        </div>
        <div
          className="mt-2 h-px w-10"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,120,200,0.7), rgba(120,160,255,0.4) 60%, transparent)',
          }}
        />
      </div>

      {/* ── HUD: top-right time + status ─────────────────── */}
      <div className="fixed top-6 right-7 z-30 text-right pointer-events-none font-mono text-[10px] tracking-[0.30em] text-[#f0e8dc]/65 hidden md:block">
        <div className="flex items-center justify-end gap-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              background: '#ff6cb6',
              boxShadow: '0 0 8px 1px #ff6cb6',
              animation: 'pj_pulse 1.6s ease-in-out infinite',
            }}
          />
          <span className="text-[#f0e8dc]/85">{time}</span>
          <span className="text-[#f0e8dc]/40">SHA-03</span>
          <span className="text-[#7ab8ff]">7 WORKS</span>
        </div>
      </div>

      {/* ── back link, lower-left (desktop only) ─────────── */}
      <Link
        to="/"
        className="fixed bottom-7 left-7 z-30 font-mono text-[10px] tracking-[0.32em] uppercase text-[#f0e8dc]/45 hover:text-[#7ab8ff] transition-colors hidden md:inline-block"
      >
        ← BACK TO JESSY
      </Link>

      {/* main column */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-12 md:pt-28 pb-20 md:pb-32">
        {/* ── inline back link (mobile only) ─────────────── */}
        <Link
          to="/"
          className="md:hidden inline-block font-mono text-[10px] tracking-[0.32em] uppercase text-[#f0e8dc]/55 hover:text-[#7ab8ff] mb-8"
        >
          ← BACK TO JESSY
        </Link>

        {/* ── title block ───────────────────────────────── */}
        <div className="mb-16 md:mb-28">
          <div className="font-mono text-[10px] tracking-[0.45em] text-[#f0e8dc]/45 mb-4">
            PORTFOLIO · 作品集 · 2025
          </div>
          <h1
            className="font-serif italic text-[#f0e8dc]/95 mb-4 leading-[0.95]"
            style={{ fontSize: 'clamp(56px, 9vw, 120px)', letterSpacing: '-0.03em' }}
          >
            Things I've made
          </h1>
          <p className="font-zhSerif text-[15px] md:text-[17px] text-[#f0e8dc]/55 max-w-xl leading-[1.85] tracking-[0.04em]">
            一个写命的工程师，把一些很私人的念头做成了能被看见的工程。
            玄学、玩具、还有一些只为审美而存在的碎片。
          </p>
          <div
            className="mt-8 h-px w-32"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,140,220,0.6), rgba(160,140,255,0.5) 50%, rgba(120,180,255,0.6))',
            }}
          />
        </div>

        {/* ── 01 · MYSTIC ─────────────────────────────── */}
        <Section index="01" kicker="MYSTIC" subtitle="玄学三件套" hue="rose">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <AuraMateCard />
            <FateCouncilCard />
            <MangPaiCard />
          </div>
        </Section>

        {/* ── 02 · TOYS ───────────────────────────────── */}
        <Section index="02" kicker="TOYS" subtitle="周末的发泄" hue="amber">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <KillBossCard />
            <WhackAClaudeCard />
          </div>
        </Section>

        {/* ── 03 · FRAGMENTS ──────────────────────────── */}
        <Section index="03" kicker="FRAGMENTS" subtitle="只为审美" hue="sky">
          <div className="grid grid-cols-1 gap-5">
            <TearsInRainCard />
            <RainScriptsCard />
          </div>
        </Section>

        {/* ── footer / FIN stamp ──────────────────────── */}
        <footer className="mt-28 md:mt-32 flex items-center gap-4 text-[#f0e8dc]/30 font-mono text-[10px] tracking-[0.45em]">
          <span>FIN</span>
          <span
            className="flex-1 h-px"
            style={{
              background:
                'linear-gradient(90deg, rgba(240,232,220,0.18), transparent)',
            }}
          />
          <span>END · OF · LINE</span>
        </footer>
      </main>

      <style>{`
        @keyframes pj_pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
        @keyframes pj_fadeup {
          0%   { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ───────────────────────── HUD helpers ────────────────────────── */

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

/** Reveals child once it scrolls into view. Pure IO + CSS keyframe. */
function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, shown };
}

/* ───────────────────────── Section header ─────────────────────── */

const SECTION_HUES: Record<string, string> = {
  rose: 'rgba(255,140,220,0.7)',
  amber: 'rgba(255,200,120,0.7)',
  sky: 'rgba(140,200,255,0.7)',
};

function Section({
  index,
  kicker,
  subtitle,
  hue,
  children,
}: {
  index: string;
  kicker: string;
  subtitle: string;
  hue: 'rose' | 'amber' | 'sky';
  children: React.ReactNode;
}) {
  const { ref, shown } = useReveal<HTMLElement>();
  const color = SECTION_HUES[hue];
  return (
    <section
      ref={ref}
      className="mb-16 md:mb-24"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 700ms ease-out, transform 700ms ease-out',
      }}
    >
      <header className="mb-8 md:mb-10 flex items-end gap-4">
        <span
          className="font-mono text-[11px] tracking-[0.4em]"
          style={{ color }}
        >
          {index}
        </span>
        <div
          className="h-px flex-1 max-w-[60px]"
          style={{
            background: `linear-gradient(90deg, ${color}, transparent)`,
          }}
        />
        <span className="font-mono text-[11px] md:text-[12px] tracking-[0.4em] text-[#f0e8dc]/85">
          {kicker}
        </span>
        <span className="font-zhSerif text-[12px] md:text-[13px] tracking-[0.25em] text-[#f0e8dc]/40">
          · {subtitle}
        </span>
      </header>
      {children}
    </section>
  );
}

/* ───────────────────────── 01 · AuraMate ──────────────────────── */
// Hero — purple-magenta orb, soft pulse, full row.
function AuraMateCard() {
  return (
    <Card
      href="https://auramate.net"
      colSpan="md:col-span-2"
      borderIdle="rgba(160,117,255,0.25)"
      borderHover="rgba(255,128,200,0.55)"
      bg={
        'radial-gradient(ellipse 60% 80% at 30% 50%, rgba(180,100,255,0.22), transparent 65%),' +
        'radial-gradient(ellipse 50% 70% at 80% 60%, rgba(255,90,165,0.18), transparent 60%),' +
        'rgba(15, 8, 28, 0.85)'
      }
      minH="min-h-[280px]"
      padded="p-7 md:p-10"
    >
      {/* glowing orb */}
      <div
        className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 md:w-44 md:h-44 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, rgba(255,180,230,0.85) 0%, rgba(180,100,255,0.6) 30%, rgba(80,40,140,0.4) 60%, transparent 80%)',
          filter: 'blur(0.5px)',
          animation: 'auramate_breathe 5s ease-in-out infinite',
        }}
      />
      <Body
        index="P-001"
        indexColor="#ff9de0"
        name="AuraMate"
        zh="灵伴"
        big
        body="全球第一个玄学 Agent。把东方命理从一次性分析工具，重构成一个可以长期相处的灵体——懂八字、紫微、塔罗、占星、风水。"
        url="auramate.net"
        urlIdle="rgba(160,117,255,0.85)"
        urlHover="#ff80c8"
      />
      <style>{`
        @keyframes auramate_breathe {
          0%, 100% { transform: translateY(-50%) scale(1); opacity: 0.85; }
          50%      { transform: translateY(-50%) scale(1.06); opacity: 1; }
        }
      `}</style>
    </Card>
  );
}

/* ───────────────────────── 01 · FateCouncil ───────────────────── */
function FateCouncilCard() {
  const SEATS = 6;
  return (
    <Card
      href="https://fatecouncil.auramate.net"
      borderIdle="rgba(240,232,220,0.15)"
      borderHover="rgba(128,180,255,0.55)"
      bg="linear-gradient(160deg, rgba(20,12,40,0.7), rgba(8,4,20,0.85))"
      minH="min-h-[260px]"
      padded="p-6 md:p-7"
    >
      {/* circle of debating agents */}
      <div className="absolute right-6 top-6 w-24 h-24 md:w-28 md:h-28 pointer-events-none">
        {Array.from({ length: SEATS }).map((_, i) => {
          const angle = (i / SEATS) * Math.PI * 2;
          const r = 40;
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          return (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
                background:
                  i % 2 === 0
                    ? 'rgba(180,210,255,0.95)'
                    : 'rgba(255,150,220,0.85)',
                boxShadow: '0 0 8px rgba(160,180,255,0.6)',
                animation: `fate_seat ${2.4 + i * 0.5}s ease-in-out infinite`,
              }}
            />
          );
        })}
        <div
          className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full"
          style={{
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            boxShadow: '0 0 12px rgba(255,255,255,0.8)',
          }}
        />
        <svg viewBox="0 0 100 100" className="absolute inset-0">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(160,180,255,0.25)"
            strokeWidth="0.4"
            strokeDasharray="0 1.2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <Body
        index="P-002"
        indexColor="#a8c8ff"
        name="FateCouncil"
        zh="命理研讨会"
        bodyMaxW="max-w-[60%]"
        body="多智能体围坐一桌，几个流派为同一张命盘辩论。每个 agent 都有自己的偏见。"
        url="fatecouncil.auramate.net"
        urlIdle="rgba(128,180,255,0.85)"
        urlHover="#80b4ff"
      />
      <style>{`
        @keyframes fate_seat {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 1;   transform: translate(-50%, -50%) scale(1.4); }
        }
      `}</style>
    </Card>
  );
}

/* ───────────────────────── 01 · MangPai ───────────────────────── */
function MangPaiCard() {
  return (
    <Card
      href="https://mangpai.auramate.net"
      borderIdle="rgba(240,232,220,0.12)"
      borderHover="rgba(255,245,216,0.45)"
      bg="linear-gradient(180deg, rgba(8,6,18,0.95), rgba(3,2,10,1))"
      minH="min-h-[260px]"
      padded="p-6 md:p-7"
    >
      <div className="absolute right-10 top-10 pointer-events-none">
        <div
          className="w-3 h-3 rounded-full"
          style={{
            background: 'rgba(255,240,200,0.95)',
            boxShadow:
              '0 0 20px 4px rgba(255,220,150,0.55), 0 0 50px 12px rgba(255,200,120,0.18)',
            animation: 'mangpai_blink 4s ease-in-out infinite',
          }}
        />
      </div>
      <Body
        index="P-003"
        indexColor="rgba(255,245,216,0.7)"
        name="MangPai"
        zh="盲派"
        bodyMaxW="max-w-[70%]"
        body="只用一个流派说话。不是工具，是个有口音的人。盲派看命，习惯把命主当成一个故事的主角，而不是一张图。"
        url="mangpai.auramate.net"
        urlIdle="rgba(255,245,216,0.7)"
        urlHover="#fff5d8"
      />
      <style>{`
        @keyframes mangpai_blink {
          0%, 100% { opacity: 0.85; }
          45%      { opacity: 0.4; }
          50%      { opacity: 1; }
          55%      { opacity: 0.5; }
        }
      `}</style>
    </Card>
  );
}

/* ───────────────────────── 02 · KillBoss ──────────────────────── */
// Aggressive crimson gradient + a single jittering target reticule.
function KillBossCard() {
  return (
    <Card
      href="https://killboss.bestwishes7319.workers.dev/"
      borderIdle="rgba(255,90,90,0.22)"
      borderHover="rgba(255,140,90,0.6)"
      bg={
        'radial-gradient(ellipse 70% 90% at 85% 30%, rgba(220,60,60,0.22), transparent 60%),' +
        'linear-gradient(160deg, rgba(40,12,18,0.9), rgba(14,4,8,0.95))'
      }
      minH="min-h-[260px]"
      padded="p-6 md:p-7"
    >
      {/* target reticule */}
      <div
        className="absolute right-6 top-6 w-24 h-24 md:w-28 md:h-28 pointer-events-none"
        style={{ animation: 'kb_jitter 0.45s steps(2) infinite' }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0">
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(255,140,120,0.55)"
            strokeWidth="0.6"
            strokeDasharray="2 3"
          />
          <circle
            cx="50"
            cy="50"
            r="32"
            fill="none"
            stroke="rgba(255,160,120,0.65)"
            strokeWidth="0.5"
          />
          <circle
            cx="50"
            cy="50"
            r="6"
            fill="rgba(255,90,90,0.95)"
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,90,90,0.7))' }}
          />
          <line
            x1="50"
            y1="0"
            x2="50"
            y2="20"
            stroke="rgba(255,140,120,0.7)"
            strokeWidth="0.5"
          />
          <line
            x1="50"
            y1="80"
            x2="50"
            y2="100"
            stroke="rgba(255,140,120,0.7)"
            strokeWidth="0.5"
          />
          <line
            x1="0"
            y1="50"
            x2="20"
            y2="50"
            stroke="rgba(255,140,120,0.7)"
            strokeWidth="0.5"
          />
          <line
            x1="80"
            y1="50"
            x2="100"
            y2="50"
            stroke="rgba(255,140,120,0.7)"
            strokeWidth="0.5"
          />
        </svg>
      </div>
      <Body
        index="P-004"
        indexColor="rgba(255,160,120,0.85)"
        name="Kill Boss"
        zh="爆锤老板"
        bodyMaxW="max-w-[68%]"
        body="上班的人都需要一点不讲道理的发泄出口。一个写在周末下午的小玩具，不解决任何问题，但能让你出一口气。"
        url="killboss.bestwishes7319.workers.dev"
        urlIdle="rgba(255,160,120,0.85)"
        urlHover="#ffb070"
      />
      <style>{`
        @keyframes kb_jitter {
          0%   { transform: translate(0, 0); }
          50%  { transform: translate(-1px, 1px); }
          100% { transform: translate(1px, -1px); }
        }
      `}</style>
    </Card>
  );
}

/* ───────────────────────── 02 · Whack-a-Claude ────────────────── */
// Pixel-grid of "moles" — three pop up at staggered timing.
function WhackAClaudeCard() {
  const ROWS = 3;
  const COLS = 4;
  const popIndices = [2, 5, 9]; // which cells "pop up"
  return (
    <Card
      href="https://github.com/ChenJiangxi/whack-a-claude"
      borderIdle="rgba(120,200,255,0.18)"
      borderHover="rgba(140,220,255,0.55)"
      bg={
        'linear-gradient(160deg, rgba(10,18,32,0.92), rgba(4,10,22,0.96))'
      }
      minH="min-h-[260px]"
      padded="p-6 md:p-7"
    >
      {/* CRT scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(180deg, rgba(180,220,255,0.6) 0px, rgba(180,220,255,0.6) 1px, transparent 1px, transparent 3px)',
        }}
      />
      {/* pixel mole grid */}
      <div
        className="absolute right-6 top-6 grid pointer-events-none"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 14px)`,
          gridTemplateRows: `repeat(${ROWS}, 14px)`,
          gap: 4,
        }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, i) => {
          const isMole = popIndices.includes(i);
          return (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                background: isMole
                  ? 'rgba(140,220,255,0.95)'
                  : 'rgba(140,220,255,0.10)',
                border: '1px solid rgba(140,220,255,0.25)',
                boxShadow: isMole
                  ? '0 0 12px rgba(140,220,255,0.7)'
                  : 'none',
                animation: isMole
                  ? `wac_pop ${1.6 + (i % 3) * 0.4}s steps(2) infinite ${i * 0.18}s`
                  : 'none',
              }}
            />
          );
        })}
      </div>
      <Body
        index="P-005"
        indexColor="rgba(140,220,255,0.85)"
        name="Whack-a-Claude"
        zh="敲一下 Claude"
        bodyMaxW="max-w-[62%]"
        body="一个像素打地鼠。Claude Code 想得超过 8 秒，它就跳出来。等模型的时间不再难熬——你可以一边出气一边等。"
        url="github.com/ChenJiangxi/whack-a-claude"
        urlIdle="rgba(140,220,255,0.85)"
        urlHover="#9ddfff"
      />
      <style>{`
        @keyframes wac_pop {
          0%, 30%   { opacity: 0.15; transform: translateY(2px) scale(0.9); }
          45%, 75%  { opacity: 1;    transform: translateY(0)   scale(1); }
          90%, 100% { opacity: 0.15; transform: translateY(2px) scale(0.9); }
        }
      `}</style>
    </Card>
  );
}

/* ───────────────────────── 03 · Tears in Rain ─────────────────── */
function TearsInRainCard() {
  return (
    <Card
      href="https://chenjiangxi.github.io/tears-in-rain/"
      borderIdle="rgba(90,122,184,0.25)"
      borderHover="rgba(168,200,255,0.55)"
      bg="linear-gradient(180deg, rgba(8,12,28,0.88), rgba(2,4,14,0.95))"
      minH="min-h-[260px]"
      padded="p-7 md:p-9"
    >
      {/* falling rain streaks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
        {Array.from({ length: 28 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-12 w-px"
            style={{
              left: `${(i * 13 + 7) % 100}%`,
              top: '-50px',
              background:
                'linear-gradient(180deg, transparent, rgba(140,180,220,0.55), transparent)',
              animation: `rain_fall ${2 + (i % 5) * 0.6}s linear infinite ${i * 0.18}s`,
            }}
          />
        ))}
      </div>
      <div className="relative max-w-2xl">
        <div className="font-mono text-[10px] tracking-[0.45em] text-[#a8c8ff]/80 mb-3">
          P-006
        </div>
        <h2
          className="font-serif italic text-3xl md:text-4xl text-[#f0e8dc] mb-3"
          style={{ letterSpacing: '0.01em' }}
        >
          Tears in Rain
        </h2>
        <p className="font-serif italic text-[15px] text-[#a8c8ff]/85 leading-[1.7] mb-2">
          "I&rsquo;ve seen things you people wouldn&rsquo;t believe..."
        </p>
        <p className="font-zhSerif text-[13px] md:text-[14px] text-[#f0e8dc]/75 leading-[1.85] mb-4 tracking-[0.03em]">
          一扇永远在下雨的起雾窗户。一台没有记忆的打字机。王家卫的《花样年华》＋ 银翼杀手 Roy Batty 最后那段独白，做成一个网站。
        </p>
        <div className="font-mono text-[10px] tracking-[0.15em] text-[#a8c8ff]/80 group-hover:text-[#a8c8ff] flex items-center gap-2">
          chenjiangxi.github.io/tears-in-rain <span>→</span>
        </div>
      </div>
      <style>{`
        @keyframes rain_fall {
          0%   { transform: translateY(-20px); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(120vh); opacity: 0; }
        }
      `}</style>
    </Card>
  );
}

/* ───────────────────────── 03 · Rain Scripts ──────────────────── */
// Vertical traditional-Chinese characters falling, right-to-left,
// over a soft rain wash. Distinct from Tears in Rain: text-driven,
// colder, more graphic.
function RainScriptsCard() {
  // Each column = one short "script" line, falling vertically.
  const COLUMNS = [
    { chars: '雨夜念白', delay: 0,   speed: 9 },
    { chars: '燈下無人',  delay: 1.4, speed: 11 },
    { chars: '誰在說話',  delay: 2.8, speed: 10 },
    { chars: '我聽見了',  delay: 4.2, speed: 12 },
    { chars: '雨還在落',  delay: 0.6, speed: 9.5 },
  ];
  return (
    <Card
      href="https://github.com/ChenJiangxi/rain-scripts"
      borderIdle="rgba(180,200,230,0.20)"
      borderHover="rgba(200,220,255,0.55)"
      bg="linear-gradient(180deg, rgba(10,14,24,0.92), rgba(4,6,16,0.98))"
      minH="min-h-[280px]"
      padded="p-7 md:p-9"
    >
      {/* faint rain streaks behind */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-10 w-px"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: '-40px',
              background:
                'linear-gradient(180deg, transparent, rgba(160,200,240,0.45), transparent)',
              animation: `rs_drizzle ${2.2 + (i % 4) * 0.5}s linear infinite ${i * 0.21}s`,
            }}
          />
        ))}
      </div>
      {/* vertical character columns — right side, falling. Narrower on
          mobile so it doesn't crowd the body text. */}
      <div className="absolute inset-y-0 right-0 w-[32%] md:w-[36%] pointer-events-none overflow-hidden">
        {COLUMNS.map((col, i) => (
          <div
            key={i}
            className="absolute top-0 font-zhSerif text-[13px] md:text-[15px]"
            style={{
              right: `${i * 17 + 6}%`,
              writingMode: 'vertical-rl',
              color: 'rgba(200,220,255,0.75)',
              letterSpacing: '0.4em',
              textShadow: '0 0 8px rgba(160,200,240,0.35)',
              animation: `rs_descend ${col.speed}s linear infinite ${col.delay}s`,
            }}
          >
            {col.chars}
          </div>
        ))}
      </div>
      <div className="relative max-w-[64%] md:max-w-[60%]">
        <div className="font-mono text-[10px] tracking-[0.45em] text-[#c8dcff]/80 mb-3">
          P-007
        </div>
        <h2
          className="font-serif italic text-3xl md:text-4xl text-[#f0e8dc] mb-3"
          style={{ letterSpacing: '0.01em' }}
        >
          Rain Scripts
        </h2>
        <p className="font-zhSerif text-[15px] text-[#c8dcff]/85 leading-[1.8] mb-2 tracking-[0.05em]">
          一個「雨夜 · 念白」的合集站。
        </p>
        <p className="font-zhSerif text-[13px] md:text-[14px] text-[#f0e8dc]/70 leading-[1.85] mb-4 tracking-[0.03em]">
          每个剧本是一段内心独白，配一种雨景 shader。字隨語音一個一個、繁體竖排、從右到左，慢慢打在落雨的窗上。像把电影的某一帧抽出来，让它一直停在那里。
        </p>
        <div className="font-mono text-[10px] tracking-[0.15em] text-[#c8dcff]/80 group-hover:text-[#c8dcff] flex items-center gap-2">
          github.com/ChenJiangxi/rain-scripts <span>→</span>
        </div>
      </div>
      <style>{`
        @keyframes rs_drizzle {
          0%   { transform: translateY(-20px); opacity: 0; }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(120%); opacity: 0; }
        }
        @keyframes rs_descend {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 0.9; }
          90%  { opacity: 0.9; }
          100% { transform: translateY(120%); opacity: 0; }
        }
      `}</style>
    </Card>
  );
}

/* ───────────────────────── shared atoms ───────────────────────── */

function Card({
  href,
  colSpan = '',
  borderIdle,
  borderHover,
  bg,
  minH,
  padded,
  children,
}: {
  href: string;
  colSpan?: string;
  borderIdle: string;
  borderHover: string;
  bg: string;
  minH: string;
  padded: string;
  children: React.ReactNode;
}) {
  const { ref, shown } = useReveal<HTMLAnchorElement>();
  return (
    <a
      ref={ref}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative ${colSpan} rounded-2xl overflow-hidden transition-all duration-500 ${padded} ${minH} hover:-translate-y-0.5`}
      style={{
        border: `1px solid ${borderIdle}`,
        background: bg,
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(24px)',
        transition:
          'opacity 700ms ease-out, transform 700ms ease-out, border-color 350ms ease, box-shadow 350ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = borderHover;
        e.currentTarget.style.boxShadow = `0 18px 48px -24px ${borderHover}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderIdle;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {children}
    </a>
  );
}

function Body({
  index,
  indexColor,
  name,
  zh,
  big = false,
  body,
  bodyMaxW = 'max-w-md',
  url,
  urlIdle,
  urlHover,
}: {
  index: string;
  indexColor: string;
  name: string;
  zh: string;
  big?: boolean;
  body: string;
  bodyMaxW?: string;
  url: string;
  urlIdle: string;
  urlHover: string;
}) {
  return (
    <div className={`relative ${bodyMaxW}`}>
      <div
        className="font-mono text-[10px] tracking-[0.45em] mb-3"
        style={{ color: indexColor }}
      >
        {index}
      </div>
      <h2
        className={`font-serif italic text-[#f0e8dc] mb-1 ${
          big ? 'text-4xl md:text-5xl' : 'text-2xl md:text-3xl'
        }`}
      >
        {name}
      </h2>
      <div
        className={`font-zhSerif text-[#f0e8dc]/70 tracking-[0.3em] ${
          big ? 'text-lg md:text-xl mb-5' : 'text-sm mb-4'
        }`}
      >
        {zh}
      </div>
      <p
        className={`font-zhSerif text-[#f0e8dc]/85 leading-[1.85] tracking-[0.03em] ${
          big ? 'text-[14px] md:text-[15px] mb-5' : 'text-[13px] mb-4'
        }`}
      >
        {body}
      </p>
      <div
        className="font-mono text-[11px] tracking-[0.15em] flex items-center gap-2 transition-colors"
        style={{ color: urlIdle }}
        onMouseEnter={(e) => (e.currentTarget.style.color = urlHover)}
        onMouseLeave={(e) => (e.currentTarget.style.color = urlIdle)}
      >
        {url}
        <span>→</span>
      </div>
    </div>
  );
}
