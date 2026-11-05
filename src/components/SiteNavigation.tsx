import { Link } from 'react-router-dom';
import { RESEARCH_URL } from '../lib/links';
import './SiteNavigation.css';

const ITEMS = [
  { id: 'projects', label: '作品', en: 'Projects', to: '/projects', count: '10' },
  { id: 'arts', label: '艺术', en: 'Arts', to: '/arts', count: '07' },
  { id: 'research', label: '研究', en: 'Research', to: RESEARCH_URL },
  { id: 'contact', label: '联系', en: 'Contact', to: '/contact' },
] as const;

function NavIcon({ name }: { name: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'projects' ? <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h7v7h-7z" /></>
        : name === 'arts' ? <><path d="M4 5h16v15H4zM8 5V3m8 2V3M8 20l-2 2m10-2 2 2M4 15l5-5 4 4 3-3 4 5" /><circle cx="16" cy="9" r="1" /></>
          : name === 'research' ? <><path d="M3 5c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 1-3-1-5-2-9-1zM12 7v14M6 9l3 1m6 0 3-1M6 13l3 1m6 0 3-1" /></>
            : <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>}
    </svg>
  );
}

export function SiteNavigation({ variant = 'header', active }: { variant?: 'home' | 'header'; active?: string }) {
  return (
    <nav className={`site-navigation site-navigation--${variant}`} aria-label="网站导航">
      {variant === 'home' && <div className="site-navigation-heading">去逛逛 <span>EXPLORE</span></div>}
      <div className="site-navigation-items">
        {ITEMS.map((item) => {
          const content = <><span className="site-navigation-icon"><NavIcon name={item.id} /></span><span className="site-navigation-label">{item.label}<span className="site-navigation-english">{item.en}</span></span>{'count' in item && <span className="site-navigation-count">{item.count}</span>}<span className="site-navigation-arrow" aria-hidden="true">↗</span></>;
          const props = { className: `site-navigation-item site-navigation-item--${item.id}`, 'aria-current': active === item.id ? 'page' as const : undefined };
          return item.id === 'research'
            ? <a key={item.id} href={item.to} target="_blank" rel="noopener noreferrer" {...props}>{content}</a>
            : <Link key={item.id} to={item.to} {...props}>{content}</Link>;
        })}
      </div>
    </nav>
  );
}
