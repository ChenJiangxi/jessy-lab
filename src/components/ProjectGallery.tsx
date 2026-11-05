import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { SiteNavigation } from './SiteNavigation';
import './ProjectGallery.css';

export type GalleryWork = {
  id: string; index: string; en: string; zh: string; tagline: string; body: string; tech?: string;
  url: string; urlLabel: string; color: string; aspect: number; phone: boolean; preview?: string; visual: ReactNode;
};
export type GalleryChapter = { num: string; zh: string; en: string; rationale: string; ids: string[] };
type Stop = { chapter: string; color: string; node: HTMLElement };
const ROOM_NAMES: Record<string, string> = { I: '上线', II: '命理', III: '玩具', IV: '雨夜', V: '空间' };

export function ProjectGallery({ works, chapters }: { works: GalleryWork[]; chapters: GalleryChapter[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentChapter, setCurrentChapter] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const getWork = (id: string) => works.find(work => work.id === id)!;

  // Scrolling belongs to the document. This observer only updates the room
  // label and ambient color; it never changes height, position or scroll input.
  useEffect(() => {
    const root = rootRef.current!;
    const stops: Stop[] = Array.from(root.querySelectorAll<HTMLElement>('[data-stop]')).map(node => ({
      chapter: node.dataset.chapter ?? '',
      color: node.dataset.color ?? 'rgba(200,180,255,.6)', node,
    }));
    let frame = 0;
    let lastChapter = '';
    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      const center = height * .45;
      let selected = stops[0];
      let nearest = Infinity;
      for (const stop of stops) {
        const rect = stop.node.getBoundingClientRect();
        const distance = Math.abs(rect.top + Math.min(rect.height, height) / 2 - center);
        if (distance < nearest) { nearest = distance; selected = stop; }
        stop.node.dataset.visible = String(rect.bottom > 0 && rect.top < height);
      }
      if (selected) {
        root.style.setProperty('--gallery-color', selected.color);
        if (selected.chapter !== lastChapter) {
          lastChapter = selected.chapter;
          setCurrentChapter(lastChapter);
        }
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [works, chapters]);

  useEffect(() => {
    let disposed = false;
    let userMoved = false;
    let id = '';
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { /* malformed hash opens the cover */ }
    const markInteraction = () => { userMoved = true; };
    const events = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    events.forEach(event => window.addEventListener(event, markInteraction, { passive: true }));
    const align = () => {
      if (disposed || userMoved) return;
      const target = Array.from(rootRef.current!.querySelectorAll<HTMLElement>('[data-anchor]')).find(node => node.dataset.anchor === id);
      if (target) window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - 86, behavior: 'instant' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
    };
    const frame = requestAnimationFrame(align);
    // Do not reset an ongoing scroll when a font finishes loading.
    if (id) void document.fonts.ready.then(align);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      events.forEach(event => window.removeEventListener(event, markInteraction));
    };
  }, [location.key, location.hash]);

  const go = (id: string) => {
    dialogRef.current?.close();
    navigate({ pathname: '/projects', hash: id ? `#${id}` : '' }, { replace: true });
  };
  return (
    <div ref={rootRef} className="project-gallery gallery-linear">
      <a className="gallery-skip" href="#room-I">跳到作品</a>
      <div className="gallery-ambient" aria-hidden="true" />
      <header className="gallery-header">
        <Link className="gallery-brand" to="/" aria-label="Jessy Lab 首页"><BrandMark subtitle={null} size="md" showAccent={false} /><span>LAB</span></Link>
        <SiteNavigation active="projects" />
      </header>
      <main className="gallery-hall" id="gallery-main">
        <div className="gallery-stage">
          <div className="gallery-track">
            <section className="gallery-intro" id="cover" data-anchor="cover" data-stop data-color="rgba(185,157,217,.65)">
              <div className="gallery-intro-copy">
                <div className="gallery-eyebrow"><span className="gallery-live-dot" />JESSY'S WORKS <span>2024 — 2026</span></div>
                <h1>Made of<br /><em>curiosity.</em><span className="gallery-title-dot">*</span></h1>
                <p className="gallery-intro-zh">把好奇心，做成能打开的东西。</p>
                <p className="gallery-intro-note">有陪人走一段路的产品，也有只为一个下午的小玩具。<br className="gallery-desktop-break" />十件作品，五个房间，随意逛逛。</p>
                <div className="gallery-intro-actions"><button className="gallery-primary" onClick={() => go('xuanji')}>从这里开始 <span>↗</span></button><button className="gallery-text-button" onClick={() => dialogRef.current?.showModal()}>作品目录 <span>10</span></button></div>
                <div className="gallery-scroll-hint"><span>↓</span>向下，看看我的作品</div>
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
                <div className="gallery-chapter-wall" id={`room-${chapter.num}`} data-anchor={`room-${chapter.num}`} data-stop data-chapter={chapter.num} data-color={getWork(chapter.ids[0]!).color}>
                  <span className="gallery-room-number" aria-hidden="true">{chapter.num}</span>
                  <div className="gallery-chapter-copy"><div className="gallery-eyebrow">ROOM {chapter.num} <span>{chapter.ids.length} WORKS</span></div><h2>{chapter.zh.replaceAll(' ', '')}</h2><div className="gallery-chapter-en">{chapter.en}</div><p>{chapter.rationale}</p><span className="gallery-chapter-line" /></div>
                </div>
                {chapter.num === 'III' ? <div className="gallery-toy-room"><div className="gallery-toy-tape" aria-hidden="true"><span>JUST FOR FUN ✳ WEEKEND TOYS ✳ JUST FOR FUN ✳ WEEKEND TOYS ✳</span></div>{chapter.ids.map(id => <ToySticker key={id} work={getWork(id)} chapter={chapter.num} />)}</div>
                  : chapter.ids.map(id => <Exhibit key={id} work={getWork(id)} chapter={chapter.num} />)}
              </section>
            ))}
            <section className="gallery-exit" id="exit" data-anchor="exit" data-stop data-color="rgba(240,167,199,.7)">
              <div className="gallery-eyebrow">END OF THE WALK</div><h2>Still<br /><em>making things.</em></h2><p>这些是已经做出来的。<br />其他的，还在脑子里。</p><div className="gallery-exit-actions"><Link className="gallery-primary" to="/">回去和 Jessy 聊聊 <span>↗</span></Link><button className="gallery-text-button" onClick={() => dialogRef.current?.showModal()}>再看看作品 <span>↺</span></button></div><div className="gallery-exit-signature">Jessy</div>
            </section>
          </div>
        </div>
      </main>
      <nav className="gallery-controls" aria-label="展厅导航">
        <button className="gallery-directory-toggle" onClick={() => dialogRef.current?.showModal()} aria-label="打开全部作品目录"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><rect x="1" y="1" width="5" height="5" rx=".6" /><rect x="10" y="1" width="5" height="5" rx=".6" /><rect x="1" y="10" width="5" height="5" rx=".6" /><rect x="10" y="10" width="5" height="5" rx=".6" /></svg><span>目录</span></button>
        <span className="gallery-controls-divider" />
        <div className="gallery-chapter-nav">{chapters.map(chapter => <button key={chapter.num} onClick={() => go(`room-${chapter.num}`)} aria-current={currentChapter === chapter.num ? 'step' : undefined}><span>{chapter.num}</span>{ROOM_NAMES[chapter.num]}</button>)}</div>
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
  return <article className={`gallery-exhibit ${work.phone ? 'gallery-exhibit--phone' : ''} ${work.id === 'temple' ? 'gallery-exhibit--temple' : ''}`} id={work.id} data-anchor={work.id} data-stop data-work={work.id} data-chapter={chapter} data-color={work.color} style={style}>
    <div className="gallery-exhibit-light" aria-hidden="true" />
    <div className="gallery-wall-name" aria-hidden="true">{work.en}</div>
    <div className="gallery-exhibit-visual">{work.visual}</div>
    <div className="gallery-placard"><div className="gallery-work-meta"><span><i />{work.index}</span><span>{work.phone ? 'APP & EXPERIENCE' : 'WEB & EXPERIMENT'}</span></div><h3>{work.en}</h3><div className="gallery-work-zh">{work.zh.replaceAll(' ', '')}</div><p className="gallery-work-tagline">{work.tagline}</p><p className="gallery-work-body">{work.body}</p>{work.tech && <p className="gallery-work-tech">{work.tech}</p>}<a className="gallery-open-work" href={work.url} target="_blank" rel="noopener noreferrer">打开作品 <span aria-hidden="true">↗</span><span>{work.urlLabel}</span></a></div>
  </article>;
}

function ToySticker({ work, chapter }: { work: GalleryWork; chapter: string }) {
  return <article className={`gallery-sticker gallery-sticker--${work.id}`} id={work.id} data-anchor={work.id} data-stop data-work={work.id} data-chapter={chapter} data-color={work.color} style={{ '--work-color': work.color } as CSSProperties}><span className="gallery-sticker-tape" aria-hidden="true" /><div className="gallery-sticker-meta"><span>{work.index}</span><span>BUILT FOR A SMILE ☺</span></div><div className="gallery-sticker-visual">{work.visual}</div><div className="gallery-sticker-title"><h3>{work.en}</h3><span aria-hidden="true">✳</span></div><div className="gallery-sticker-zh">{work.zh.replaceAll(' ', '')}</div><p>{work.body}</p><a href={work.url} target="_blank" rel="noopener noreferrer">{work.id === 'whack' ? '看看这个小玩具' : '进去锤两下'} <span aria-hidden="true">↗</span></a></article>;
}
