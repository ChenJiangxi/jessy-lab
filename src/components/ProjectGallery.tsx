import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { SiteNavigation } from './SiteNavigation';
import './ProjectGallery.css';

export type GalleryWork = {
  id: string; index: string; en: string; zh: string; tagline: string; body: string; tech?: string;
  url: string; urlLabel: string; color: string; aspect: number; phone: boolean; preview?: string; visual: ReactNode;
};
export type GalleryChapter = { num: string; zh: string; en: string; rationale: string; ids: string[] };
type Drag = { pointerId: number; startX: number; left: number; moved: boolean };
const ROOM_NAMES: Record<string, string> = { I: '上线', II: '命理', III: '玩具', IV: '雨夜', V: '空间' };

export function ProjectGallery({ works, chapters }: { works: GalleryWork[]; chapters: GalleryChapter[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const clickTimer = useRef(0);
  const nextBehavior = useRef<ScrollBehavior>('instant');
  const [current, setCurrent] = useState({ chapter: '', work: '', stop: 0 });
  const location = useLocation();
  const navigate = useNavigate();
  const getWork = (id: string) => works.find(work => work.id === id)!;
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stops = () => Array.from(rootRef.current!.querySelectorAll<HTMLElement>('[data-stop]'));
  const leftFor = (node: HTMLElement) => {
    const root = rootRef.current!;
    const rect = node.getBoundingClientRect();
    const x = root.scrollLeft + rect.left - root.getBoundingClientRect().left + rect.width / 2 - root.clientWidth / 2;
    return Math.max(0, Math.min(root.scrollWidth - root.clientWidth, x));
  };
  const alignTo = (node: HTMLElement, behavior: ScrollBehavior, resetPanel = false) => {
    if (resetPanel) node.scrollTop = 0;
    rootRef.current!.scrollTo({ left: leftFor(node), top: 0, behavior });
  };

  // The scroll container itself moves horizontally. No translated track or
  // vertical-to-horizontal mapping is involved.
  useEffect(() => {
    const root = rootRef.current!;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-stop]'));
    let frame = 0;
    let lastToken = '';
    const update = () => {
      frame = 0;
      const viewport = root.getBoundingClientRect();
      const center = viewport.left + root.clientWidth / 2;
      let selected = nodes[0];
      let selectedIndex = 0;
      let nearest = Infinity;
      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - center);
        if (distance < nearest) { nearest = distance; selected = node; selectedIndex = index; }
        node.dataset.visible = String(rect.right > viewport.left && rect.left < viewport.right);
      });
      if (selected) {
        root.style.setProperty('--gallery-color', selected.dataset.color ?? 'rgba(200,180,255,.6)');
        const token = selected.dataset.anchor ?? '';
        if (token !== lastToken) {
          lastToken = token;
          setCurrent({ chapter: selected.dataset.chapter ?? '', work: selected.dataset.work ?? '', stop: selectedIndex });
        }
      }
      const max = root.scrollWidth - root.clientWidth;
      root.style.setProperty('--gallery-progress', String(max > 0 ? root.scrollLeft / max : 0));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    root.addEventListener('scroll', schedule, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      root.removeEventListener('scroll', schedule);
    };
  }, [works, chapters]);

  useEffect(() => {
    let disposed = false;
    let userMoved = false;
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { /* malformed hash opens the cover */ }
    const behavior = nextBehavior.current;
    nextBehavior.current = 'instant';
    const markInteraction = () => { userMoved = true; };
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    events.forEach(event => window.addEventListener(event, markInteraction, { passive: true }));
    const align = (motion: ScrollBehavior) => {
      if (disposed || userMoved) return;
      const root = rootRef.current!;
      const target = Array.from(root.querySelectorAll<HTMLElement>('[data-anchor]')).find(node => node.dataset.anchor === id);
      if (target) alignTo(target, motion, true);
      else root.scrollTo({ left: 0, top: 0, behavior: motion });
    };
    const frame = requestAnimationFrame(() => align(behavior));
    if (id && document.fonts.status !== 'loaded') void document.fonts.ready.then(() => align('instant'));
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      events.forEach(event => window.removeEventListener(event, markInteraction));
    };
    // Route keys handle repeated selections; hash handles same-document links.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, location.hash]);

  useEffect(() => () => window.clearTimeout(clickTimer.current), []);

  const go = (id: string) => {
    dialogRef.current?.close();
    nextBehavior.current = reducedMotion() ? 'instant' : 'smooth';
    navigate({ pathname: '/projects', hash: id ? `#${id}` : '' }, { replace: true });
  };
  const nearestIndex = (left: number) => {
    let index = 0, distance = Infinity;
    stops().forEach((node, i) => {
      const delta = Math.abs(leftFor(node) - left);
      if (delta < distance) { distance = delta; index = i; }
    });
    return index;
  };
  const step = (direction: number) => {
    const nodes = stops();
    const index = nearestIndex(rootRef.current!.scrollLeft);
    const target = nodes[Math.max(0, Math.min(nodes.length - 1, index + direction))];
    if (target) go(target.dataset.anchor ?? '');
  };
  const endDrag = (event: ReactPointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const root = rootRef.current!;
    const finalLeft = root.scrollLeft;
    dragRef.current = null;
    root.classList.remove('gallery-dragging');
    if (root.hasPointerCapture(event.pointerId)) root.releasePointerCapture(event.pointerId);
    if (drag.moved) {
      suppressClick.current = true;
      window.clearTimeout(clickTimer.current);
      clickTimer.current = window.setTimeout(() => { suppressClick.current = false; }, 80);
      if (!cancelled) {
        const delta = finalLeft - drag.left;
        const initial = nearestIndex(drag.left);
        let target = nearestIndex(finalLeft);
        if (target === initial && Math.abs(delta) > Math.min(120, root.clientWidth * .15)) target += Math.sign(delta);
        const nodes = stops();
        const node = nodes[Math.max(0, Math.min(nodes.length - 1, target))];
        if (node) alignTo(node, reducedMotion() ? 'instant' : 'smooth');
      }
    }
  };
  return (
    <div ref={rootRef} className="project-gallery gallery-horizontal" role="region" aria-label="作品展厅，左右滑动浏览" tabIndex={0}
      onDragStart={event => event.preventDefault()}
      onPointerDown={event => {
        if (event.pointerType !== 'mouse' || event.button !== 0 || dialogRef.current?.open) return;
        const target = event.target as HTMLElement;
        if (target.closest('a, button, input, textarea, select, [contenteditable="true"]')) return;
        const panel = target.closest<HTMLElement>('.gallery-exhibit, .gallery-intro');
        if (panel && event.clientX > panel.getBoundingClientRect().right - 16) return;
        if (event.clientY > rootRef.current!.clientHeight - 16) return;
        event.preventDefault();
        rootRef.current!.focus({ preventScroll: true });
        dragRef.current = { pointerId: event.pointerId, startX: event.clientX, left: rootRef.current!.scrollLeft, moved: false };
        rootRef.current!.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId) return;
        const dx = event.clientX - drag.startX;
        if (!drag.moved && Math.abs(dx) < 7) return;
        drag.moved = true;
        rootRef.current!.classList.add('gallery-dragging');
        rootRef.current!.scrollLeft = drag.left - dx;
      }}
      onPointerUp={event => endDrag(event)} onPointerCancel={event => endDrag(event, true)}
      onLostPointerCapture={event => { if (dragRef.current) endDrag(event, true); }}
      onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}
      onFocusCapture={event => {
        if (dialogRef.current?.open) return;
        const work = (event.target as HTMLElement).closest<HTMLElement>('[data-work]');
        if (!work) return;
        const rect = work.getBoundingClientRect();
        if (rect.right < 0 || rect.left > rootRef.current!.clientWidth) alignTo(work, 'instant');
      }}
      onKeyDown={event => {
        if (event.altKey || event.metaKey || event.ctrlKey) return;
        if (dialogRef.current?.open || (event.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1); }
        if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); go(event.key === 'Home' ? 'cover' : 'exit'); }
      }}>
      <a className="gallery-skip" href="#room-I">跳到作品</a>
      <div className="gallery-ambient" aria-hidden="true" />
      <header className="gallery-header">
        <Link className="gallery-brand" to="/" aria-label="Jessy Lab 首页"><BrandMark subtitle={null} size="md" showAccent={false} /><span>LAB</span></Link>
        <SiteNavigation active="projects" />
      </header>
      <main className="gallery-hall" id="gallery-main">
        <div className="gallery-stage">
          <div className="gallery-floor" aria-hidden="true" />
          <div className="gallery-track">
            <section className="gallery-intro" id="gallery-cover" data-anchor="cover" data-stop data-color="rgba(185,157,217,.65)">
              <div className="gallery-intro-copy">
                <div className="gallery-eyebrow"><span className="gallery-live-dot" />JESSY'S WORKS <span>2024 — 2026</span></div>
                <h1>Made of<br /><em>curiosity.</em><span className="gallery-title-dot">*</span></h1>
                <p className="gallery-intro-zh">把好奇心，做成能打开的东西。</p>
                <p className="gallery-intro-note">有陪人走一段路的产品，也有只为一个下午的小玩具。<br className="gallery-desktop-break" />十件作品，五个房间，随意逛逛。</p>
                <div className="gallery-intro-actions"><button className="gallery-primary" onClick={() => go('xuanji')}>从这里开始 <span>↗</span></button><button className="gallery-text-button" onClick={() => dialogRef.current?.showModal()}>作品目录 <span>10</span></button></div>
                <div className="gallery-scroll-hint"><span>↔</span><span className="gallery-hint-desktop">左右滑动或拖动，逛逛作品</span><span className="gallery-hint-mobile">左右滑动，逛逛作品</span></div>
              </div>
              <div className="gallery-cover-art" aria-label="璇玑、断联和寺的作品预览">
                <div className="gallery-cover-orbit" aria-hidden="true" />
                <div className="gallery-cover-web"><div className="gallery-cover-caption"><span>01 / 璇玑</span><span>WEB APP ↗</span></div>{getWork('xuanji').visual}</div>
                <div className="gallery-cover-temple"><img src="/projects/temple.webp" alt="寺：日光穿过经文的建筑实验" /><span>10 / 光与空间</span></div>
                <div className="gallery-cover-phone"><img className="gallery-cover-screen" src="/projects/duanlian-main.webp" alt="断联 iPhone App" /><img className="gallery-cover-bezel" src="/devices/iphone-silver.webp" alt="" /></div>
                <span className="gallery-cover-note">a little bit of everything.</span>
                <span className="gallery-cover-star" aria-hidden="true">✳</span>
              </div>
              <div className="gallery-cover-footer"><span>INDEPENDENT PRODUCTS & EXPERIMENTS</span><span>10 WORKS / 05 ROOMS</span></div>
            </section>
            {chapters.map(chapter => (
              <section className="gallery-chapter" key={chapter.num} aria-label={ROOM_NAMES[chapter.num]}>
                <div className="gallery-chapter-wall" id={`gallery-room-${chapter.num}`} data-anchor={`room-${chapter.num}`} data-stop data-chapter={chapter.num} data-color={getWork(chapter.ids[0]!).color}>
                  <span className="gallery-room-number" aria-hidden="true">{chapter.num}</span>
                  <div className="gallery-chapter-copy"><div className="gallery-eyebrow">ROOM {chapter.num} <span>{chapter.ids.length} WORKS</span></div><h2>{chapter.zh.replaceAll(' ', '')}</h2><div className="gallery-chapter-en">{chapter.en}</div><p>{chapter.rationale}</p><span className="gallery-chapter-line" /></div>
                </div>
                {chapter.num === 'III' ? <div className="gallery-toy-room"><div className="gallery-toy-tape" aria-hidden="true"><span>JUST FOR FUN ✳ WEEKEND TOYS ✳ JUST FOR FUN ✳ WEEKEND TOYS ✳</span></div>{chapter.ids.map(id => <ToySticker key={id} work={getWork(id)} chapter={chapter.num} />)}</div>
                  : chapter.ids.map(id => <Exhibit key={id} work={getWork(id)} chapter={chapter.num} />)}
              </section>
            ))}
            <section className="gallery-exit" id="gallery-exit" data-anchor="exit" data-stop data-color="rgba(240,167,199,.7)">
              <div className="gallery-eyebrow">END OF THE WALK</div><h2>Still<br /><em>making things.</em></h2><p>这些是已经做出来的。<br />其他的，还在脑子里。</p><div className="gallery-exit-actions"><Link className="gallery-primary" to="/">回去和 Jessy 聊聊 <span>↗</span></Link><button className="gallery-text-button" onClick={() => dialogRef.current?.showModal()}>再看看作品 <span>↺</span></button></div><div className="gallery-exit-signature">Jessy</div>
            </section>
          </div>
        </div>
      </main>
      <nav className="gallery-controls" aria-label="展厅导航">
        <button className="gallery-directory-toggle" onClick={() => dialogRef.current?.showModal()} aria-label="打开全部作品目录"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><rect x="1" y="1" width="5" height="5" rx=".6" /><rect x="10" y="1" width="5" height="5" rx=".6" /><rect x="1" y="10" width="5" height="5" rx=".6" /><rect x="10" y="10" width="5" height="5" rx=".6" /></svg><span>目录</span></button>
        <span className="gallery-controls-divider" />
        <div className="gallery-chapter-nav">{chapters.map(chapter => <button key={chapter.num} onClick={() => go(`room-${chapter.num}`)} aria-current={current.chapter === chapter.num ? 'step' : undefined}><span>{chapter.num}</span>{ROOM_NAMES[chapter.num]}</button>)}</div>
        <span className="gallery-controls-divider gallery-controls-desktop" />
        <div className="gallery-stepper"><span className="gallery-work-counter">{current.work ? String(works.findIndex(work => work.id === current.work) + 1).padStart(2, '0') : '—'} <span>/ 10</span></span><button onClick={() => step(-1)} disabled={current.stop === 0} aria-label="上一站">←</button><button onClick={() => step(1)} disabled={current.stop === chapters.length + works.length + 1} aria-label="下一站">→</button></div>
      </nav>
      <dialog ref={dialogRef} className="gallery-directory" aria-labelledby="gallery-directory-title" onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}>
        <div className="gallery-directory-heading"><div><div className="gallery-eyebrow">THE DIRECTORY / 10 WORKS</div><h2 id="gallery-directory-title">挑一件，逛逛。</h2></div><button className="gallery-directory-close" onClick={() => dialogRef.current?.close()} aria-label="关闭作品目录">✕</button></div>
        <div className="gallery-directory-grid">{works.map(work => <button key={work.id} onClick={() => go(work.id)} className="gallery-directory-card"><div className={`gallery-directory-image ${work.phone ? 'gallery-directory-image--phone' : ''}`}>{work.preview ? <img src={work.preview} alt="" loading="lazy" /> : <span className="gallery-rain-thumbnail">雨夜念白</span>}<span className="gallery-directory-index">{work.index}</span><span className="gallery-directory-open" aria-hidden="true">↗</span></div><span className="gallery-directory-name">{work.en}<span>{work.zh.replaceAll(' ', '')}</span></span></button>)}</div>
      </dialog>
    </div>
  );
}

function Exhibit({ work, chapter }: { work: GalleryWork; chapter: string }) {
  const style = { '--work-color': work.color, '--visual-ratio': work.aspect } as CSSProperties;
  return <article className={`gallery-exhibit ${work.phone ? 'gallery-exhibit--phone' : ''} ${work.id === 'temple' ? 'gallery-exhibit--temple' : ''}`} id={`gallery-work-${work.id}`} data-anchor={work.id} data-stop data-work={work.id} data-chapter={chapter} data-color={work.color} style={style}>
    <div className="gallery-exhibit-light" aria-hidden="true" />
    <div className="gallery-wall-name" aria-hidden="true">{work.en}</div>
    <div className="gallery-exhibit-visual">{work.visual}</div>
    <div className="gallery-placard"><div className="gallery-work-meta"><span><i />{work.index}</span><span>{work.phone ? 'APP & EXPERIENCE' : 'WEB & EXPERIMENT'}</span></div><h3>{work.en}</h3><div className="gallery-work-zh">{work.zh.replaceAll(' ', '')}</div><p className="gallery-work-tagline">{work.tagline}</p><p className="gallery-work-body">{work.body}</p>{work.tech && <p className="gallery-work-tech">{work.tech}</p>}<a className="gallery-open-work" href={work.url} target="_blank" rel="noopener noreferrer">打开作品 <span aria-hidden="true">↗</span><span>{work.urlLabel}</span></a></div>
  </article>;
}

function ToySticker({ work, chapter }: { work: GalleryWork; chapter: string }) {
  return <article className={`gallery-sticker gallery-sticker--${work.id}`} id={`gallery-work-${work.id}`} data-anchor={work.id} data-stop data-work={work.id} data-chapter={chapter} data-color={work.color} style={{ '--work-color': work.color } as CSSProperties}><span className="gallery-sticker-tape" aria-hidden="true" /><div className="gallery-sticker-meta"><span>{work.index}</span><span>BUILT FOR A SMILE ☺</span></div><div className="gallery-sticker-visual">{work.visual}</div><div className="gallery-sticker-title"><h3>{work.en}</h3><span aria-hidden="true">✳</span></div><div className="gallery-sticker-zh">{work.zh.replaceAll(' ', '')}</div><p>{work.body}</p><a href={work.url} target="_blank" rel="noopener noreferrer">{work.id === 'whack' ? '看看这个小玩具' : '进去锤两下'} <span aria-hidden="true">↗</span></a></article>;
}
