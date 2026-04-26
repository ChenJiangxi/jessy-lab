import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import ParticleHead, { type ParticleHeadHandle } from '../presence/ParticleHead';
import Conversation from '../presence/Conversation';
import StatusBar from '../presence/StatusBar';
import {
  reducer,
  INITIAL,
  driftClarity,
  type ThreadId,
  type Mood,
} from '../presence/state';

/**
 * Agent-as-Interface entry. Layout:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  ☰ EN              SIGNAL · DEPTH · PORTRAIT · MODE       │
 *   │                                                            │
 *   │  · AGENT                                  在被定义之前     │
 *   │  CHEN JIANGXI         [ FLAME ]            先被理解         │
 *   │  陈姜希                                                     │
 *   │  ─                                                          │
 *   │  A presence before a profile                                │
 *   │                                                            │
 *   │  ┌──────────── chat panel ───────────────┐                │
 *   │  │  AGENT 10:28  我可以带你认识我...      │                │
 *   │  │              YOU 10:29  她在做什么？   │                │
 *   │  │  AGENT 10:30  好的, 我们可以...       │                │
 *   │  │  [ card ]  [ card ]  [ card ]         │                │
 *   │  │  ┌─ ✨ 输入你想了解的问题... [ ↑ ] ─┐  │                │
 *   │  └──────────────────────────────────────┘                │
 *   │  © 2024 陈姜希                Built with curiosity         │
 *   └──────────────────────────────────────────────────────────┘
 */
export default function Presence() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const headRef = useRef<ParticleHeadHandle | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [, setIsReturning] = useState<boolean | null>(null);

  // amplitude blend (TTS RMS + tap from text deltas)
  const tapAmp = useRef({ v: 0 });
  const audioAmp = useRef(0);
  const onAssistantDelta = useCallback(() => {
    tapAmp.current.v = Math.min(1, tapAmp.current.v + 0.10);
  }, []);
  const onAudioAmplitude = useCallback((a: number) => {
    audioAmp.current = a;
  }, []);

  useEffect(() => { headRef.current?.setDepth(state.depth); }, [state.depth]);
  useEffect(() => { headRef.current?.setClarity(state.clarity / 100); }, [state.clarity]);

  // Auto-drift clarity with depth.
  useEffect(() => {
    const next = driftClarity(state.clarity, state.depth);
    if (next > state.clarity) dispatch({ type: 'advance_clarity', value: next });
  }, [state.depth, state.clarity]);

  // amplitude rAF loop
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      tapAmp.current.v = Math.max(streaming ? 0.18 : 0, tapAmp.current.v * 0.94);
      const combined = Math.max(tapAmp.current.v, audioAmp.current);
      headRef.current?.setAmplitude(combined);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [streaming]);

  const onUserTurn = useCallback(() => dispatch({ type: 'user_turn' }), []);
  const onRevealThread = useCallback(
    (id: ThreadId) => dispatch({ type: 'reveal_thread', id }),
    [],
  );
  const onRevealCard = useCallback(
    (kind: 'project' | 'paper', id: string) =>
      dispatch({ type: 'reveal_card', kind, id }),
    [],
  );
  const onAdvanceClarity = useCallback(
    (value: number) => dispatch({ type: 'advance_clarity', value }),
    [],
  );
  const onShiftMood = useCallback(
    (mood: Mood) => dispatch({ type: 'shift_mood', mood }),
    [],
  );
  const onHistoryLoaded = useCallback((count: number) => {
    setIsReturning(count > 0);
    if (count > 0) {
      dispatch({ type: 'hydrate', depth: 1, clarity: 18 });
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full text-ink overflow-x-hidden paper-wash flex flex-col">
      <div className="grain" />

      {/* Particle-portrait head — fixed in the upper center of the viewport. */}
      <div
        className="fixed z-[3] pointer-events-none"
        aria-hidden
        style={{
          left: '50%',
          top: '6vh',
          transform: 'translateX(-50%)',
          width: 'min(440px, 44vw)',
          height: 'min(580px, 64vh)',
        }}
      >
        <ParticleHead ref={headRef} />
      </div>

      {/* ─── Top bar ─────────────────────────────────────────────── */}
      <header className="relative z-30 flex items-center justify-between px-7 sm:px-10 pt-5">
        <div className="flex items-center gap-5">
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-ink/5 text-ink-mute hover:text-ink focus-ring"
            aria-label="menu"
          >
            <Menu size={16} />
          </button>
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink-mute">
            EN
          </div>
        </div>
        <StatusBar depth={state.depth} clarity={state.clarity} streaming={streaming} />
      </header>

      {/* ─── Hero (side text only — flame is the global canvas) ── */}
      <section className="relative z-10 flex-1 flex items-start justify-center min-h-0 pt-2">
        <div className="relative z-20 w-full max-w-7xl mx-auto px-8 sm:px-12 grid grid-cols-12 gap-6 pt-8 sm:pt-12 pointer-events-none">
          <div className="col-span-12 md:col-span-3 pointer-events-auto">
            <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#a08fd0] mb-5">
              · AGENT
            </div>
            <h1
              className="font-display text-ink text-[34px] sm:text-[40px] leading-none tracking-[0.04em]"
              style={{ fontWeight: 300 }}
            >
              CHEN JIANGXI
            </h1>
            <div
              className="font-zhSerif text-ink text-[22px] sm:text-[26px] tracking-[0.4em] mt-2"
              style={{ fontWeight: 300 }}
            >
              陈姜希
            </div>
            <div className="mt-5 w-9 h-px bg-[#a08fd0]/60" />
            <div className="mt-6 font-display italic text-[12px] text-ink-mute tracking-wide">
              A presence before a profile
            </div>
            <div className="font-zh text-[12px] text-ink-mute tracking-[0.4em] mt-1.5">
              未完成的自我介绍
            </div>
          </div>

          <div className="hidden md:block md:col-span-6" />

          {/* Right column: quote */}
          <div className="hidden md:block md:col-span-3 pointer-events-auto text-right pt-24">
            <div className="font-zh text-ink-soft text-[13px] tracking-[0.4em] leading-relaxed">
              在&nbsp;被&nbsp;定&nbsp;义&nbsp;之&nbsp;前，先&nbsp;被&nbsp;理&nbsp;解。
            </div>
            <div className="font-display italic text-ink-mute text-[12px] tracking-[0.05em] mt-2">
              Understand before define.
            </div>
          </div>
        </div>
      </section>

      {/* ─── Chat panel ─────────────────────────────────────────── */}
      <section className="relative z-20 pb-6 pt-2">
        <Conversation
          clarity={state.clarity}
          onStreamingChange={setStreaming}
          onAssistantDelta={onAssistantDelta}
          onAudioAmplitude={onAudioAmplitude}
          onUserTurn={onUserTurn}
          onRevealThread={onRevealThread}
          onRevealCard={onRevealCard}
          onAdvanceClarity={onAdvanceClarity}
          onShiftMood={onShiftMood}
          onHistoryLoaded={onHistoryLoaded}
        />
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="relative z-20 px-7 sm:px-10 pb-4 flex items-center justify-between font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint">
        <div>
          © {new Date().getFullYear()} 陈姜希
          <span className="mx-2 text-ink-ghost">·</span>
          <Link to="/minimal" className="hover:text-ink">/minimal</Link>
          <span className="mx-2 text-ink-ghost">·</span>
          <Link to="/admin" className="hover:text-ink opacity-50">/admin</Link>
        </div>
        <div className="flex items-center gap-2">
          <span>Built with curiosity, not certainty.</span>
          <span className="text-[#a08fd0]">⌐⊃</span>
        </div>
      </footer>
    </div>
  );
}
