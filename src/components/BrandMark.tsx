import type { ReactNode } from 'react';

/**
 * Italic-serif "Jessy" wordmark — the single source of truth for the
 * brand block in the top-left corner of every page (V2 / Arts / Projects).
 * If you change the typography here, every page updates atomically.
 *
 * `subtitle` is the small mono-tracked label below the wordmark (e.g.
 * "DIGITAL SELF" on home, "ARTS" on the gallery, "PORTFOLIO" on /projects).
 * Pass `null` to omit it.
 *
 * `size` controls the wordmark height — pages with denser HUD chrome use
 * `sm`, the home page uses the default `md`.
 */
export function BrandMark({
  subtitle,
  size = 'md',
  showAccent = true,
}: {
  subtitle?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** the small tri-color hairline beneath — drop on pages that don't need it */
  showAccent?: boolean;
}) {
  const sizePx = size === 'sm' ? 24 : size === 'lg' ? 36 : 30;
  return (
    <div className="pointer-events-none">
      <span
        style={{
          fontFamily:
            'ui-serif, "Cormorant Garamond", Garamond, "Times New Roman", serif',
          fontStyle: 'italic',
          fontWeight: 400,
          fontSize: sizePx,
          letterSpacing: '0.01em',
          color: '#f4ecdc',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        Jessy
      </span>
      {subtitle && (
        <div className="mt-2 font-mono text-[9.5px] tracking-[0.45em] text-[#f4ecdc]/45">
          {subtitle}
        </div>
      )}
      {showAccent && (
        <div
          className="mt-2 h-px w-12"
          style={{
            background:
              'linear-gradient(90deg, rgba(245,184,214,0.7), rgba(200,165,255,0.45) 50%, rgba(126,197,255,0.55) 90%, transparent)',
          }}
        />
      )}
    </div>
  );
}
