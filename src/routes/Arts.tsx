import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ============================================================================
   ARTS — a wandering room of 9 flat works, each one alive in its own way.

   Design contract (don't break, even when adding mechanics):
   - Single binding material across the page = the film-leader header strip
     + the dust-grain overlay + the [ HINT ] label at lower-right of every
     frame in the SAME mono / size / opacity. That sameness is what makes
     9 different mechanics read as one page rather than a tech-demo zoo.
   - Captions sit at the lower-left, zhSerif 13-14px, opacity ~0.55. That's
     the work's true name, not a label. Same place on every piece.
   - Off-grid layout: 12-col hidden grid, varying cols + vertical gaps.
     Tilt budget = max 2 pieces, max ±2.5°. Currently used by workshop & curled.
   - Every interaction RESOLVES with the same slow ease-out (~1.5s). Shared
     decay is what binds the disparate mechanics.
   - No HUD chrome (top-right time, status pill) — that's the /v2 + /projects
     "control room" register. Arts is gallery — strip the chrome.
============================================================================ */

type Piece = {
  id: string;
  src: string;
  caption: string;          // 4–8 char Chinese title, lower-left of frame
  meta: string;             // mono micro-strip, like a cine archive stamp
  hint: string;             // mono [ X ] label at lower-right
  /** rough w/h ratio of the source image */
  aspect: number;
  /** layout slot — what column-block this piece occupies */
  slot:
    | 'lg-left'
    | 'md-right'
    | 'md-center'
    | 'lg-right'
    | 'tall-left'
    | 'md-portrait-right'
    | 'md-left'
    | 'sm-right';
  /** degrees, capped to ±2.5°, max 2 pieces tilted on the whole page */
  tilt?: number;
};

const PIECES: Piece[] = [
  {
    id: 'gray-cat',
    src: '/arts/gray-cat.jpg',
    caption: '灰猫与门',
    meta: 'PROCREATE · DIGITAL ON PHOTO · 2022',
    hint: '[ WIPE ]',
    aspect: 4 / 3,
    slot: 'lg-left',
  },
  {
    id: 'pour',
    src: '/arts/pour.jpg',
    caption: '倾倒之粉',
    meta: 'ACRYLIC POUR ON CANVAS · 60×80CM · 2018',
    hint: '[ STIR ]',
    aspect: 4 / 3,
    slot: 'md-right',
    tilt: -1,
  },
  {
    id: 'heart',
    src: '/arts/heart.jpg',
    caption: '心型星云',
    meta: 'PROCREATE · DIGITAL · 2021',
    hint: '[ TAP PLANETS ]',
    aspect: 4 / 3,
    slot: 'md-center',
  },
  {
    id: 'workshop',
    src: '/arts/workshop.jpg',
    caption: '工坊地面',
    meta: 'PHOTOGRAPH · BARCELONA · 2017',
    hint: '[ DRAG ]',
    aspect: 3 / 2,
    slot: 'lg-right',
    tilt: 1.5,
  },
  {
    id: 'decadent',
    src: '/arts/decadent.jpg',
    caption: '衰败的生',
    meta: 'CHARCOAL ON NEWSPRINT · 80×200CM · 2017',
    hint: '[ MOVE ]',
    aspect: 1 / 2.3,
    slot: 'tall-left',
  },
  {
    id: 'picasso',
    src: '/arts/picasso.jpg',
    caption: '致毕加索',
    meta: 'MIXED MEDIA STUDY · AFTER PICASSO · 2017',
    hint: '[ PEEL ]',
    aspect: 3 / 4,
    slot: 'md-portrait-right',
  },
  {
    id: 'fire',
    src: '/arts/fire.jpg',
    caption: '火与烬',
    meta: 'OIL ON CANVAS · 50×60CM · 2018',
    hint: '[ SWIPE ]',
    aspect: 4 / 5,
    slot: 'md-left',
  },
  {
    id: 'curled',
    src: '/arts/curled.jpg',
    caption: '沉睡之蜷',
    meta: 'PROCREATE · DIGITAL ON PHOTO · 2022',
    hint: '[ IDLE ]',
    aspect: 4 / 3,
    slot: 'sm-right',
    tilt: -2,
  },
  {
    id: 'orange-cat',
    src: '/arts/orange-cat.jpg',
    caption: '草坪之橘',
    meta: 'PROCREATE · DIGITAL ON PHOTO · 2022',
    hint: '[ NUZZLE ]',
    aspect: 1 / 1,
    slot: 'md-center',
  },
];

/* -------------------------------------------------------------------------- */

export default function Arts() {
  // entrance — single staged reveal of the page
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-[#15101e] text-[#f0e8dc]">
      {/* dust-grain — page-wide binding material #1 */}
      <DustGrain />
      {/* deep vignette — gallery feel, NOT V2's rose/sky wash */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, transparent 50%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* TOP LEFT — brand continuity */}
      <header
        className="fixed top-6 left-7 z-30 pointer-events-none"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(-6px)',
          transition: 'opacity 900ms ease-out, transform 900ms ease-out',
        }}
      >
        <div
          className="font-mono font-light"
          style={{ fontSize: 22, letterSpacing: '0.18em' }}
        >
          JESSY
        </div>
        <div className="mt-1 font-mono text-[10px] tracking-[0.4em] text-[#f0e8dc]/55">
          ARTS
        </div>
      </header>

      {/* BOTTOM RIGHT — single back link, no other chrome */}
      <Link
        to="/"
        className="fixed bottom-7 right-7 z-30 font-mono text-[10px] tracking-[0.32em] uppercase text-[#f0e8dc]/45 hover:text-[#f0e8dc]"
        style={{ transition: 'color 280ms ease' }}
      >
        BACK ←
      </Link>

      {/* MAIN COLUMN */}
      <main className="relative z-10 max-w-[1320px] mx-auto px-6 md:px-12 pt-24 pb-32">
        {/* PAGE TITLE — small, reverent. Per design guidance: do not big-display this. */}
        <section
          className="mb-20 md:mb-32"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 1200ms ease-out 200ms, transform 1200ms ease-out 200ms',
          }}
        >
          <div className="font-zhSerif text-[12px] tracking-[0.55em] text-[#f0e8dc]/70 mb-3">
            档 案 · 平 面 作 品 · 试 着 让 它 们 还 活 着
          </div>
          <div className="font-mono text-[10px] tracking-[0.4em] text-[#f0e8dc]/40">
            9 PIECES · 2017 — 2022 · TOUCH TO BREATHE
          </div>
        </section>

        {/* WORK BELT — off-grid via 12-col with bespoke col-span/start per piece */}
        <div
          className="grid grid-cols-12 gap-y-24 md:gap-y-36"
          style={{ columnGap: '0' /* horizontal flow handled per-piece */ }}
        >
          {PIECES.map((p, i) => (
            <Frame piece={p} key={p.id} index={i} />
          ))}
        </div>

        {/* TAIL — quiet end mark */}
        <footer className="mt-32 flex items-center gap-4 text-[#f0e8dc]/25 font-mono text-[10px] tracking-[0.45em]">
          <span>END</span>
          <span
            className="flex-1 h-px"
            style={{
              background:
                'linear-gradient(90deg, rgba(240,232,220,0.18), transparent)',
            }}
          />
          <span>9 / 9</span>
        </footer>
      </main>

      <style>{`
        @keyframes arts_pulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 0.92; }
        }
      `}</style>
    </div>
  );
}

/* ===========================================================================
   FRAME — every piece sits inside this. Provides the shared binding material:
   film-leader header, lower-left caption, lower-right hint.
   Lazy-mounts the mechanic via IntersectionObserver (1 viewport prefetch radius).
=========================================================================== */

const SLOTS: Record<Piece['slot'], string> = {
  // each value: tailwind classes for col-start / col-span on a 12-col grid
  'lg-left':           'col-start-1 col-span-12 md:col-start-1 md:col-span-7',
  'md-right':          'col-start-1 col-span-12 md:col-start-7 md:col-span-6',
  'md-center':         'col-start-1 col-span-12 md:col-start-3 md:col-span-8',
  'lg-right':          'col-start-1 col-span-12 md:col-start-5 md:col-span-8',
  'tall-left':         'col-start-1 col-span-12 md:col-start-1 md:col-span-5',
  'md-portrait-right': 'col-start-1 col-span-12 md:col-start-7 md:col-span-5',
  'md-left':           'col-start-1 col-span-12 md:col-start-1 md:col-span-6',
  'sm-right':          'col-start-1 col-span-12 md:col-start-8 md:col-span-4',
};

function Frame({ piece, index }: { piece: Piece; index: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            // prefetch radius: mount mechanic ~1 viewport before visible
            setMounted(true);
          }
        }
      },
      { threshold: 0.05, rootMargin: '40% 0% 40% 0%' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tilt = piece.tilt ?? 0;

  // film-leader strip with diagonal hatching, sits above the artwork
  return (
    <article
      ref={ref}
      className={`${SLOTS[piece.slot]} relative`}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 1100ms ease-out, transform 1100ms ease-out',
      }}
    >
      <div
        className="relative"
        style={{
          transform: `rotate(${tilt}deg)`,
          transformOrigin: 'center',
        }}
      >
        {/* film-leader strip — the binding material */}
        <FilmLeader meta={piece.meta} index={index + 1} />

        {/* the artwork canvas — ALL mechanics render inside */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: piece.aspect,
            background: '#0a0710',
            boxShadow:
              '0 30px 80px -40px rgba(0,0,0,0.9), 0 8px 24px -16px rgba(0,0,0,0.6)',
          }}
        >
          {mounted && <Mechanic piece={piece} />}
          {/* subtle inner edge — paper feel without rounded-2xl */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.45)' }}
          />
        </div>

        {/* caption + hint row */}
        <div className="mt-3 flex items-end justify-between">
          <div
            className="font-zhSerif text-[#f0e8dc]/55"
            style={{ fontSize: 14, letterSpacing: '0.35em' }}
          >
            {piece.caption}
          </div>
          <div
            className="font-mono text-[10px] tracking-[0.3em] text-[#f0e8dc]/35"
            style={{ animation: 'arts_pulse 3.4s ease-in-out infinite' }}
          >
            {piece.hint}
          </div>
        </div>
      </div>
    </article>
  );
}

function FilmLeader({ meta, index }: { meta: string; index: number }) {
  const num = String(index).padStart(2, '0');
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="font-mono text-[10px] tracking-[0.45em] text-[#f0e8dc]/40">
        {num}
      </span>
      <span
        className="h-px flex-1"
        style={{
          background:
            'repeating-linear-gradient(90deg, rgba(240,232,220,0.20) 0 2px, transparent 2px 6px)',
        }}
      />
      <span className="font-mono text-[10px] tracking-[0.32em] text-[#f0e8dc]/45">
        {meta}
      </span>
    </div>
  );
}

/* ===========================================================================
   MECHANIC ROUTER — picks the right alive-component per piece.
=========================================================================== */

function Mechanic({ piece }: { piece: Piece }) {
  switch (piece.id) {
    case 'gray-cat':   return <StencilWipe src={piece.src} />;
    case 'pour':       return <PourStir src={piece.src} />;
    case 'heart':      return <HeartOrbit src={piece.src} />;
    case 'workshop':   return <ShatterDrag src={piece.src} variant="workshop" />;
    case 'decadent':   return <CharcoalWilt src={piece.src} />;
    case 'picasso':    return <ShatterDrag src={piece.src} variant="picasso" />;
    case 'fire':       return <FireEmbers src={piece.src} />;
    case 'curled':     return <CurledIdle src={piece.src} />;
    case 'orange-cat': return <OrangeNuzzle src={piece.src} />;
    default:           return <StaticImage src={piece.src} />;
  }
}

function StaticImage({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ userSelect: 'none' }}
    />
  );
}

/* ===========================================================================
   1. GRAY-CAT — stencil wipe.
   The illustration sits on top; cursor lingering on the canvas dissolves
   that layer over time, revealing the photo bg. Cursor leaves → illustration
   restores over 2s. Time-based dissolve — NOT a radial halo mask.
   Implementation note: we render the same image twice but treat the canvas
   as the "scratch off" surface using an offscreen alpha buffer.
=========================================================================== */

function StencilWipe({ src }: { src: string }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const top = useRef<HTMLImageElement | null>(null);
  const fadeMap = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef<number>(0);
  const cursor = useRef<{ x: number; y: number; active: boolean }>({
    x: -1,
    y: -1,
    active: false,
  });

  useEffect(() => {
    const wrapEl = wrap.current!;
    const cv = fadeMap.current!;
    const ctx = cv.getContext('2d')!;
    let w = 0, h = 0;

    const resize = () => {
      const r = wrapEl.getBoundingClientRect();
      w = Math.max(2, Math.floor(r.width));
      h = Math.max(2, Math.floor(r.height));
      cv.width = w;
      cv.height = h;
      // start fully opaque (illustration visible)
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapEl);

    const onMove = (e: PointerEvent) => {
      const r = wrapEl.getBoundingClientRect();
      cursor.current = {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
        active: true,
      };
    };
    const onLeave = () => { cursor.current.active = false; };
    wrapEl.addEventListener('pointermove', onMove);
    wrapEl.addEventListener('pointerleave', onLeave);

    const tick = () => {
      // slow restore everywhere
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,255,255,0.012)';
      ctx.fillRect(0, 0, w, h);

      // wipe under cursor — soft radial subtract
      if (cursor.current.active) {
        const c = cursor.current;
        ctx.globalCompositeOperation = 'destination-out';
        const r = Math.max(60, Math.min(w, h) * 0.18);
        const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
        grad.addColorStop(0, 'rgba(0,0,0,0.10)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      // (Old approach was per-frame toDataURL — too heavy. Replaced
      // with the mask-image strategy used elsewhere in this file.)
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf.current);
      wrapEl.removeEventListener('pointermove', onMove);
      wrapEl.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
    };
  }, []);

  // Strategy: use a real <canvas> as the WebKit mask source via a sibling
  // <canvas> overlay that paints a mask onto a DOM element with composite
  // operations. We use two stacked images and modulate the top via
  // `-webkit-mask-image` set from the canvas data url, but sparingly.

  // Simpler & faster strategy actually adopted: stack two <img>s, the top one
  // has its alpha controlled by a canvas painted with composite ops. We use
  // CSS mask via a <canvas>-as-mask approach with `mask-image` URL refresh
  // on a throttle.
  // For now we paint the top image with a CSS mask that follows the cursor
  // via radial-gradient on a state that updates ~30Hz.
  const [m, setM] = useState({ x: 50, y: 50, r: 0 });
  useEffect(() => {
    const wrapEl = wrap.current!;
    let last = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - last < 30) return;
      last = now;
      const r = wrapEl.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      setM({ x, y, r: 38 });
    };
    const onLeave = () => setM((s) => ({ ...s, r: 0 }));
    wrapEl.addEventListener('pointermove', onMove);
    wrapEl.addEventListener('pointerleave', onLeave);
    return () => {
      wrapEl.removeEventListener('pointermove', onMove);
      wrapEl.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      {/* photo background visible only where mask is darkened */}
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ userSelect: 'none' }}
      />
      {/* "illustration" layer = same image with desaturate + slight blur to
          read as an overlay; mask-image punches a hole at the cursor */}
      <img
        ref={top}
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          userSelect: 'none',
          filter: 'blur(0.4px) saturate(1.05)',
          WebkitMaskImage: `radial-gradient(circle at ${m.x}% ${m.y}%, transparent 0%, transparent ${m.r * 0.5}%, black ${m.r}%)`,
          maskImage: `radial-gradient(circle at ${m.x}% ${m.y}%, transparent 0%, transparent ${m.r * 0.5}%, black ${m.r}%)`,
          transition: 'mask-image 600ms ease-out, -webkit-mask-image 600ms ease-out',
        }}
      />
      {/* hidden helper canvas — kept for potential use, unused right now */}
      <canvas ref={fadeMap} className="hidden" />
    </div>
  );
}

/* ===========================================================================
   2. POUR — pixel warp along cursor velocity vector.
   Render the painting on a canvas. On mousemove, offset pixels in a falloff
   radius along the velocity direction; restore over time.
   Spec from design guidance: viscous easing, ~80 lines.
=========================================================================== */

function PourStir({ src }: { src: string }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const cv = useRef<HTMLCanvasElement | null>(null);
  const baseImg = useRef<HTMLImageElement | null>(null);
  const offsets = useRef<Float32Array | null>(null); // dx, dy per pixel grid cell
  const grid = useRef({ cols: 0, rows: 0, cell: 16 });

  useEffect(() => {
    const wrapEl = wrap.current!;
    const c = cv.current!;
    const ctx = c.getContext('2d', { alpha: false })!;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    let raf = 0;
    let lastPt: { x: number; y: number } | null = null;

    const resize = () => {
      const r = wrapEl.getBoundingClientRect();
      c.width = Math.floor(r.width);
      c.height = Math.floor(r.height);
      const cell = 16;
      grid.current = {
        cols: Math.ceil(c.width / cell),
        rows: Math.ceil(c.height / cell),
        cell,
      };
      offsets.current = new Float32Array(grid.current.cols * grid.current.rows * 2);
    };

    img.onload = () => {
      baseImg.current = img;
      resize();
      tick();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrapEl);

    const onMove = (e: PointerEvent) => {
      const r = wrapEl.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (lastPt) {
        const vx = x - lastPt.x;
        const vy = y - lastPt.y;
        applyStir(x, y, vx, vy);
      }
      lastPt = { x, y };
    };
    const onLeave = () => { lastPt = null; };
    wrapEl.addEventListener('pointermove', onMove);
    wrapEl.addEventListener('pointerleave', onLeave);

    const applyStir = (cx: number, cy: number, vx: number, vy: number) => {
      const off = offsets.current;
      if (!off) return;
      const { cols, rows, cell } = grid.current;
      const rad = 95;
      const rad2 = rad * rad;
      const strength = 1.4;
      // affect cells within radius
      const i0 = Math.max(0, Math.floor((cx - rad) / cell));
      const i1 = Math.min(cols - 1, Math.floor((cx + rad) / cell));
      const j0 = Math.max(0, Math.floor((cy - rad) / cell));
      const j1 = Math.min(rows - 1, Math.floor((cy + rad) / cell));
      for (let j = j0; j <= j1; j++) {
        for (let i = i0; i <= i1; i++) {
          const px = i * cell + cell / 2;
          const py = j * cell + cell / 2;
          const dx = px - cx;
          const dy = py - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 > rad2) continue;
          const falloff = (1 - d2 / rad2);
          const f = falloff * falloff * strength;
          const k = (j * cols + i) * 2;
          off[k]     += vx * f;
          off[k + 1] += vy * f;
        }
      }
    };

    const tick = () => {
      const off = offsets.current;
      const im = baseImg.current;
      if (!off || !im) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const { cols, rows, cell } = grid.current;
      // viscous easing — pull offsets toward zero
      // 1-(1-t)^4 means strong start, slow stop; we model by exponential decay
      const decay = 0.965;
      for (let k = 0; k < off.length; k++) off[k] *= decay;

      // draw image distorted via tile remapping
      // background fill (avoid transparent bands on edges)
      ctx.fillStyle = '#1a0e1c';
      ctx.fillRect(0, 0, c.width, c.height);
      const sx = im.naturalWidth / c.width;
      const sy = im.naturalHeight / c.height;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = (j * cols + i) * 2;
          const dx = off[k];
          const dy = off[k + 1];
          ctx.drawImage(
            im,
            (i * cell + dx) * sx,
            (j * cell + dy) * sy,
            cell * sx,
            cell * sy,
            i * cell,
            j * cell,
            cell + 1, // +1 to avoid seams
            cell + 1,
          );
        }
      }
      raf = requestAnimationFrame(tick);
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrapEl.removeEventListener('pointermove', onMove);
      wrapEl.removeEventListener('pointerleave', onLeave);
    };
  }, [src]);

  return (
    <div ref={wrap} className="absolute inset-0 cursor-crosshair">
      <canvas ref={cv} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

/* ===========================================================================
   3. HEART — orbiting planets & daisies.
   Painting visible underneath; 6 small planets orbit on elliptical paths;
   click any planet → daisies bloom outward, opacity-decay, gravity = 0.
=========================================================================== */

function HeartOrbit({ src }: { src: string }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const [t, setT] = useState(0);
  const [petals, setPetals] = useState<{ id: number; x: number; y: number; vx: number; vy: number; born: number }[]>([]);
  const idCounter = useRef(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = () => {
      setT((performance.now() - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // prune old petals
  useEffect(() => {
    if (!petals.length) return;
    const now = performance.now();
    const next = petals.filter((p) => now - p.born < 4500);
    if (next.length !== petals.length) setPetals(next);
  }, [t, petals]);

  // orbit definitions — relative to 0..100 viewbox
  const ORBITS = useMemo(
    () => [
      { rx: 16, ry: 12, cx: 30, cy: 50, period: 9,  phase: 0,    color: '#ffd17a', size: 1.6 },
      { rx: 22, ry: 16, cx: 35, cy: 50, period: 16, phase: 1.2,  color: '#9ad9ff', size: 2.2 },
      { rx: 12, ry: 9,  cx: 70, cy: 45, period: 7,  phase: 0.8,  color: '#e8a3a3', size: 1.4 },
      { rx: 18, ry: 14, cx: 65, cy: 55, period: 13, phase: 2.0,  color: '#cdbcff', size: 2.4 },
      { rx: 8,  ry: 6,  cx: 75, cy: 60, period: 5,  phase: 0.4,  color: '#ffeebd', size: 1.2 },
      { rx: 26, ry: 18, cx: 50, cy: 50, period: 22, phase: 3.1,  color: '#a7e6c9', size: 2.0 },
    ],
    [],
  );

  const onPlanet = (e: React.MouseEvent, ox: number, oy: number) => {
    e.stopPropagation();
    const r = wrap.current!.getBoundingClientRect();
    const burst: typeof petals = [];
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2 + Math.random() * 0.6;
      const sp = 18 + Math.random() * 32;
      burst.push({
        id: idCounter.current++,
        x: (ox / 100) * r.width,
        y: (oy / 100) * r.height,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        born: performance.now(),
      });
    }
    setPetals((p) => [...p, ...burst]);
  };

  return (
    <div ref={wrap} className="absolute inset-0">
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ userSelect: 'none' }}
      />

      {/* orbits — SVG overlay */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {ORBITS.map((o, i) => {
          const angle = (t / o.period) * Math.PI * 2 + o.phase;
          const px = o.cx + o.rx * Math.cos(angle);
          const py = o.cy + o.ry * Math.sin(angle) * 0.6;
          return (
            <g key={i}>
              {/* faint orbit hint */}
              <ellipse
                cx={o.cx}
                cy={o.cy}
                rx={o.rx}
                ry={o.ry * 0.6}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.1"
              />
              {/* the planet */}
              <circle
                cx={px}
                cy={py}
                r={o.size}
                fill={o.color}
                opacity={0.92}
                style={{
                  filter: `drop-shadow(0 0 ${o.size * 1.4}px ${o.color})`,
                  cursor: 'pointer',
                }}
                onClick={(e) => onPlanet(e as any, px, py)}
              />
            </g>
          );
        })}
      </svg>

      {/* petal layer */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {petals.map((p) => {
          const age = (performance.now() - p.born) / 1000;
          const x = p.x + p.vx * age * 8;
          const y = p.y + p.vy * age * 8;
          const opacity = Math.max(0, 1 - age / 4.5);
          const rot = age * 360 * 0.4;
          return (
            <Daisy
              key={p.id}
              x={x}
              y={y}
              size={10 + Math.random() * 6}
              opacity={opacity}
              rot={rot}
            />
          );
        })}
      </div>
    </div>
  );
}

function Daisy({ x, y, size, opacity, rot }: { x: number; y: number; size: number; opacity: number; rot: number }) {
  return (
    <svg
      viewBox="-10 -10 20 20"
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity,
        transform: `rotate(${rot}deg)`,
        pointerEvents: 'none',
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <ellipse
            key={i}
            cx={Math.cos(a) * 4}
            cy={Math.sin(a) * 4}
            rx="2.6"
            ry="4.6"
            transform={`rotate(${(i / 5) * 360})`}
            fill="white"
            opacity="0.9"
          />
        );
      })}
      <circle cx="0" cy="0" r="2" fill="#ffd766" />
    </svg>
  );
}

/* ===========================================================================
   4. WORKSHOP & 6. PICASSO — shatter into draggable polygons.
   Same engine, two flavors:
     - workshop: gravity ON, pieces fall when released, accumulate; click frame to reset
     - picasso: gravity OFF, pieces snap back to home after release (~2s)
   Polygons are pre-defined Voronoi-ish shards over a viewBox.
=========================================================================== */

type Shard = {
  id: number;
  /** SVG polygon points string for the shard outline */
  points: string;
  /** centroid for restore + drag origin */
  cx: number;
  cy: number;
  /** offset from home position (px in viewBox units) */
  ox: number;
  oy: number;
  /** velocity (workshop only) */
  vx: number;
  vy: number;
};

function ShatterDrag({ src, variant }: { src: string; variant: 'workshop' | 'picasso' }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  // shards designed in viewBox space; same shapes for both, just different physics
  const initial: Shard[] = useMemo(() => {
    // 8 angular shards covering the canvas — hand-defined for cubist feel.
    const polys = [
      '0,0 38,0 32,28 16,30 0,18',
      '38,0 72,0 60,30 32,28',
      '72,0 100,0 100,32 78,36 60,30',
      '0,18 16,30 14,55 0,46',
      '16,30 32,28 36,52 22,60 14,55',
      '32,28 60,30 56,58 36,52',
      '60,30 78,36 76,60 56,58',
      '78,36 100,32 100,64 76,60',
      '0,46 14,55 22,60 18,82 0,80',
      '22,60 36,52 50,72 32,90 18,82',
      '36,52 56,58 70,80 50,72',
      '56,58 76,60 88,86 70,80',
      '76,60 100,64 100,100 88,86',
      '0,80 18,82 32,90 22,100 0,100',
      '22,100 32,90 50,72 70,80 88,86 100,100',
    ];
    return polys.map((points, id) => {
      const pts = points.split(' ').map((p) => p.split(',').map(Number));
      const cx = pts.reduce((a, b) => a + b[0], 0) / pts.length;
      const cy = pts.reduce((a, b) => a + b[1], 0) / pts.length;
      return { id, points, cx, cy, ox: 0, oy: 0, vx: 0, vy: 0 };
    });
  }, []);

  const [shards, setShards] = useState<Shard[]>(initial);
  const dragging = useRef<{ id: number | null; lastX: number; lastY: number; vx: number; vy: number; t: number }>(
    { id: null, lastX: 0, lastY: 0, vx: 0, vy: 0, t: 0 },
  );

  // animation loop — physics + snap-back
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setShards((prev) =>
        prev.map((s) => {
          if (dragging.current.id === s.id) return s;
          if (variant === 'workshop') {
            // gravity, friction, floor & wall collisions in viewBox coords (0..100 / 0..(100/aspect))
            const g = 220;        // viewBox units / s²
            const fric = 0.985;
            let { ox, oy, vx, vy } = s;
            vy += g * dt;
            vx *= fric;
            vy *= fric;
            ox += vx * dt;
            oy += vy * dt;
            // floor — bound is rough since viewBox-y isn't pixel-exact, but works
            const floorY = 100; // we use square viewBox 0..100; aspect is handled by SVG preserveAspectRatio="none"
            if (s.cy + oy > floorY) {
              oy = floorY - s.cy;
              vy *= -0.32;
              vx *= 0.8;
            }
            // walls
            if (s.cx + ox < 0) { ox = -s.cx; vx *= -0.5; }
            if (s.cx + ox > 100) { ox = 100 - s.cx; vx *= -0.5; }
            return { ...s, ox, oy, vx, vy };
          } else {
            // picasso: snap back smoothly
            const k = 5; // spring
            const damp = 6;
            const ax = -k * s.ox - damp * s.vx;
            const ay = -k * s.oy - damp * s.vy;
            const vx = s.vx + ax * dt;
            const vy = s.vy + ay * dt;
            const ox = s.ox + vx * dt;
            const oy = s.oy + vy * dt;
            return { ...s, ox, oy, vx, vy };
          }
        }),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [variant]);

  const onShardDown = (id: number) => (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    e.stopPropagation();
    dragging.current = { id, lastX: e.clientX, lastY: e.clientY, vx: 0, vy: 0, t: performance.now() };
  };
  const onShardMove = (id: number) => (e: React.PointerEvent) => {
    if (dragging.current.id !== id) return;
    const r = wrap.current!.getBoundingClientRect();
    // viewBox is 0..100 in x; map screen px → viewBox units
    const dx = ((e.clientX - dragging.current.lastX) / r.width) * 100;
    const dy = ((e.clientY - dragging.current.lastY) / r.height) * 100;
    const now = performance.now();
    const dt = Math.max(0.001, (now - dragging.current.t) / 1000);
    dragging.current.vx = dx / dt;
    dragging.current.vy = dy / dt;
    dragging.current.lastX = e.clientX;
    dragging.current.lastY = e.clientY;
    dragging.current.t = now;
    setShards((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ox: s.ox + dx, oy: s.oy + dy } : s,
      ),
    );
  };
  const onShardUp = (id: number) => (_e: React.PointerEvent) => {
    if (dragging.current.id === id) {
      const { vx, vy } = dragging.current;
      setShards((prev) =>
        prev.map((s) => (s.id === id ? { ...s, vx, vy } : s)),
      );
      dragging.current.id = null;
    }
  };

  // double-click frame to reset (workshop only — picasso self-restores)
  const onReset = () => setShards(initial);

  return (
    <div
      ref={wrap}
      className="absolute inset-0"
      onDoubleClick={variant === 'workshop' ? onReset : undefined}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <pattern id={`art-${variant}`} patternUnits="userSpaceOnUse" width="100" height="100">
            <image href={src} x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" />
          </pattern>
          {/* backing layer = darker version of the painting / paper underneath */}
          <pattern id={`art-${variant}-back`} patternUnits="userSpaceOnUse" width="100" height="100">
            <image
              href={src}
              x="0"
              y="0"
              width="100"
              height="100"
              preserveAspectRatio="xMidYMid slice"
              style={{ filter: 'brightness(0.32) saturate(0.5) blur(2px)' }}
            />
          </pattern>
          <filter id={`shadow-${variant}`}>
            <feGaussianBlur stdDeviation="0.8" />
            <feOffset dx="0.6" dy="1.2" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0"
            />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>

        {/* darkened backing — visible where shards have moved away */}
        <rect width="100" height="100" fill={`url(#art-${variant}-back)`} />

        {shards.map((s) => {
          const lifted = Math.abs(s.ox) + Math.abs(s.oy) > 0.5;
          return (
            <g
              key={s.id}
              transform={`translate(${s.ox} ${s.oy})`}
              style={{ cursor: 'grab' }}
              onPointerDown={onShardDown(s.id)}
              onPointerMove={onShardMove(s.id)}
              onPointerUp={onShardUp(s.id)}
              onPointerCancel={onShardUp(s.id)}
            >
              {lifted && (
                <polygon
                  points={s.points}
                  fill="rgba(0,0,0,0.55)"
                  transform="translate(0.6 1.4)"
                  style={{ filter: 'blur(0.6px)' }}
                />
              )}
              <polygon
                points={s.points}
                fill={`url(#art-${variant})`}
                stroke="rgba(0,0,0,0.18)"
                strokeWidth="0.15"
              />
            </g>
          );
        })}
      </svg>

      {/* tiny instruction in workshop variant only */}
      {variant === 'workshop' && (
        <div className="absolute top-3 right-3 font-mono text-[9px] tracking-[0.3em] text-[#f0e8dc]/30 pointer-events-none">
          DBL-CLICK · RESET
        </div>
      )}
    </div>
  );
}

/* ===========================================================================
   5. CHARCOAL WILT — leaves droop when cursor sits idle inside the frame.
   Idle > 3s → SVG transform rotates leaf overlays; movement reverts.
   Note: actual "leaves" are an abstraction — we use 6 anchor points on top of
   the painting and rotate a slight droop indicator near each. The PAINTING
   itself doesn't change; the page's RHYTHM does (vignette deepens, edges get heavier).
=========================================================================== */

function CharcoalWilt({ src }: { src: string }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const [wilted, setWilted] = useState(0); // 0..1 droop intensity
  const lastMove = useRef(performance.now());
  const inside = useRef(false);

  useEffect(() => {
    const el = wrap.current!;
    const onMove = () => {
      lastMove.current = performance.now();
      inside.current = true;
    };
    const onEnter = () => { inside.current = true; lastMove.current = performance.now(); };
    const onLeave = () => { inside.current = false; };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);

    let raf = 0;
    const tick = () => {
      const idle = (performance.now() - lastMove.current) / 1000;
      // idle > 3 → start wilting; max wilt at idle 12s
      const target = !inside.current
        ? Math.min(1, Math.max(0, (idle - 3) / 9))
        : 0;
      setWilted((w) => {
        // ease-in for wilt (slow heaviness), ease-out faster for revival
        const speed = target > w ? 0.012 : 0.05;
        return w + (target - w) * speed;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          userSelect: 'none',
          filter: `brightness(${1 - wilted * 0.18}) saturate(${1 - wilted * 0.5}) blur(${wilted * 0.5}px)`,
          transform: `scale(${1 + wilted * 0.012})`,
          transformOrigin: '50% 100%',
          transition: 'filter 600ms linear',
        }}
      />
      {/* heavy vignette that grows with wilt */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 35%, transparent ${50 - wilted * 25}%, rgba(0,0,0,${0.4 + wilted * 0.4}) 100%)`,
          transition: 'background 800ms linear',
        }}
      />
      {/* small droop indicator dots — they sink as wilt rises */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
        {[
          [22, 18], [46, 12], [74, 22], [62, 40], [30, 52], [82, 58],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y + wilted * 22}
            r={0.6}
            fill="rgba(255,240,210,0.7)"
            style={{ filter: 'drop-shadow(0 0 2px rgba(255,240,210,0.5))', transition: 'cy 1200ms ease-in' }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ===========================================================================
   7. FIRE — swipe-spawned embers.
   Particles spawn along cursor velocity; few, large-soft, short-lived;
   warm orange + 1 white-hot accent; no HSL hue rotation.
=========================================================================== */

type Ember = { x: number; y: number; vx: number; vy: number; life: number; max: number; hot: boolean; size: number };

function FireEmbers({ src }: { src: string }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const cv = useRef<HTMLCanvasElement | null>(null);
  const embers = useRef<Ember[]>([]);

  useEffect(() => {
    const wrapEl = wrap.current!;
    const c = cv.current!;
    const ctx = c.getContext('2d')!;
    let raf = 0;
    let last: { x: number; y: number; t: number } | null = null;

    const resize = () => {
      const r = wrapEl.getBoundingClientRect();
      c.width = Math.floor(r.width);
      c.height = Math.floor(r.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapEl);

    const spawn = (x: number, y: number, vx: number, vy: number, count: number) => {
      const speed = Math.hypot(vx, vy);
      const n = Math.min(count, Math.max(2, Math.floor(speed / 6)));
      for (let i = 0; i < n; i++) {
        const ang = Math.atan2(vy, vx) + (Math.random() - 0.5) * 0.8;
        const sp = speed * (0.4 + Math.random() * 0.6);
        embers.current.push({
          x,
          y,
          vx: Math.cos(ang) * sp + (Math.random() - 0.5) * 30,
          vy: Math.sin(ang) * sp - 60 - Math.random() * 50,
          life: 0,
          max: 0.9 + Math.random() * 0.8,
          hot: Math.random() < 0.18, // ~1 white-hot per 5
          size: 4 + Math.random() * 5,
        });
      }
      // cap
      if (embers.current.length > 220) {
        embers.current = embers.current.slice(-220);
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = wrapEl.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const now = performance.now();
      if (last) {
        const dt = (now - last.t) / 1000;
        if (dt > 0) {
          spawn(x, y, (x - last.x) / dt * 0.6, (y - last.y) / dt * 0.6, 8);
        }
      }
      last = { x, y, t: now };
    };
    wrapEl.addEventListener('pointermove', onMove);

    let lastTime = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - lastTime) / 1000);
      lastTime = t;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.globalCompositeOperation = 'lighter';
      const arr = embers.current;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.life += dt;
        if (p.life > p.max) {
          arr.splice(i, 1);
          continue;
        }
        // exponential decay friction
        p.vx *= 0.96;
        p.vy = p.vy * 0.96 - 90 * dt; // upward "rise" buoyancy
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const r = p.life / p.max; // 0..1
        const alpha = (1 - r) * (1 - r) * 0.85;
        const radius = p.size * (1 - r * 0.4);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        if (p.hot) {
          grad.addColorStop(0, `rgba(255,250,210,${alpha})`);
          grad.addColorStop(0.4, `rgba(255,200,140,${alpha * 0.6})`);
          grad.addColorStop(1, `rgba(220,90,40,0)`);
        } else {
          grad.addColorStop(0, `rgba(255,150,80,${alpha})`);
          grad.addColorStop(0.5, `rgba(220,70,40,${alpha * 0.6})`);
          grad.addColorStop(1, `rgba(80,20,10,0)`);
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrapEl.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0 cursor-crosshair">
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ userSelect: 'none' }}
      />
      <canvas ref={cv} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
}

/* ===========================================================================
   8. CURLED — long-idle responsive (60s+).
   Different time signature than gray-cat: this one only stirs after
   prolonged page idleness. Feels almost passive-aggressive.
=========================================================================== */

function CurledIdle({ src }: { src: string }) {
  const [pageIdle, setPageIdle] = useState(0);
  useEffect(() => {
    let last = performance.now();
    const bump = () => { last = performance.now(); };
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    let raf = 0;
    const tick = () => {
      setPageIdle((performance.now() - last) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, []);

  // 0–60s: subtle breathing only.
  // 60s+: tighter curl + a 'z' appears.
  // 80s+: another z.
  // moves on movement → cat slow-stretches back.
  const breathe = Math.sin(performance.now() / 1500) * 0.008;
  const tightening = Math.min(1, Math.max(0, (pageIdle - 60) / 20));
  const showZ1 = pageIdle > 60;
  const showZ2 = pageIdle > 85;

  return (
    <div className="absolute inset-0">
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          userSelect: 'none',
          transform: `scale(${1 + breathe + tightening * 0.02})`,
          transformOrigin: '60% 70%',
          filter: `brightness(${1 - tightening * 0.15})`,
          transition: 'filter 1200ms linear',
        }}
      />
      {/* z's float up */}
      <div className="absolute pointer-events-none" style={{ top: '14%', left: '52%' }}>
        {showZ1 && (
          <span
            className="font-serif italic text-[#f0e8dc]/70 block"
            style={{
              fontSize: 36,
              animation: 'arts_zfloat 4s ease-in-out infinite',
            }}
          >
            z
          </span>
        )}
        {showZ2 && (
          <span
            className="font-serif italic text-[#f0e8dc]/55 block"
            style={{
              fontSize: 28,
              marginLeft: 12,
              marginTop: -18,
              animation: 'arts_zfloat 4s ease-in-out infinite 1.2s',
            }}
          >
            z
          </span>
        )}
      </div>
      <style>{`
        @keyframes arts_zfloat {
          0%   { opacity: 0; transform: translateY(0) rotate(-4deg); }
          30%  { opacity: 0.85; }
          100% { opacity: 0; transform: translateY(-22px) rotate(8deg); }
        }
      `}</style>
    </div>
  );
}

/* ===========================================================================
   9. ORANGE-CAT — nuzzle gesture.
   Cursor sitting on the cheek hot-zone for >1s → eyes close, smile widens.
=========================================================================== */

function OrangeNuzzle({ src }: { src: string }) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const [happy, setHappy] = useState(false);
  const dwellTimer = useRef<number | null>(null);

  useEffect(() => {
    const el = wrap.current!;
    const HOT = { x0: 35, y0: 45, x1: 75, y1: 80 }; // % rect — face area
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      const inHot = x >= HOT.x0 && x <= HOT.x1 && y >= HOT.y0 && y <= HOT.y1;
      if (inHot) {
        if (dwellTimer.current == null) {
          dwellTimer.current = window.setTimeout(() => setHappy(true), 900);
        }
      } else {
        if (dwellTimer.current != null) {
          window.clearTimeout(dwellTimer.current);
          dwellTimer.current = null;
        }
        setHappy(false);
      }
    };
    const onLeave = () => {
      if (dwellTimer.current != null) {
        window.clearTimeout(dwellTimer.current);
        dwellTimer.current = null;
      }
      setHappy(false);
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      if (dwellTimer.current != null) window.clearTimeout(dwellTimer.current);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          userSelect: 'none',
          transform: `scale(${happy ? 1.012 : 1})`,
          filter: `saturate(${happy ? 1.08 : 1}) brightness(${happy ? 1.04 : 1})`,
          transition: 'transform 800ms ease-out, filter 800ms ease-out',
        }}
      />
      {/* the face is realistic-painted; we add an SVG overlay at the eye to
          'close' it on happy. Hand-tuned positions specific to this image. */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {/* the open eye (visible in source img) sits roughly at (52, 56) */}
        <ellipse
          cx="52.4"
          cy="56.4"
          rx="3.2"
          ry={happy ? 0.5 : 3}
          fill="#e89a30"
          opacity={happy ? 0.95 : 0}
          style={{ transition: 'ry 700ms ease-out, opacity 700ms ease-out' }}
        />
        {/* faint smile widen — small arc */}
        <path
          d={happy
            ? 'M 50 76 Q 56 82 62 76'
            : 'M 50 76 Q 56 79 62 76'}
          fill="none"
          stroke="rgba(60,30,15,0.45)"
          strokeWidth={happy ? 0.7 : 0.4}
          style={{ transition: 'stroke-width 600ms ease-out' }}
        />
      </svg>
      {/* tiny purr indicator */}
      <div
        className="absolute font-mono text-[9px] tracking-[0.4em] text-[#ffe6c2]/70"
        style={{
          left: '52%',
          top: '14%',
          opacity: happy ? 1 : 0,
          transition: 'opacity 600ms ease-out',
        }}
      >
        ~ purr ~
      </div>
    </div>
  );
}

/* ===========================================================================
   DUST GRAIN — page-wide binding overlay.
   Subtle grain texture rendered via SVG noise filter; very low opacity.
=========================================================================== */

function DustGrain() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 mix-blend-overlay"
      style={{
        opacity: 0.045,
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        backgroundSize: '180px 180px',
      }}
    />
  );
}
