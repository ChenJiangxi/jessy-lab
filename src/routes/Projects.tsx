import { Link } from 'react-router-dom';

/**
 * Hand-tuned card for each project — each one has its own atmosphere
 * matching the project's mood, instead of a generic list.
 */
export default function Projects() {
  return (
    <div className="fixed inset-0 bg-[#04020c] text-[#f0e8dc] overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16">
        <Link
          to="/"
          className="inline-block font-mono text-[10px] tracking-[0.35em] uppercase text-[#7ab8ff]/70 hover:text-[#7ab8ff] mb-10"
        >
          ← BACK TO JESSY
        </Link>

        <div className="font-mono text-[10px] tracking-[0.4em] text-[#f0e8dc]/45 mb-3">
          JESSY · PROJECTS
        </div>
        <h1
          className="font-serif italic text-[#f0e8dc]/90 mb-2"
          style={{ fontSize: 'clamp(48px, 8vw, 96px)', letterSpacing: '-0.02em' }}
        >
          Projects
        </h1>
        <p className="font-mono text-[12px] tracking-[0.15em] text-[#f0e8dc]/45 mb-12">
          一个写命的工程师 //  做了一些「被看见」的工程
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <AuraMateCard />
          <FateCouncilCard />
          <MangPaiCard />
          <TearsInRainCard />
        </div>
      </div>
    </div>
  );
}

// ── AuraMate · 灵伴 ────────────────────────────────────────────
// Hero project — purple-magenta orb, soft pulse, prominent.
function AuraMateCard() {
  return (
    <a
      href="https://auramate.net"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative md:col-span-2 rounded-2xl overflow-hidden border border-[#a075ff]/25 hover:border-[#ff80c8]/55 transition-colors p-7 md:p-10 min-h-[280px]"
      style={{
        background:
          'radial-gradient(ellipse 60% 80% at 30% 50%, rgba(180,100,255,0.22), transparent 65%),' +
          'radial-gradient(ellipse 50% 70% at 80% 60%, rgba(255,90,165,0.18), transparent 60%),' +
          'rgba(15, 8, 28, 0.85)',
      }}
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
      <div className="relative max-w-md">
        <div className="font-mono text-[10px] tracking-[0.45em] text-[#ff9de0] mb-3">
          PROJECT · 001
        </div>
        <h2 className="font-serif italic text-4xl md:text-5xl text-[#f0e8dc] mb-1">
          AuraMate
        </h2>
        <div className="font-zhSerif text-[#f0e8dc]/70 text-lg md:text-xl tracking-[0.3em] mb-5">
          灵伴
        </div>
        <p className="font-sans text-[14px] md:text-[15px] text-[#f0e8dc]/85 leading-[1.7] mb-5">
          全球第一个玄学 Agent。把东方命理从一次性分析工具，重构成一个**可以长期相处的灵体**——懂八字、紫微、塔罗、占星、风水。
        </p>
        <div className="font-mono text-[11px] tracking-[0.15em] text-[#a075ff]/80 group-hover:text-[#ff80c8] transition-colors flex items-center gap-2">
          auramate.net
          <span>→</span>
        </div>
      </div>
      <style>{`
        @keyframes auramate_breathe {
          0%, 100% { transform: translateY(-50%) scale(1); opacity: 0.85; }
          50%      { transform: translateY(-50%) scale(1.06); opacity: 1; }
        }
      `}</style>
    </a>
  );
}

// ── FateCouncil · 命理研讨会 ───────────────────────────────────
// Multiple dots arranged in a circle, suggesting "agents at a table".
function FateCouncilCard() {
  const SEATS = 6;
  return (
    <a
      href="https://fatecouncil.auramate.net"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative rounded-2xl overflow-hidden border border-[#f0e8dc]/15 hover:border-[#80b4ff]/55 transition-colors p-6 md:p-7 min-h-[260px]"
      style={{
        background:
          'linear-gradient(160deg, rgba(20,12,40,0.7), rgba(8,4,20,0.85))',
      }}
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
        {/* center node */}
        <div
          className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full"
          style={{
            transform: 'translate(-50%, -50%)',
            background: '#fff',
            boxShadow: '0 0 12px rgba(255,255,255,0.8)',
          }}
        />
        {/* dotted ring */}
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
      <div className="relative max-w-[60%]">
        <div className="font-mono text-[10px] tracking-[0.45em] text-[#a8c8ff] mb-3">
          PROJECT · 002
        </div>
        <h2 className="font-serif italic text-2xl md:text-3xl text-[#f0e8dc] mb-1">
          FateCouncil
        </h2>
        <div className="font-zhSerif text-[#f0e8dc]/70 text-sm tracking-[0.3em] mb-4">
          命理研讨会
        </div>
        <p className="font-sans text-[13px] text-[#f0e8dc]/80 leading-[1.65] mb-4">
          多智能体围坐一桌，几个流派为同一张命盘**辩论**。每个 agent 都有自己的偏见。
        </p>
        <div className="font-mono text-[10px] tracking-[0.15em] text-[#80b4ff]/80 group-hover:text-[#80b4ff]">
          fatecouncil.auramate.net →
        </div>
      </div>
      <style>{`
        @keyframes fate_seat {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 1;   transform: translate(-50%, -50%) scale(1.4); }
        }
      `}</style>
    </a>
  );
}

// ── MangPai · 盲派 ─────────────────────────────────────────────
// Almost entirely dark — single bright dot on the side.
function MangPaiCard() {
  return (
    <a
      href="https://mangpai.auramate.net"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative rounded-2xl overflow-hidden border border-[#f0e8dc]/12 hover:border-[#fff5d8]/45 transition-colors p-6 md:p-7 min-h-[260px]"
      style={{
        background:
          'linear-gradient(180deg, rgba(8,6,18,0.95), rgba(3,2,10,1))',
      }}
    >
      {/* single bright point of light */}
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
      <div className="relative max-w-[70%]">
        <div className="font-mono text-[10px] tracking-[0.45em] text-[#fff5d8]/70 mb-3">
          PROJECT · 003
        </div>
        <h2 className="font-serif italic text-2xl md:text-3xl text-[#f0e8dc] mb-1">
          MangPai
        </h2>
        <div className="font-zhSerif text-[#f0e8dc]/70 text-sm tracking-[0.3em] mb-4">
          盲派
        </div>
        <p className="font-sans text-[13px] text-[#f0e8dc]/75 leading-[1.65] mb-4">
          只用**一个流派**说话。不是工具，是个有口音的人。盲派看命，习惯把命主当成一个故事的主角，而不是一张图。
        </p>
        <div className="font-mono text-[10px] tracking-[0.15em] text-[#fff5d8]/70 group-hover:text-[#fff5d8]">
          mangpai.auramate.net →
        </div>
      </div>
      <style>{`
        @keyframes mangpai_blink {
          0%, 100% { opacity: 0.85; }
          45%      { opacity: 0.4; }
          50%      { opacity: 1; }
          55%      { opacity: 0.5; }
        }
      `}</style>
    </a>
  );
}

// ── Tears in Rain ──────────────────────────────────────────────
// Falling rain lines, blue-grey, melancholic.
function TearsInRainCard() {
  return (
    <a
      href="https://chenjiangxi.github.io/tears-in-rain"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative md:col-span-2 rounded-2xl overflow-hidden border border-[#5a7ab8]/25 hover:border-[#a8c8ff]/55 transition-colors p-7 md:p-9 min-h-[240px]"
      style={{
        background:
          'linear-gradient(180deg, rgba(8,12,28,0.88), rgba(2,4,14,0.95))',
      }}
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
          PROJECT · 004
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
        <p className="font-sans text-[13px] md:text-[14px] text-[#f0e8dc]/75 leading-[1.7] mb-4">
          一扇永远在下雨的起雾窗户。一台没有记忆的打字机。王家卫的《花样年华》＋ 银翼杀手 Roy Batty 最后那段独白，做成一个网站。
        </p>
        <div className="font-mono text-[10px] tracking-[0.15em] text-[#a8c8ff]/80 group-hover:text-[#a8c8ff]">
          chenjiangxi.github.io/tears-in-rain →
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
    </a>
  );
}
