import { useEffect, useRef, useState } from 'react';
import { BrandMark } from '../components/BrandMark';
import { BackLink } from '../components/BackLink';

/* ============================================================================
   ARTS — gallery, not toy room.

   Design contract (this is the second pass; do not regress):
   - Each video piece is a moving painting. Hover → video starts + audio
     unmutes. Leave → video pauses, audio mutes, frame returns to poster.
   - The ONLY chrome on the page is the brand mark (top-left) and back link
     (bottom-right). No film-leader strip, no [HINT] labels, no dust grain,
     no tilts, no off-grid wobble — those were "interactive archive" language,
     read as a toy room. This is "moving painting in a gallery wall."
   - Layout = a single centered column. Each work occupies a wide quiet frame
     with generous vertical breathing space. Title + medium below in tiny
     museum-wall-label register.
   - Cats are arranged as a static triptych at the end, treated as one piece
     rather than three — 三联系列, single shared label.
   - Audio unlock: hover plays muted by default. After ANY click on the page,
     audio is unlocked for subsequent hovers. A tiny prompt hints this at the
     top until the first click happens.
   - Videos: preload="metadata" only — no eager fetch of the 22MB total. Each
     video uses its painting as the poster, so the still state IS the artwork.
============================================================================ */

type VideoPiece = {
  id: string;
  zh: string;          // 4-8 char title — the Chinese name
  en: string;          // English equivalent
  year: string;
  medium: string;
  /** poster (what shows pre-hover) — the actual painting */
  poster: string;
  /** the moving-painting video */
  video: string;
  /** rough w/h ratio of the source */
  aspect: number;
};

const VIDEOS: VideoPiece[] = [
  {
    id: 'pour',
    zh: '倾倒之粉',
    en: 'Pour, in pink',
    year: '2018',
    medium: 'Acrylic pour on canvas · 60 × 80 cm',
    poster: '/arts/pour.jpg',
    video: '/arts/videos/pour.mp4',
    aspect: 4 / 3,
  },
  {
    id: 'fire',
    zh: '火与烬',
    en: 'Fire and embers',
    year: '2018',
    medium: 'Oil on canvas · 50 × 60 cm',
    poster: '/arts/fire.jpg',
    video: '/arts/videos/fire.mp4',
    aspect: 4 / 5,
  },
  {
    id: 'workshop',
    zh: '工坊地面',
    en: 'Workshop floor',
    year: '2017',
    medium: 'Photograph · Barcelona',
    poster: '/arts/workshop.jpg',
    video: '/arts/videos/workshop.mp4',
    aspect: 3 / 2,
  },
  {
    id: 'decadent',
    zh: '衰败的生',
    en: 'Decadent growth',
    year: '2017',
    medium: 'Charcoal on newsprint · 80 × 200 cm',
    poster: '/arts/decadent.jpg',
    video: '/arts/videos/decadent.mp4',
    aspect: 1 / 2.3,
  },
  {
    id: 'picasso',
    zh: '致毕加索',
    en: 'After Picasso · Violin and Guitar',
    year: '2017',
    medium: 'Mixed media study',
    poster: '/arts/picasso.jpg',
    video: '/arts/videos/picasso.mp4',
    aspect: 3 / 4,
  },
];

const CATS = [
  { id: 'gray-cat',   title: '灰猫与门', src: '/arts/gray-cat.jpg' },
  { id: 'curled',     title: '沉睡之蜷', src: '/arts/curled.jpg' },
  { id: 'orange-cat', title: '草坪之橘', src: '/arts/orange-cat.jpg' },
];

/* -------------------------------------------------------------------------- */

export default function Arts() {
  const [entered, setEntered] = useState(false);
  const audioUnlocked = useAudioUnlock();

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-[#0d0a14] text-[#f0e8dc]">
      {/* deep gallery vignette — much subtler than V2's wash */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, rgba(40,32,55,0.35) 0%, transparent 55%),' +
            'radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.55) 0%, transparent 60%)',
        }}
      />

      {/* brand top-left */}
      <header
        className="fixed top-6 left-7 z-30 pointer-events-none"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(-6px)',
          transition: 'opacity 1100ms ease-out, transform 1100ms ease-out',
        }}
      >
        <BrandMark subtitle="ARTS" size="sm" />
      </header>

      {/* tiny audio-unlock hint, shown only while still locked */}
      <div
        className="fixed top-6 right-7 z-30 pointer-events-none font-mono text-[10px] tracking-[0.32em] text-[#f0e8dc]/40"
        style={{
          opacity: entered && !audioUnlocked ? 1 : 0,
          transition: 'opacity 1500ms ease-out 600ms',
        }}
      >
        TAP ANYWHERE TO HEAR
      </div>
      {/* once unlocked, swap to a quiet "audio on" indicator */}
      <div
        className="fixed top-6 right-7 z-30 pointer-events-none font-mono text-[10px] tracking-[0.32em] text-[#f0e8dc]/40 flex items-center gap-2"
        style={{
          opacity: entered && audioUnlocked ? 1 : 0,
          transition: 'opacity 600ms ease-out',
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: '#caa5ff', boxShadow: '0 0 6px #caa5ff' }}
        />
        AUDIO READY
      </div>

      {/* back link — bottom-right, shared <BackLink> so position never
          drifts between /projects and /arts */}
      <BackLink />

      {/* MAIN — single centered column */}
      <main
        className="relative z-10 max-w-[1100px] mx-auto px-6 md:px-10"
        style={{
          paddingTop: 'clamp(120px, 18vh, 220px)',
          paddingBottom: 'clamp(120px, 18vh, 220px)',
        }}
      >
        {/* page title — small, reverent. The works are the display. */}
        <section
          className="mb-[18vh] md:mb-[24vh]"
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 1400ms ease-out 200ms, transform 1400ms ease-out 200ms',
          }}
        >
          <div className="font-mono text-[10px] tracking-[0.4em] text-[#f0e8dc]/35 mb-3">
            J. CHEN · WORKS · 2017 — 2022
          </div>
          <h1
            className="font-zhSerif text-[#f0e8dc]/85 leading-[1.5]"
            style={{
              fontSize: 'clamp(15px, 1.5vw, 19px)',
              letterSpacing: '0.32em',
              maxWidth: '24ch',
            }}
          >
            把 一 些 旧 的 平 面 作 品 重 新 看 一 遍
          </h1>
          <div
            className="mt-8 h-px w-16"
            style={{
              background:
                'linear-gradient(90deg, rgba(245,184,214,0.7), rgba(200,165,255,0.45) 50%, rgba(126,197,255,0.55) 90%, transparent)',
            }}
          />
        </section>

        {/* the five moving paintings */}
        {VIDEOS.map((p, i) => (
          <PaintingFrame piece={p} index={i + 1} audioUnlocked={audioUnlocked} key={p.id} />
        ))}

        {/* the 3D sculpture — three views in a row (front / side / process video) */}
        <SculpturePolyptych audioUnlocked={audioUnlocked} />

        {/* the cat triptych */}
        <CatTriptych />

        {/* tail */}
        <footer className="mt-[18vh] flex items-center gap-4 text-[#f0e8dc]/22 font-mono text-[10px] tracking-[0.45em]">
          <span>END</span>
          <span
            className="flex-1 h-px"
            style={{
              background:
                'linear-gradient(90deg, rgba(240,232,220,0.18), transparent)',
            }}
          />
          <span>{VIDEOS.length} + 2</span>
        </footer>
      </main>
    </div>
  );
}

/* ===========================================================================
   PAINTING FRAME — one moving painting per piece.
=========================================================================== */

function PaintingFrame({
  piece,
  index,
  audioUnlocked,
}: {
  piece: VideoPiece;
  index: number;
  audioUnlocked: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setShown(true);
        }
      },
      { threshold: 0.06, rootMargin: '20% 0% 20% 0%' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The whole piece (frame + wall labels) is centred and width-capped so the
  // labels visually belong to the work, not to the page column.
  const FRAME_MAX_VH = 72;
  return (
    <article
      ref={wrapRef}
      className="mb-[22vh] md:mb-[28vh] last:mb-0"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 1400ms ease-out, transform 1400ms ease-out',
        width: `min(100%, calc(${FRAME_MAX_VH}vh * ${piece.aspect}))`,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {/* wall label — above the work, tiny mono, like museum signage */}
      <div className="mb-5 flex items-baseline gap-3 text-[#f0e8dc]/45 font-mono text-[10px] tracking-[0.4em]">
        <span>{String(index).padStart(2, '0')}</span>
        <span className="h-px w-6 bg-[#f0e8dc]/20" />
        <span>{piece.year}</span>
      </div>

      {/* the moving painting itself */}
      <HoverVideo
        poster={piece.poster}
        src={piece.video}
        aspect={piece.aspect}
        audioUnlocked={audioUnlocked}
      />

      {/* wall label below — title + medium */}
      <div className="mt-7 md:mt-9 flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
        <div className="flex items-baseline gap-5">
          <h2
            className="font-zhSerif text-[#f0e8dc]/95"
            style={{
              fontSize: 'clamp(20px, 2.2vw, 28px)',
              letterSpacing: '0.32em',
            }}
          >
            {piece.zh}
          </h2>
          <span
            className="font-serif italic text-[#f0e8dc]/50"
            style={{
              fontSize: 'clamp(13px, 1.2vw, 16px)',
              letterSpacing: '0.01em',
              fontVariationSettings: "'opsz' 96, 'SOFT' 50, 'WONK' 1",
            }}
          >
            {piece.en}
          </span>
        </div>
        <div className="font-mono text-[10px] tracking-[0.35em] text-[#f0e8dc]/45 md:text-right">
          {piece.medium.toUpperCase()}
        </div>
      </div>
    </article>
  );
}

/* ===========================================================================
   HOVER VIDEO — the core interaction.
   Pre-hover  : poster (the painting) shows.
   Hover-in   : video plays. If audio unlocked → unmuted. Else muted (tiny hint).
   Hover-out  : pause + reset to first frame + mute.
   No autoplay-loop; no controls; no fancy timing.
=========================================================================== */

function HoverVideo({
  poster,
  src,
  aspect,
  audioUnlocked,
}: {
  poster: string;
  src: string;
  aspect: number;
  audioUnlocked: boolean;
}) {
  const v = useRef<HTMLVideoElement | null>(null);
  const wrap = useRef<HTMLDivElement | null>(null);
  const [hovering, setHovering] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = v.current;
    if (!el) return;
    if (hovering) {
      el.muted = !audioUnlocked;
      // Volume rises gently so it doesn't slam in
      el.volume = audioUnlocked ? 1 : 0;
      el.play()
        .then(() => setPlaying(true))
        .catch(() => {/* user gesture not yet granted; muted play already worked */});
    } else {
      el.pause();
      el.currentTime = 0;
      el.muted = true;
      setPlaying(false);
    }
  }, [hovering, audioUnlocked]);

  // Width is controlled by the parent <article>; aspect ratio drives height.
  return (
    <div
      ref={wrap}
      className="relative w-full"
      style={{
        aspectRatio: aspect,
        background: '#0a0710',
        boxShadow:
          '0 40px 90px -40px rgba(0,0,0,0.85), 0 14px 30px -16px rgba(0,0,0,0.55)',
      }}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <video
        ref={v}
        src={src}
        poster={poster}
        loop
        playsInline
        muted
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ userSelect: 'none' }}
      />
      {/* faint inner edge — paper / canvas feel without rounded corners */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 90px rgba(0,0,0,0.5)' }}
      />
      {/* hover indicator — extremely subtle, only visible mid-fade */}
      <div
        className="pointer-events-none absolute bottom-3 right-3 font-mono text-[9px] tracking-[0.32em] text-[#f0e8dc]/45"
        style={{
          opacity: hovering ? 0 : 0.6,
          transition: 'opacity 600ms ease-out',
        }}
      >
        HOVER
      </div>
      {/* a quiet "playing" dot — hidden when not playing */}
      <div
        className="pointer-events-none absolute top-3 right-3"
        style={{
          opacity: playing ? 1 : 0,
          transition: 'opacity 500ms ease-out',
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{
            background: audioUnlocked ? '#caa5ff' : '#f0e8dc',
            boxShadow: `0 0 8px ${audioUnlocked ? '#caa5ff' : 'rgba(240,232,220,0.6)'}`,
            animation: 'arts_blink 2.4s ease-in-out infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes arts_blink {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ===========================================================================
   CAT TRIPTYCH — three static cats arranged as one piece.
=========================================================================== */

function CatTriptych() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setShown(true);
        }
      },
      { threshold: 0.06, rootMargin: '20% 0% 20% 0%' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Triptych aspect = 12/5 (very wide). Same width-cap rule as the video frames.
  const TRIPTYCH_ASPECT = 12 / 5;
  return (
    <article
      ref={wrapRef}
      className="mb-0"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 1400ms ease-out, transform 1400ms ease-out',
        width: `min(100%, calc(72vh * ${TRIPTYCH_ASPECT}))`,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {/* wall label — above */}
      <div className="mb-5 flex items-baseline gap-3 text-[#f0e8dc]/45 font-mono text-[10px] tracking-[0.4em]">
        <span>07</span>
        <span className="h-px w-6 bg-[#f0e8dc]/20" />
        <span>2022</span>
      </div>

      {/* the triptych — three panels, equal width, hairline gap */}
      <div
        className="grid grid-cols-3 w-full"
        style={{
          gap: 4,
          background: '#070510', // hairline color showing between panels
          padding: 4,
          aspectRatio: TRIPTYCH_ASPECT,
          boxShadow:
            '0 40px 90px -40px rgba(0,0,0,0.85), 0 14px 30px -16px rgba(0,0,0,0.55)',
        }}
      >
        {CATS.map((c) => (
          <div
            key={c.id}
            className="relative overflow-hidden"
            style={{ background: '#0a0710' }}
          >
            <img
              src={c.src}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
              style={{ userSelect: 'none' }}
            />
            {/* faint inner edge per panel */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}
            />
          </div>
        ))}
      </div>

      {/* unified label below */}
      <div className="mt-7 md:mt-9 flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
        <div className="flex items-baseline gap-5">
          <h2
            className="font-zhSerif text-[#f0e8dc]/95"
            style={{
              fontSize: 'clamp(20px, 2.2vw, 28px)',
              letterSpacing: '0.32em',
            }}
          >
            三 联 · 猫
          </h2>
          <span
            className="font-serif italic text-[#f0e8dc]/50"
            style={{
              fontSize: 'clamp(13px, 1.2vw, 16px)',
              letterSpacing: '0.01em',
              fontVariationSettings: "'opsz' 96, 'SOFT' 50, 'WONK' 1",
            }}
          >
            Triptych · three cats, kept still
          </span>
        </div>
        <div className="font-mono text-[10px] tracking-[0.35em] text-[#f0e8dc]/45 md:text-right">
          PROCREATE · DIGITAL ON PHOTO
        </div>
      </div>

      {/* per-panel sub-titles, in a tight row beneath the unified label */}
      <div className="mt-3 grid grid-cols-3 gap-1 font-zhSerif text-[12px] text-[#f0e8dc]/40 tracking-[0.32em]">
        {CATS.map((c) => (
          <span key={c.id}>{c.title}</span>
        ))}
      </div>
    </article>
  );
}

/* ===========================================================================
   SCULPTURE POLYPTYCH — three views (front / side / process video) of the
   2020 wall sculpture. Equal-width tiles, square aspect, hairline gap.
   The third tile is a HoverVideo (12s, audio); the other two are stills.
=========================================================================== */

function SculpturePolyptych({ audioUnlocked }: { audioUnlocked: boolean }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setShown(true);
        }
      },
      { threshold: 0.06, rootMargin: '20% 0% 20% 0%' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Three squares = aspect 3:1 for the row.
  const ROW_ASPECT = 3;
  return (
    <article
      ref={wrapRef}
      className="mb-[22vh] md:mb-[28vh]"
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(40px)',
        transition: 'opacity 1400ms ease-out, transform 1400ms ease-out',
        width: `min(100%, calc(72vh * ${ROW_ASPECT}))`,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {/* wall label — above */}
      <div className="mb-5 flex items-baseline gap-3 text-[#f0e8dc]/45 font-mono text-[10px] tracking-[0.4em]">
        <span>06</span>
        <span className="h-px w-6 bg-[#f0e8dc]/20" />
        <span>2020</span>
      </div>

      {/* the row — three equal square tiles, hairline gap */}
      <div
        className="grid grid-cols-3 w-full"
        style={{
          gap: 4,
          background: '#070510',
          padding: 4,
          aspectRatio: ROW_ASPECT,
          boxShadow:
            '0 40px 90px -40px rgba(0,0,0,0.85), 0 14px 30px -16px rgba(0,0,0,0.55)',
        }}
      >
        {/* front view */}
        <div className="relative overflow-hidden" style={{ background: '#0a0710' }}>
          <img
            src="/arts/sculpture-front.jpg"
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            style={{ userSelect: 'none' }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}
          />
        </div>

        {/* side view */}
        <div className="relative overflow-hidden" style={{ background: '#0a0710' }}>
          <img
            src="/arts/sculpture-side.jpg"
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            style={{ userSelect: 'none' }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}
          />
        </div>

        {/* process video — hover plays */}
        <SculptureVideoTile audioUnlocked={audioUnlocked} />
      </div>

      {/* wall label below — title + medium */}
      <div className="mt-7 md:mt-9 flex flex-col md:flex-row md:items-baseline md:justify-between gap-2">
        <div className="flex items-baseline gap-5">
          <h2
            className="font-zhSerif text-[#f0e8dc]/95"
            style={{
              fontSize: 'clamp(20px, 2.2vw, 28px)',
              letterSpacing: '0.32em',
            }}
          >
            漩 涡 之 心
          </h2>
          <span
            className="font-serif italic text-[#f0e8dc]/50"
            style={{
              fontSize: 'clamp(13px, 1.2vw, 16px)',
              letterSpacing: '0.01em',
              fontVariationSettings: "'opsz' 96, 'SOFT' 50, 'WONK' 1",
            }}
          >
            Heart of the vortex
          </span>
        </div>
        <div className="font-mono text-[10px] tracking-[0.35em] text-[#f0e8dc]/45 md:text-right">
          MIXED MEDIA · WOOD, BRASS, PEARLS · ~60×60 CM
        </div>
      </div>

      {/* tiny per-tile sub-labels under the row */}
      <div className="mt-3 grid grid-cols-3 gap-1 font-zhSerif text-[12px] text-[#f0e8dc]/40 tracking-[0.32em]">
        <span>正 面</span>
        <span>侧 面</span>
        <span>创 作 过 程</span>
      </div>
    </article>
  );
}

/** Square hover-video tile with the same play/mute lifecycle as HoverVideo,
 *  but rendered absolutely-positioned to fill its grid cell (HoverVideo's
 *  outer width formula doesn't apply here — the tile inherits cell size). */
function SculptureVideoTile({ audioUnlocked }: { audioUnlocked: boolean }) {
  const v = useRef<HTMLVideoElement | null>(null);
  const [hovering, setHovering] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const el = v.current;
    if (!el) return;
    if (hovering) {
      el.muted = !audioUnlocked;
      el.volume = audioUnlocked ? 1 : 0;
      el.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      el.pause();
      el.currentTime = 0;
      el.muted = true;
      setPlaying(false);
    }
  }, [hovering, audioUnlocked]);

  return (
    <div
      className="relative overflow-hidden"
      style={{ background: '#0a0710' }}
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
    >
      <video
        ref={v}
        src="/arts/videos/sculpture.mp4"
        poster="/arts/sculpture-poster.jpg"
        loop
        playsInline
        muted
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ userSelect: 'none' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: 'inset 0 0 60px rgba(0,0,0,0.5)' }}
      />
      <div
        className="pointer-events-none absolute bottom-2 right-2 font-mono text-[9px] tracking-[0.32em] text-[#f0e8dc]/45"
        style={{
          opacity: hovering ? 0 : 0.6,
          transition: 'opacity 600ms ease-out',
        }}
      >
        HOVER
      </div>
      <div
        className="pointer-events-none absolute top-2 right-2"
        style={{
          opacity: playing ? 1 : 0,
          transition: 'opacity 500ms ease-out',
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{
            background: audioUnlocked ? '#caa5ff' : '#f0e8dc',
            boxShadow: `0 0 8px ${audioUnlocked ? '#caa5ff' : 'rgba(240,232,220,0.6)'}`,
            animation: 'arts_blink 2.4s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}

/* ===========================================================================
   AUDIO UNLOCK — first user gesture (anywhere on document) unlocks audio.
=========================================================================== */

function useAudioUnlock() {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    if (unlocked) return;
    const onGesture = () => setUnlocked(true);
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [unlocked]);
  return unlocked;
}
