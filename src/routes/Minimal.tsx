import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Mail } from 'lucide-react';
import { PROJECTS } from '../data/projects';
import { PROFILE, PUBLICATIONS } from '../data/profile';

/**
 * /minimal — the side-door index of her works.
 *
 * Not a resume, not a bio. A quiet room with clear links so visitors who
 * landed from a post / LinkedIn / referral can quickly go to the project
 * they care about. The homepage (/) stays as the proper experience.
 */
export default function Minimal() {
  const fate = PROJECTS.filter((p) => p.kind === 'fate');
  const workshop = PROJECTS.filter((p) => p.kind === 'workshop' && p.id !== 'personal-site');

  return (
    <div className="min-h-screen bg-black text-[#e8dfce] font-zh">
      <div className="max-w-2xl mx-auto px-6 py-20 sm:py-28">
        {/* Back to fire */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.25em] uppercase text-[#c9b084]/60 hover:text-[#f0e7d9] focus-ring font-mono"
        >
          <ArrowLeft size={12} /> back to the flame
        </Link>

        {/* Header */}
        <header className="mt-16">
          <h1 className="font-display italic text-5xl sm:text-6xl leading-none text-[#f0e7d9]">
            {PROFILE.name}
          </h1>
          <p className="mt-3 text-[#c9b084]">
            {PROFILE.chineseName}
            <span className="text-[#c9b084]/40"> · </span>
            {PROFILE.selfChosenName}
            <span className="text-[#c9b084]/40"> · </span>
            {PROFILE.enNickname}
          </p>
          <p className="mt-7 text-[#c9b084] leading-loose max-w-prose text-[15px]">
            SJTU 工业工程博三，研究强化学习 / 图神经网络。
            业余在用 AI 做关于"东方命理"和"被看见"的东西——AuraMate 是主轴，旁边还有一些小作品。
          </p>
          <p className="mt-2 text-[#8a7a5f] leading-loose max-w-prose text-sm">
            想合作写信 →{' '}
            <a
              href={`mailto:${PROFILE.collabEmail}`}
              className="text-[#c9b084] hover:text-[#f0e7d9] underline decoration-dotted underline-offset-4"
            >
              {PROFILE.collabEmail}
            </a>
          </p>
        </header>

        {/* Fate Lab — main act */}
        <Section eyebrow="fate lab" title="命理实验室">
          <p className="text-[#8a7a5f] text-sm leading-loose mb-6">
            用工程的方式，做"被看见"这件事。
          </p>
          <ul className="space-y-5">
            {fate.map((p) => (
              <ProjectLink key={p.id} name={p.name} zh={p.chineseName} url={p.url} tagline={p.tagline} />
            ))}
          </ul>
        </Section>

        {/* Workshop */}
        <Section eyebrow="workshop" title="小东西">
          <p className="text-[#8a7a5f] text-sm leading-loose mb-6">
            研究之外的小作品，给自己做的。
          </p>
          <ul className="space-y-5">
            {workshop.map((p) => (
              <ProjectLink key={p.id} name={p.name} zh={p.chineseName} url={p.url} tagline={p.tagline} />
            ))}
          </ul>
        </Section>

        {/* Papers */}
        <Section eyebrow="publications" title="论文">
          <ul className="space-y-5">
            {PUBLICATIONS.map((p) => (
              <li key={p.id}>
                <a
                  href={p.links?.[0]?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group block"
                >
                  <div className="flex items-baseline gap-2 text-[11px] font-mono text-[#8a7a5f]">
                    <span>{p.year}</span>
                    <span>·</span>
                    <em className="not-italic">{p.venue}</em>
                    {p.highlight && (
                      <span className="ml-1 text-[#d8a06a]">· selected</span>
                    )}
                  </div>
                  <p className="mt-1 text-[15px] leading-snug text-[#e8dfce] group-hover:text-[#f0e7d9]">
                    {p.title}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </Section>

        {/* Contact */}
        <Section eyebrow="contact" title="">
          <div className="space-y-2 text-sm">
            <a
              href={`mailto:${PROFILE.collabEmail}`}
              className="flex items-center gap-2 text-[#c9b084] hover:text-[#f0e7d9] w-fit"
            >
              <Mail size={13} /> {PROFILE.collabEmail}
              <span className="text-[#8a7a5f] text-xs">· 创业合作</span>
            </a>
            <a
              href={`mailto:${PROFILE.email}`}
              className="flex items-center gap-2 text-[#c9b084] hover:text-[#f0e7d9] w-fit"
            >
              <Mail size={13} /> {PROFILE.email}
              <span className="text-[#8a7a5f] text-xs">· 学术</span>
            </a>
          </div>
        </Section>

        <footer className="mt-24 pt-8 border-t border-[#3a2a18]/60 text-xs text-[#6a4a26]">
          © {new Date().getFullYear()} {PROFILE.chineseName} · 本体在{' '}
          <Link to="/" className="underline decoration-dotted hover:text-[#c9b084]">
            /
          </Link>
        </footer>
      </div>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <div className="font-mono text-[10px] tracking-[0.35em] uppercase text-[#c9b084]/60 mb-2">
        {eyebrow}
      </div>
      {title && (
        <h2 className="font-display italic text-2xl text-[#f0e7d9] mb-6">{title}</h2>
      )}
      {children}
    </section>
  );
}

function ProjectLink({
  name,
  zh,
  url,
  tagline,
}: {
  name: string;
  zh?: string;
  url?: string;
  tagline: string;
}) {
  const Inner = (
    <>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-display italic text-xl text-[#f0e7d9] group-hover:text-white">
          {name}
        </span>
        {zh && <span className="text-[#8a7a5f] text-sm">{zh}</span>}
        {url && (
          <ArrowUpRight
            size={13}
            className="text-[#c9b084]/50 group-hover:text-[#d8a06a] ml-auto shrink-0"
          />
        )}
      </div>
      <p className="mt-1.5 text-[#c9b084] text-[14px] leading-relaxed">{tagline}</p>
      {url && (
        <div className="mt-1 text-[11px] font-mono text-[#6a4a26]">
          {url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        </div>
      )}
    </>
  );
  return (
    <li>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="group block">
          {Inner}
        </a>
      ) : (
        <div className="group">{Inner}</div>
      )}
    </li>
  );
}
