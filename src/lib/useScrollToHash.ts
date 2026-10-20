import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scroll to the element named by the URL hash — /projects#xuanji,
 * /arts#fire — so a link in a chat reply lands on that piece.
 *
 * The pages scroll inside their own fixed container and the route is
 * rendered client-side, so the browser's built-in anchor jump never fires.
 * Retries briefly because a lazy route may not have mounted the target yet,
 * then re-aligns once fonts have loaded and nudged the layout.
 */
export function useScrollToHash() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    let timer = 0;
    const go = () => {
      const el = document.getElementById(id);
      if (!el) {
        if (tries++ < 20) timer = window.setTimeout(go, 100);
        return;
      }
      el.scrollIntoView({ block: 'start' });
    };
    go();
    const again = window.setTimeout(go, 600);
    void document.fonts?.ready.then(() => go());
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(again);
    };
  }, [hash]);
}
