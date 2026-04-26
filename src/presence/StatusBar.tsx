import { presenceMode } from './state';

type Props = {
  depth: number;
  clarity: number;
  streaming: boolean;
};

/**
 * Top-right instrument readout.
 *   SIGNAL    ACTIVE / IDLE     — purple dot when active
 *   DEPTH     00..04            — open circle indicator
 *   PORTRAIT  LOCKED / EMERGING — lock icon
 *   MODE      OBSERVATION / SPEAKING / REVEALED — open circle
 */
export default function StatusBar({ depth, clarity, streaming }: Props) {
  const mode = presenceMode(clarity);
  const portraitLocked = clarity < 75;
  const modeLabel =
    streaming
      ? 'SPEAKING'
      : mode === 'portrait'
        ? 'REVEALED'
        : mode === 'figure'
          ? 'EMERGING'
          : 'OBSERVATION';

  return (
    <div className="flex items-center gap-7 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">
      <Reading label="SIGNAL" value={streaming ? 'SPEAKING' : 'ACTIVE'}>
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{
            background: streaming ? '#fbbf24' : 'var(--neon-magenta)',
            boxShadow: streaming ? '0 0 6px #fbbf24' : '0 0 6px var(--neon-magenta)',
          }}
        />
      </Reading>
      <Reading label="DEPTH" value={String(depth).padStart(2, '0')}>
        <RingIcon filled={depth > 0} />
      </Reading>
      <Reading label="PORTRAIT" value={portraitLocked ? 'LOCKED' : 'EMERGING'}>
        <LockIcon open={!portraitLocked} />
      </Reading>
      <Reading label="MODE" value={modeLabel}>
        <RingIcon filled={!portraitLocked} />
      </Reading>
    </div>
  );
}

function Reading({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <div className="leading-[1.1]">
        <div className="text-ink-faint text-[9px] tracking-[0.25em]">{label}</div>
        <div className="text-ink text-[10.5px] font-medium tracking-[0.18em] mt-0.5">
          {value}
        </div>
      </div>
    </div>
  );
}

function RingIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11">
      <circle
        cx="5.5"
        cy="5.5"
        r="4.5"
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.55}
      />
      {filled && <circle cx="5.5" cy="5.5" r="2" fill="var(--neon-magenta)" />}
    </svg>
  );
}

function LockIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
        <rect x="1.5" y="6" width="8" height="6" rx="1" stroke="currentColor" strokeOpacity={0.7} />
        <path
          d="M3.5 6V4a2 2 0 014-1.2"
          stroke="currentColor"
          strokeOpacity={0.7}
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
      <rect x="1.5" y="6" width="8" height="6" rx="1" stroke="currentColor" strokeOpacity={0.7} />
      <path
        d="M3.5 6V4a2 2 0 014 0v2"
        stroke="currentColor"
        strokeOpacity={0.7}
      />
    </svg>
  );
}
