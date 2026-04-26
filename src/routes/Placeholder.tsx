import { Link } from 'react-router-dom';

type LinkItem = {
  label: string;
  url: string;
  description?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  links?: LinkItem[];
};

/**
 * Stub page for /projects, /research, /contact. Same dark chrome as
 * V2 so navigating from the home nav doesn't feel like a context switch.
 * If `links` is provided, renders a list of clickable cards.
 */
export default function Placeholder({ title, subtitle, links }: Props) {
  return (
    <div className="fixed inset-0 bg-[#04020c] text-[#f0e8dc] flex flex-col items-center justify-center px-6 select-none overflow-y-auto py-12">
      <div className="font-mono text-[10px] tracking-[0.4em] text-[#f0e8dc]/45 mb-4">
        JESSY · {title.toUpperCase()}
      </div>
      <h1
        className="font-serif italic text-[#f0e8dc]/90"
        style={{ fontSize: 'clamp(40px, 7vw, 96px)', letterSpacing: '-0.02em' }}
      >
        {title}
      </h1>
      {subtitle && (
        <div className="mt-4 font-mono text-[11px] tracking-[0.3em] text-[#f0e8dc]/45 uppercase text-center max-w-xl">
          {subtitle}
        </div>
      )}

      {links && links.length > 0 && (
        <div className="mt-10 w-full max-w-xl flex flex-col gap-3">
          {links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-4 rounded-xl px-5 py-4 border border-[#f0e8dc]/15 hover:border-[#a0c0ff]/55 transition-colors"
              style={{
                background: 'rgba(8, 4, 20, 0.55)',
              }}
            >
              <div className="min-w-0">
                <div className="font-sans text-[15px] text-[#f0e8dc]/90 group-hover:text-[#f0e8dc]">
                  {l.label}
                </div>
                {l.description && (
                  <div className="mt-1 font-mono text-[10px] tracking-[0.15em] text-[#f0e8dc]/45">
                    {l.description}
                  </div>
                )}
                <div className="mt-1 font-mono text-[10px] tracking-[0.05em] text-[#7ab8ff]/60 truncate">
                  {l.url.replace(/^https?:\/\//, '')}
                </div>
              </div>
              <span className="shrink-0 text-[#f0e8dc]/45 group-hover:text-[#a0c0ff] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </span>
            </a>
          ))}
        </div>
      )}

      <Link
        to="/"
        className="mt-12 font-mono text-[10px] tracking-[0.35em] uppercase text-[#7ab8ff]/70 hover:text-[#7ab8ff] border border-[#7ab8ff]/30 hover:border-[#7ab8ff]/70 rounded-full px-5 py-2 transition-colors"
      >
        ← BACK TO JESSY
      </Link>
    </div>
  );
}
