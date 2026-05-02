import { useMemo } from 'react';

/**
 * Refined ambient backdrop — "laboratory bezel" aesthetic.
 *
 * Design intent: every element is intentional but barely visible. The
 * page rewards looking closely and never fights the figure for attention.
 *
 * Six layers, back-to-front:
 *   1. Off-screen ambient washes — soft purple from the LEFT edge
 *      (dominant), soft blue from the RIGHT edge (secondary, smaller,
 *      vertically offset). Asymmetric on purpose, never mirrored.
 *   2. Dense hairline grids in the side edge bands — extremely faint
 *      (alpha 0.035-0.05), CSS-masked to vanish before reaching the
 *      central figure / chat column.
 *   3. Sparse 45° "fold" feature lines at the side edges — 7 left, 5
 *      right (asymmetric weight). 0.5 CSS px hairlines.
 *   4. Single vertical edge guides + uneven tick marks — suggests an
 *      instrumented bezel without being a literal frame.
 *   5. ~70 sub-pixel star pinpricks scattered outside the figure region.
 *   6. Soft figure vignette to lift her off the surrounding texture.
 */

/** Deterministic PRNG so star positions stay stable across renders. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Star = { x: number; y: number; r: number; opacity: number; tint: string };

export default function AmbientBackdrop() {
  const stars = useMemo<Star[]>(() => {
    const rand = mulberry32(11);
    const list: Star[] = [];
    let attempts = 0;
    while (list.length < 70 && attempts < 500) {
      attempts++;
      const x = rand() * 100;
      const y = rand() * 100;
      // Skip stars in the central figure region (avatar at ~50% x, 32% y).
      const dx = (x - 50) / 17;
      const dy = (y - 32) / 22;
      if (dx * dx + dy * dy < 1) continue;
      const size = rand();
      // True pinpricks. viewBox 100 wide → ~19px per unit on a 1920
      // screen, so r=0.04 ≈ 0.75px diameter (sub-pixel).
      const r = size < 0.92 ? 0.025 + size * 0.05 : 0.08 + size * 0.06;
      const opacity = 0.12 + rand() * 0.34;
      const tintRoll = rand();
      const tint =
        tintRoll < 0.65
          ? 'rgba(244,236,220,1)'
          : tintRoll < 0.86
            ? 'rgba(200,165,255,1)'
            : 'rgba(126,197,255,1)';
      list.push({ x, y, r, opacity, tint });
    }
    return list;
  }, []);

  // Tick mark positions on the side guides — intentionally uneven so
  // they read as instrumented (specific Y indices) rather than regular.
  // Kept inside the y=35-65 band where the light source / fold lines live.
  const leftTicks = [38, 50, 62];
  const rightTicks = [42, 58];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* layer 1a — left ambient wash (purple, dominant) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: '-22%',
          top: '8%',
          width: '54%',
          height: '88%',
          background:
            'radial-gradient(ellipse 55% 65% at 32% 52%, rgba(155,90,215,0.32), rgba(95,55,160,0.10) 45%, transparent 78%)',
          filter: 'blur(70px)',
          animation: 'amb_a 18s ease-in-out infinite',
          willChange: 'transform, opacity',
        }}
      />

      {/* layer 1b — right ambient wash (blue, secondary, smaller, offset
          downward by 12% for asymmetric balance) */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: '-20%',
          top: '20%',
          width: '46%',
          height: '78%',
          background:
            'radial-gradient(ellipse 55% 65% at 68% 48%, rgba(80,140,220,0.24), rgba(50,90,170,0.07) 45%, transparent 78%)',
          filter: 'blur(70px)',
          animation: 'amb_b 22s ease-in-out infinite',
          willChange: 'transform, opacity',
        }}
      />

      {/* layer 2a — dense hairline grid on LEFT edge, faded out by 28% */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(200,165,255,0.032) 0 1px, transparent 1px 18px),
            repeating-linear-gradient(90deg, rgba(200,165,255,0.026) 0 1px, transparent 1px 18px)
          `,
          maskImage:
            'linear-gradient(90deg, black 0%, black 10%, transparent 28%)',
          WebkitMaskImage:
            'linear-gradient(90deg, black 0%, black 10%, transparent 28%)',
        }}
      />

      {/* layer 2b — dense hairline grid on RIGHT edge, faded in from 72% */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(126,197,255,0.026) 0 1px, transparent 1px 22px),
            repeating-linear-gradient(90deg, rgba(126,197,255,0.022) 0 1px, transparent 1px 22px)
          `,
          maskImage:
            'linear-gradient(90deg, transparent 72%, black 90%, black 100%)',
          WebkitMaskImage:
            'linear-gradient(90deg, transparent 72%, black 90%, black 100%)',
        }}
      />

      {/* layers 3 & 4 — fold lines + edge guides + sparse marks (one SVG) */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* LEFT — 5 stepped fold lines, all clustered in y=40-60 around
            the light source center. Trimmed horizontally to x≤22 so they
            never approach the figure column. */}
        <g
          stroke="rgba(180,140,225,0.13)"
          strokeWidth="0.5"
          fill="none"
          strokeLinejoin="miter"
        >
          <path vectorEffect="non-scaling-stroke" d="M 0 40 L 8 40 L 14 46 L 22 46" />
          <path vectorEffect="non-scaling-stroke" d="M 0 45 L 6 45 L 12 50 L 20 50" />
          <path vectorEffect="non-scaling-stroke" d="M 0 50 L 22 50" />
          <path vectorEffect="non-scaling-stroke" d="M 0 55 L 6 55 L 12 50 L 20 50" />
          <path vectorEffect="non-scaling-stroke" d="M 0 60 L 8 60 L 14 54 L 22 54" />
        </g>

        {/* LEFT vertical edge guide — short, only spans the light band */}
        <line
          vectorEffect="non-scaling-stroke"
          x1="3" y1="34" x2="3" y2="66"
          stroke="rgba(200,165,255,0.10)" strokeWidth="0.5"
        />
        {leftTicks.map((y, i) => (
          <line
            key={i}
            vectorEffect="non-scaling-stroke"
            x1="3" y1={y} x2="5" y2={y}
            stroke="rgba(200,165,255,0.25)" strokeWidth="0.5"
          />
        ))}

        {/* RIGHT — 4 stepped fold lines, mirrored, clustered in y=42-58 */}
        <g
          stroke="rgba(126,180,225,0.13)"
          strokeWidth="0.5"
          fill="none"
          strokeLinejoin="miter"
        >
          <path vectorEffect="non-scaling-stroke" d="M 100 42 L 92 42 L 86 48 L 78 48" />
          <path vectorEffect="non-scaling-stroke" d="M 100 50 L 78 50" />
          <path vectorEffect="non-scaling-stroke" d="M 100 55 L 94 55 L 88 50 L 80 50" />
          <path vectorEffect="non-scaling-stroke" d="M 100 58 L 92 58 L 86 52 L 78 52" />
        </g>

        {/* RIGHT vertical edge guide — short, light band only */}
        <line
          vectorEffect="non-scaling-stroke"
          x1="97" y1="36" x2="97" y2="64"
          stroke="rgba(126,197,255,0.10)" strokeWidth="0.5"
        />
        {rightTicks.map((y, i) => (
          <line
            key={i}
            vectorEffect="non-scaling-stroke"
            x1="95" y1={y} x2="97" y2={y}
            stroke="rgba(126,197,255,0.25)" strokeWidth="0.5"
          />
        ))}

        {/* sparse "+" registration marks — calibration crosses, very faint */}
        <g stroke="rgba(244,236,220,0.18)" strokeWidth="0.5">
          <line vectorEffect="non-scaling-stroke" x1="9" y1="14" x2="11" y2="14" />
          <line vectorEffect="non-scaling-stroke" x1="10" y1="13" x2="10" y2="15" />
          <line vectorEffect="non-scaling-stroke" x1="89" y1="86" x2="91" y2="86" />
          <line vectorEffect="non-scaling-stroke" x1="90" y1="85" x2="90" y2="87" />
        </g>
      </svg>

      {/* layer 5 — sparse star dust */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.tint} opacity={s.opacity} />
        ))}
      </svg>

      {/* layer 6 — soft figure vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 28% 30% at 50% 30%, rgba(6,3,15,0.30), transparent 72%)',
        }}
      />

      <style>{`
        @keyframes amb_a {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 1; }
          50%      { transform: scale(1.06) translate(1%, -1%); opacity: 0.82; }
        }
        @keyframes amb_b {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.85; }
          50%      { transform: scale(1.05) translate(-1%, 1%); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
