import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Fluid from '../scene/Fluid';
import LineBackdrop from '../scene/LineBackdrop';
import VideoHead from '../scene/VideoHead';
import { streamChat } from '../lib/chat';
import { getSessionId } from '../lib/session';
import { speak, stopAudio, unlockAudio } from '../lib/tts';

type Turn = { role: 'user' | 'assistant'; content: string };

/** Starter chips shown above the input when the chat is empty. */
const SUGGESTIONS = [
  '聊聊你自己',
  'AuraMate 是什么',
  '凌晨三点你在想什么',
  'Tears in Rain',
];

/* Pacing: emit at ~33 chars/sec; pause harder on sentence-end. */
const BASE_DELAY_MS = 30;
const SOFT_PAUSE_MS = 150;
const HARD_PAUSE_MS = 360;
const SOFT_PUNCT = /[，、；：,;:]/;
const HARD_PUNCT = /[。！？!?\n]/;

function useBeijingTime() {
  const [t, setT] = useState('--:--:--');
  useEffect(() => {
    const tick = () => {
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Shanghai',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setT(fmt.format(new Date()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function V2() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const sessionIdRef = useRef('');
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const [chatRect, setChatRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // Pacing buffer
  const pendingRef = useRef<string>('');
  const netDoneRef = useRef<boolean>(true);
  const streamingRef = useRef<boolean>(false);

  const time = useBeijingTime();

  // Boot — load chat history.
  useEffect(() => {
    sessionIdRef.current = getSessionId();
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/history?sessionId=${encodeURIComponent(sessionIdRef.current)}`,
        );
        if (!res.ok) return;
        const j = (await res.json()) as {
          messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
        };
        if (!cancelled && j.messages?.length) {
          setTurns(j.messages.map((m) => ({ role: m.role, content: m.content })));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll on new content.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, streaming]);

  // Measure the chat panel so the backdrop can carve a hole around it.
  useEffect(() => {
    const measure = () => {
      const el = chatPanelRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setChatRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (chatPanelRef.current) ro.observe(chatPanelRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Keep streamingRef in sync with state.
  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  // Esc: abort net stream, flush pending chars, stop any TTS.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (!streamingRef.current && !speaking) return;
      abortRef.current?.abort();
      stopAudio();
      const remainder = pendingRef.current;
      pendingRef.current = '';
      if (remainder.length > 0) {
        setTurns((prev) => {
          const copy = prev.slice();
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = {
              ...last,
              content: last.content + remainder,
            };
          }
          return copy;
        });
      }
      netDoneRef.current = true;
      setStreaming(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [speaking]);

  // Pacing rAF loop — emits buffered chars at controlled rate, with
  // longer pauses on punctuation.
  useEffect(() => {
    let raf = 0;
    let lastEmit = performance.now();
    let nextDelay = BASE_DELAY_MS;

    const tick = () => {
      raf = requestAnimationFrame(tick);

      // Mark streaming complete when net done AND queue drained.
      if (
        pendingRef.current.length === 0 &&
        netDoneRef.current &&
        streamingRef.current
      ) {
        setStreaming(false);
        return;
      }

      if (pendingRef.current.length === 0) return;
      const now = performance.now();
      if (now - lastEmit < nextDelay) return;

      const ch = pendingRef.current[0]!;
      pendingRef.current = pendingRef.current.slice(1);

      setTurns((prev) => {
        const copy = prev.slice();
        const last = copy[copy.length - 1];
        if (last?.role === 'assistant') {
          copy[copy.length - 1] = { ...last, content: last.content + ch };
        }
        return copy;
      });

      lastEmit = now;
      nextDelay = HARD_PUNCT.test(ch)
        ? HARD_PAUSE_MS
        : SOFT_PUNCT.test(ch)
          ? SOFT_PAUSE_MS
          : BASE_DELAY_MS;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const ask = async (raw: string) => {
    const text = raw.trim();
    if (!text || streamingRef.current) return;

    // Inside a click handler — unlock audio for iOS / Safari / WeChat,
    // and cut off any prior TTS clip before starting a new turn.
    unlockAudio();
    stopAudio();

    setInput('');
    setError(null);
    setStreaming(true);
    netDoneRef.current = false;
    pendingRef.current = '';
    let fullContent = '';

    setTurns((t) => [
      ...t,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await streamChat(
        {
          sessionId: sessionIdRef.current,
          userMessage: text,
          localTimeISO: new Date().toISOString(),
        },
        {
          signal: ctrl.signal,
          onDelta: (chunk) => {
            pendingRef.current += chunk;
            fullContent += chunk;
          },
          onError: (err) => setError(err.message),
        },
      );
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message ?? 'stream failed');
    } finally {
      netDoneRef.current = true;
      abortRef.current = null;
    }

    // After text stream completes, generate + play TTS. We DON'T set
    // speaking=true until audio actually starts (the `playing` event)
    // — that way the head video stays still during fetch/decode latency
    // and starts moving in sync with the first audible frame.
    if (fullContent.trim() && !ctrl.signal.aborted) {
      try {
        await speak(fullContent, {
          signal: ctrl.signal,
          onAudioStart: () => setSpeaking(true),
        });
      } catch {
        /* TTS failure shouldn't break the conversation */
      } finally {
        setSpeaking(false);
      }
    }
  };


  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#1a1525] text-[#f0e8dc] select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) inputRef.current?.focus();
      }}
    >
      {/* Fluid is kept around but hidden behind the scan-line backdrop;
          uncomment to bring back the warm fluid look. */}
      {false && <Fluid />}
      <LineBackdrop excludeRect={chatRect} />

      {/* vignette — focuses center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* ── HUD: top-left brand ─────────────────────────── */}
      <div className="absolute top-6 left-7 pointer-events-none z-30">
        <div
          className="font-mono font-light text-[#f0e8dc]"
          style={{ fontSize: 26, letterSpacing: '0.18em' }}
        >
          JESSY
        </div>
        <div className="mt-1 font-mono text-[10px] tracking-[0.4em] text-[#f0e8dc]/55">
          DIGITAL SELF
        </div>
        <div
          className="mt-2 h-px w-10"
          style={{
            background:
              'linear-gradient(90deg, rgba(255,120,200,0.7), rgba(120,160,255,0.4) 60%, transparent)',
          }}
        />
      </div>

      {/* ── HUD: top-right · time + status (desktop only) ── */}
      <div className="absolute top-6 right-7 text-right pointer-events-none font-mono text-[10px] tracking-[0.30em] text-[#f0e8dc]/65 hidden md:block z-30">
        <div className="flex items-center justify-end gap-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              background: '#ff6cb6',
              boxShadow: '0 0 8px 1px #ff6cb6',
              animation: 'v2_pulse 1.6s ease-in-out infinite',
            }}
          />
          <span className="text-[#f0e8dc]/85">{time}</span>
          <span className="text-[#f0e8dc]/40">SHA-03</span>
          <span className="text-[#7ab8ff]">ONLINE</span>
        </div>
      </div>

      {/* ── HUD: bottom-right page nav (desktop only) ───── */}
      <div className="absolute bottom-7 right-7 font-mono text-[10px] tracking-[0.32em] uppercase pointer-events-auto hidden md:block z-30">
        <Link to="/projects" className="text-[#f0e8dc]/45 hover:text-[#7ab8ff] transition-colors">PROJECTS</Link>
        <span className="mx-2 text-[#f0e8dc]/20">/</span>
        <Link to="/research" className="text-[#f0e8dc]/45 hover:text-[#7ab8ff] transition-colors">RESEARCH</Link>
        <span className="mx-2 text-[#f0e8dc]/20">/</span>
        <a
          href="https://github.com/ChenJiangxi"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#f0e8dc]/45 hover:text-[#7ab8ff] transition-colors"
        >
          GITHUB
        </a>
        <span className="mx-2 text-[#f0e8dc]/20">/</span>
        <Link to="/contact" className="text-[#f0e8dc]/45 hover:text-[#7ab8ff] transition-colors">CONTACT</Link>
      </div>


      {/* main column */}
      <div className="absolute inset-0 flex flex-col items-center px-6 pt-[2vh] pb-[3vh]">
        {/* head + halo. Bigger on mobile (60vw) so the face is the
            primary subject; tighter on desktop where the chat panel
            takes more attention. */}
        <div
          className="relative shrink-0 w-[min(280px,62vw)] md:w-[min(290px,26vw)]"
          style={{ aspectRatio: '4 / 5' }}
        >
          {/* dotted ring with a 60° gap at the bottom. */}
          <svg
            aria-hidden
            viewBox="-50 -50 100 100"
            className="absolute pointer-events-none"
            style={{
              left: '50%',
              top: '45%',
              transform: 'translate(-50%, -50%)',
              width: '120%',
              aspectRatio: '1 / 1',
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient
                id="v2-ring-grad"
                x1="0%"
                y1="50%"
                x2="100%"
                y2="50%"
              >
                <stop offset="0%" stopColor="rgba(255, 140, 220, 0.60)" />
                <stop offset="50%" stopColor="rgba(180, 140, 255, 0.35)" />
                <stop offset="100%" stopColor="rgba(140, 200, 255, 0.60)" />
              </linearGradient>
              <filter
                id="v2-dot-glow"
                x="-200%"
                y="-200%"
                width="500%"
                height="500%"
              >
                <feGaussianBlur stdDeviation="0.9" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Dotted arc — 300° visible (60° = 1/6 hidden at bottom).
                Endpoints at math angles 240° and 300° (SVG y=42.4). */}
            <path
              d="M 24.5 42.4 A 49 49 0 1 0 -24.5 42.4"
              fill="none"
              stroke="url(#v2-ring-grad)"
              strokeWidth="0.2"
              strokeDasharray="0 1.0"
              strokeLinecap="round"
            />
            {/* Three highlight dots (left / top / right). Top dot
                nudged 1.4 viewBox units left (~5px) so it visually
                lands on the face's vertical centerline rather than
                the geometric SVG center. */}
            {[
              { x: -49, y: 0, color: 'rgba(255, 150, 220, 0.98)' },
              { x: -1.4, y: -49, color: 'rgba(180, 210, 255, 0.98)' },
              { x: 49, y: 0, color: 'rgba(140, 200, 255, 0.98)' },
            ].map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={0.65}
                fill={d.color}
                filter="url(#v2-dot-glow)"
                style={{
                  animation: `v2_dot_pulse ${2.4 + i * 0.8}s ease-in-out infinite`,
                }}
              />
            ))}
          </svg>
          <VideoHead playing={speaking} />
        </div>

        {/* avatar label — overlaps the bottom of the head/ring slightly
            so the title sits right where the body fades out. */}
        <div className="shrink-0 -mt-6 font-mono text-[11px] tracking-[0.35em] text-[#f0e8dc]/60 pointer-events-none relative z-10">
          JESSY_DIGITAL_AGENT
          <span className="mx-2 text-[#f0e8dc]/30">//</span>
          <span className="text-[#7ab8ff]">ONLINE</span>
        </div>

        {/* chat panel: wraps both history + input so its bounding rect
            is what LineBackdrop fades a streak-hole around. */}
        <div
          ref={chatPanelRef}
          className="flex-1 w-full max-w-xl mt-3 flex flex-col items-center min-h-0"
        >
          <div className="flex-1 w-full min-h-0 flex flex-col justify-end">
            <div
              ref={scrollRef}
              className="overflow-y-auto px-1 space-y-3 pb-2 pointer-events-auto"
              style={{
                maxHeight: '100%',
                maskImage:
                  'linear-gradient(180deg, transparent 0, black 32px, black calc(100% - 8px), transparent 100%)',
                WebkitMaskImage:
                  'linear-gradient(180deg, transparent 0, black 32px, black calc(100% - 8px), transparent 100%)',
              }}
            >
              {turns.map((t, i) =>
                t.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[78%] rounded-2xl bg-[#6b4a8f]/35 px-3 py-1.5 md:px-3.5 md:py-2 font-sans text-[11.5px] md:text-[13px] text-[#f0e8dc]/90 leading-[1.55]">
                      {t.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-[#f0e8dc]/[0.07] px-3 py-1.5 md:px-3.5 md:py-2 font-sans text-[12px] md:text-[13.5px] text-[#f0e8dc]/88 leading-[1.55] md:leading-[1.6]">
                      {t.content}
                      {streaming && i === turns.length - 1 && (
                        <span className="inline-block w-[2px] h-[0.85em] ml-1 bg-[#f0e8dc]/85 align-middle animate-pulse" />
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* starter chips — always visible (sway-lab pattern) so they
              double as quick prompts mid-conversation. Hidden only
              while she's actively streaming a reply. */}
          {!streaming && (
            <div className="shrink-0 w-full mt-1 mb-1.5 md:mt-2 md:mb-3 flex flex-wrap gap-1.5 md:gap-2 justify-center pointer-events-auto">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="font-mono text-[10px] md:text-[11px] tracking-[0.06em] border border-[#f0e8dc]/20 hover:border-[#a0c0ff]/55 text-[#f0e8dc]/65 hover:text-[#f0e8dc] rounded-full px-3 py-1 md:px-3.5 md:py-1.5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* input — same width as chat, gentler corner radius, gradient
              border + circular send button. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="shrink-0 w-full mt-4"
          >
            <div
              style={{
                borderRadius: 18,
                padding: 1,
                background:
                  'linear-gradient(95deg, rgba(255,140,220,0.55), rgba(160,140,255,0.45) 45%, rgba(120,180,255,0.55))',
              }}
            >
              <div
                className="flex items-center gap-3 pl-5 pr-2 py-1.5"
                style={{
                  borderRadius: 17,
                  background: 'rgba(8, 4, 20, 0.78)',
                }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={streaming}
                  placeholder={
                    streaming ? '她在说…' : 'Ask Jessy anything...'
                  }
                  className="flex-1 bg-transparent outline-none font-mono text-[13px] tracking-[0.04em] text-[#f0e8dc] placeholder:text-[#f0e8dc]/30 disabled:opacity-50"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  aria-label="send"
                  className="shrink-0 grid place-items-center w-9 h-9 rounded-full border border-[#f0e8dc]/30 text-[#f0e8dc]/85 hover:border-[#a0c0ff] hover:text-[#a0c0ff] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
            {error && (
              <div className="mt-2 font-mono text-[10px] tracking-[0.25em] text-rose-300/70">
                × {error}
              </div>
            )}
          </form>
        </div>
      </div>

      <style>{`
        @keyframes v2_pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
        @keyframes v2_dot_pulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
