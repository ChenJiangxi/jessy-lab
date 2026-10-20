/**
 * Turns the paths and URLs Jessy writes in a reply into real links.
 *
 * Visitors keep asking "where are the projects / give me the link", and the
 * agent answers "去 /projects 看看" — which used to render as dead text.
 * `parseLinks` splits a reply into plain text and link segments; the chat
 * bubble renders the links inline and repeats them as tap-sized chips.
 * `speakLinks` rewrites the same text for TTS so the voice says "作品页"
 * instead of spelling out a path.
 *
 * No regex lookbehind on purpose: Safari < 16.4 (older iOS WeChat) throws
 * on it at parse time and would take the whole bundle down.
 */

import { PROJECTS } from '../data/projects';
import { ART_ANCHORS } from '../data/arts';

export const RESEARCH_URL = 'https://chenjiangxi.github.io/home-page/';

export type LinkInfo = {
  href: string;
  /** Short name for the chip under the bubble. */
  label: string;
  external: boolean;
};

export type Segment = string | { text: string; link: LinkInfo };

const PAGES: Record<string, { label: string; spoken: string }> = {
  '/projects': { label: '作品集', spoken: '作品页' },
  '/arts': { label: '画作', spoken: '画作页' },
  '/contact': { label: '联系方式', spoken: '联系页' },
  '/research': { label: '学术主页', spoken: '学术主页' },
};

const STOP = `\\s<>"'，。！？、；：）】」』\\])`;
const TOKEN = new RegExp(
  [
    // 1 label, 2 target — markdown link the model sometimes writes anyway
    String.raw`\[([^\]\n]{1,60})\]\(([^)\s]+)\)`,
    // 3 email
    String.raw`([A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)`,
    // 4 full URL
    `(https?:\\/\\/[^${STOP}]+)`,
    // 5 bare domain, e.g. xuanji.life or github.com/ChenJiangxi/x
    `((?:[a-z0-9-]+\\.)+(?:net|life|cn|com|io|dev|cc|app|org|ai)(?:\\/[^${STOP}]*)?)(?![a-z0-9-])`,
    // 6 site path, e.g. /projects or /arts#fire
    String.raw`(\/(?:projects|arts|contact|research)(?:#[a-z0-9-]+)?)(?![A-Za-z0-9_\/-])`,
  ].join('|'),
  'gi',
);
const WORD_BEFORE = /[A-Za-z0-9_.\/@-]/;
const TRAILING_PUNCT = /[.,;:!?]+$/;

function stripHost(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
}

function projectByUrl(url: string) {
  const key = stripHost(url).toLowerCase();
  return PROJECTS.find((p) => p.url && stripHost(p.url).toLowerCase() === key);
}

function resolvePath(raw: string): LinkInfo | null {
  const [path, hash] = raw.split('#') as [string, string | undefined];
  const page = PAGES[path.toLowerCase()];
  if (!page) return null;
  if (path.toLowerCase() === '/research') {
    return { href: RESEARCH_URL, label: page.label, external: true };
  }
  let label = page.label;
  if (hash && path.toLowerCase() === '/projects') {
    const p = PROJECTS.find((x) => x.id === hash.toLowerCase());
    if (p) label = p.chineseName ? `${p.chineseName} ${p.name}` : p.name;
  } else if (hash && path.toLowerCase() === '/arts') {
    label = ART_ANCHORS[hash.toLowerCase()] ?? label;
  }
  return { href: hash ? `${path}#${hash}` : path, label, external: false };
}

/** Resolve a path, URL, bare domain or email into a link, or null. */
export function resolveLink(raw: string): LinkInfo | null {
  if (raw.startsWith('/')) return resolvePath(raw);
  if (raw.startsWith('mailto:')) return { href: raw, label: raw.slice(7), external: true };
  if (/^[^\s@/]+@[^\s@/]+\.[a-z]+$/i.test(raw)) {
    return { href: `mailto:${raw}`, label: raw, external: true };
  }
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\./, '');
  if (host === 'jessylab.cc') {
    const internal = resolvePath(parsed.pathname + (parsed.hash || ''));
    if (internal) return internal;
  }
  const p = projectByUrl(url);
  const label = p ? (p.chineseName ? `${p.chineseName} ${p.name}` : p.name) : stripHost(url);
  return { href: url, label, external: true };
}

export function parseLinks(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(text))) {
    const start = m.index;
    let raw = m[0];
    let display = raw;
    let link: LinkInfo | null = null;

    if (m[1] !== undefined) {
      link = resolveLink(m[2]!);
      display = m[1];
      if (!link) {
        // unknown target — keep the label, drop the markdown noise
        out.push(text.slice(last, start), m[1]);
        last = start + raw.length;
        continue;
      }
    } else {
      const isBare = m[5] !== undefined || m[6] !== undefined;
      if (isBare && start > 0 && WORD_BEFORE.test(text[start - 1]!)) {
        TOKEN.lastIndex = start + 1;
        continue;
      }
      const trail = raw.match(TRAILING_PUNCT)?.[0] ?? '';
      if (trail) {
        raw = raw.slice(0, -trail.length);
        display = raw;
        TOKEN.lastIndex = start + raw.length;
      }
      link = resolveLink(raw);
    }

    if (!link) continue;
    if (start > last) out.push(text.slice(last, start));
    out.push({ text: display, link });
    last = start + (m[1] !== undefined ? m[0].length : raw.length);
  }
  if (last < text.length) out.push(text.slice(last));
  return out.filter((s) => s !== '');
}

/** Comparison key: "https://xuanji.life/" and "xuanji.life" are one link. */
export function linkKey(raw: string): string {
  const href = resolveLink(raw)?.href ?? raw;
  return stripHost(href).toLowerCase();
}

/** Distinct links in a reply, in order of appearance. */
export function linksIn(text: string, extra: string[] = []): LinkInfo[] {
  const seen = new Set<string>();
  const out: LinkInfo[] = [];
  const add = (l: LinkInfo | null) => {
    if (!l) return;
    const key = stripHost(l.href).toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(l);
  };
  for (const s of parseLinks(text)) if (typeof s !== 'string') add(s.link);
  for (const raw of extra) add(resolveLink(raw));
  return out;
}

/** Text for TTS: site paths become spoken page names, URLs and emails drop out. */
export function speakLinks(text: string): string {
  return parseLinks(text)
    .map((s) => {
      if (typeof s === 'string') return s;
      if (!s.link.external) {
        const path = s.link.href.split('#')[0]!.toLowerCase();
        return PAGES[path]?.spoken ?? '';
      }
      if (s.link.href === RESEARCH_URL) return PAGES['/research']!.spoken;
      return '';
    })
    .join('');
}
