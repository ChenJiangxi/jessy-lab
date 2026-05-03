import { Link } from 'react-router-dom';

/**
 * Single source of truth for the "back to home" link used on /projects
 * and /arts. Pinned bottom-right by default to match Arts' established
 * placement; both pages render this component so the button never drifts
 * between sub-pages again.
 */
export function BackLink({
  label = 'BACK ←',
  to = '/',
}: {
  label?: string;
  to?: string;
}) {
  return (
    <Link
      to={to}
      className="fixed bottom-6 right-7 z-30 font-mono text-[10px] tracking-[0.32em] uppercase text-[#f0e8dc]/45 hover:text-[#c8a5ff]"
      style={{ transition: 'color 280ms ease' }}
    >
      {label}
    </Link>
  );
}
