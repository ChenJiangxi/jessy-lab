import { Fragment, useMemo, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { linksIn, parseLinks, type LinkInfo } from '../lib/links';

const INLINE =
  'text-[#c8a5ff] underline decoration-[#c8a5ff]/45 underline-offset-[3px] hover:text-[#e2ccff] hover:decoration-[#e2ccff] transition-colors';

function Anchor({
  link,
  className,
  style,
  children,
}: {
  link: LinkInfo;
  className: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
        {children}
      </a>
    );
  }
  return (
    <Link to={link.href} className={className} style={style}>
      {children}
    </Link>
  );
}

const CHIP_STYLE: CSSProperties = {
  background: 'linear-gradient(135deg, rgba(200,165,255,0.14), rgba(126,197,255,0.08))',
  border: '1px solid rgba(200,165,255,0.38)',
};

/** Reply text with paths / URLs / emails rendered as links. The model
 *  sometimes slips in **bold** despite the prompt; a person texting
 *  wouldn't, so the markers are dropped. */
export function ChatText({ text }: { text: string }) {
  const segments = useMemo(() => parseLinks(text.replace(/\*\*(.+?)\*\*/g, '$1')), [text]);
  return (
    <>
      {segments.map((s, i) =>
        typeof s === 'string' ? (
          <Fragment key={i}>{s}</Fragment>
        ) : (
          <Anchor key={i} link={s.link} className={INLINE}>
            {s.text}
          </Anchor>
        ),
      )}
    </>
  );
}

/**
 * The same links again as tap-sized chips under the bubble — an inline
 * "/arts" is a small target on a phone, and most visitors are on one.
 */
export function LinkChips({ text, extra }: { text: string; extra?: string[] }) {
  const links = useMemo(() => linksIn(text, extra).slice(0, 4), [text, extra]);
  if (links.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5 pl-0.5">
      {links.map((l) => (
        <Anchor
          key={l.href}
          link={l}
          className="inline-flex items-center gap-1.5 min-h-[30px] px-3 py-1 rounded-full font-mono text-[10.5px] tracking-[0.12em] text-[#e2ccff]/90 hover:text-white transition-colors pointer-events-auto"
          style={CHIP_STYLE}
        >
          <span>{l.label}</span>
          <span aria-hidden className="text-[#c8a5ff]">
            {l.external ? '↗' : '→'}
          </span>
        </Anchor>
      ))}
    </div>
  );
}
