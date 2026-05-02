import { useEffect, useRef } from 'react';

type Rect = { x: number; y: number; w: number; h: number };

type Props = {
  /** Pixel-space rectangle (viewport coords) where streaks should not
   *  draw — used to keep the chat panel clean. */
  excludeRect?: Rect | null;
  /** Bounding rect of the avatar wrapper. Streaks fade out smoothly as
   *  they approach the figure (soft elliptical halo, no hard edge) so
   *  the head reads as a clean silhouette against the backdrop. */
  avatarRect?: Rect | null;
};

/**
 * Full-screen scan-line backdrop. Two clusters of streamlines hugging
 * the left and right edges (bimodal spawn), thinning out across the
 * middle so the avatar stands out. Hue is x-driven: pink/magenta on
 * the left, blue on the right; alpha is boosted at the edges and
 * gentled near center so the visual weight follows the reference.
 */
export default function LineBackdrop({ excludeRect, avatarRect }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const excludeRef = useRef<Rect | null>(excludeRect ?? null);
  const avatarRef = useRef<Rect | null>(avatarRect ?? null);
  useEffect(() => {
    excludeRef.current = excludeRect ?? null;
  }, [excludeRect]);
  useEffect(() => {
    avatarRef.current = avatarRect ?? null;
  }, [avatarRect]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;
    const setSize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      cv.style.width = '100%';
      cv.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();

    // Three-layer gaussian — inner (tight, bright, long), mid, outer
    // (wide, dim, short). Gives the fine multi-depth swarm she's after.
    const gaussN = (): number => {
      const u1 = Math.random() || 1e-6;
      const u2 = Math.random();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    };

    type Layer = 'inner' | 'mid' | 'outer';
    type P = {
      x: number;
      y: number;
      speed: number;
      length: number;
      hue: number;
      alpha: number;
      layer: Layer;
    };
    const PARTICLES = 460;
    const respawn = (p: P) => {
      const r = Math.random();
      p.layer = r < 0.4 ? 'inner' : r < 0.72 ? 'mid' : 'outer';

      // Wider stddev so more particles reach the side-color zones.
      const stddev =
        p.layer === 'inner' ? 0.08 : p.layer === 'mid' ? 0.20 : 0.32;
      p.x = Math.max(0, Math.min(w, w / 2 + gaussN() * w * stddev));
      p.y = -20 - Math.random() * h * 0.5;

      // Original (shorter) lengths kept; speeds bumped for the
      // Matrix-rain feel.
      if (p.layer === 'inner') {
        p.length = 60 + Math.random() * 140;
        p.alpha = 0.18 + Math.random() * 0.36;
        p.speed = 0.70 + Math.random() * 2.1;
      } else if (p.layer === 'mid') {
        p.length = 35 + Math.random() * 110;
        p.alpha = 0.08 + Math.random() * 0.22;
        p.speed = 0.50 + Math.random() * 2.0;
      } else {
        p.length = 20 + Math.random() * 80;
        p.alpha = 0.04 + Math.random() * 0.14;
        p.speed = 0.35 + Math.random() * 1.9;
      }

      // Wider hue range so blue side reaches a deeper, more obviously
      // blue tone (cyan ≈ 195) instead of dimming into purple.
      const xRatio = p.x / w;
      p.hue = 335 - xRatio * 145 + (Math.random() - 0.5) * 12;
    };
    const particles: P[] = Array.from({ length: PARTICLES }, () => {
      const p: P = {
        x: 0,
        y: 0,
        speed: 0,
        length: 0,
        hue: 0,
        alpha: 0,
        layer: 'mid',
      };
      respawn(p);
      p.y = Math.random() * h;
      return p;
    });

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);

      ctx.fillStyle = 'rgba(4, 2, 12, 0.24)';
      ctx.fillRect(0, 0, w, h);

      // Vertical falloff from the avatar's head — streaks are brightest
      // when they pass near the head, dim well above/below.
      const headY = h * 0.30;
      const yFalloffSigma2 = (h * 0.22) * (h * 0.22);

      // Smooth chat-panel proximity fade: streaks fade out gradually
      // as their midpoint approaches the chat from above, instead of
      // being hard-clipped. Outside the chat's horizontal extent there
      // is no fade — streaks to the sides keep flowing.
      const ex = excludeRef.current;
      const av = avatarRef.current;
      const FADE_TOP = 110;
      const FADE_BOT = 60;
      const smoothstep = (t: number): number =>
        t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);

      // Avatar exclusion: model the figure as an ellipse centered on the
      // face (shifted up because the video uses objectPosition '50% 22%').
      // Streaks inside the inner ellipse are killed, fade smoothly to
      // full opacity by the outer one.
      let avCx = 0,
        avCy = 0,
        avRx = 0,
        avRy = 0;
      const AV_INNER = 0.92;
      const AV_OUTER = 1.18;
      if (av && av.w > 0 && av.h > 0) {
        avCx = av.x + av.w / 2;
        avCy = av.y + av.h / 2 - av.h * 0.08;
        avRx = av.w * 0.50;
        avRy = av.h * 0.48;
      }

      ctx.lineWidth = 0.6;
      for (const p of particles) {
        const dy = p.y - headY;
        const yFalloff = Math.exp(-(dy * dy) / yFalloffSigma2);
        let a = p.alpha * (0.20 + 0.80 * yFalloff);

        if (ex && p.x >= ex.x && p.x <= ex.x + ex.w) {
          const mid = p.y - p.length * 0.5;
          const top = ex.y;
          const bot = ex.y + ex.h;
          if (mid >= top && mid <= bot) {
            a = 0;
          } else if (mid < top && mid > top - FADE_TOP) {
            a *= smoothstep((top - mid) / FADE_TOP);
          } else if (mid > bot && mid < bot + FADE_BOT) {
            a *= smoothstep((mid - bot) / FADE_BOT);
          }
        }

        if (a > 0 && avRx > 0) {
          const mid = p.y - p.length * 0.5;
          const ndx = (p.x - avCx) / avRx;
          const ndy = (mid - avCy) / avRy;
          const d = Math.sqrt(ndx * ndx + ndy * ndy);
          if (d < AV_OUTER) {
            const t = (d - AV_INNER) / (AV_OUTER - AV_INNER);
            a *= smoothstep(t);
          }
        }

        if (a <= 0) {
          p.y += p.speed;
          if (p.y > h + p.length) respawn(p);
          continue;
        }

        const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y - p.length);
        grad.addColorStop(0, `hsla(${p.hue}, 92%, 78%, ${a})`);
        grad.addColorStop(0.45, `hsla(${p.hue}, 88%, 70%, ${a * 0.55})`);
        grad.addColorStop(1, `hsla(${p.hue}, 88%, 70%, 0)`);
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y - p.length);
        ctx.stroke();
        p.y += p.speed;
        if (p.y > h + p.length) respawn(p);
      }
    };
    draw();

    window.addEventListener('resize', setSize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', setSize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ background: '#04020c' }}
    />
  );
}
