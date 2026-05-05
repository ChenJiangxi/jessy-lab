import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AmbientBackdrop from '../scene/AmbientBackdrop';
import { BrandMark } from '../components/BrandMark';
import VideoHead from '../scene/VideoHead';
import { streamChat } from '../lib/chat';
import { getSessionId } from '../lib/session';
import { speak, stopAudio, unlockAudio } from '../lib/tts';

type Turn = { role: 'user' | 'assistant'; content: string };

/**
 * Cold-start greeting — shown verbatim to first-time visitors (empty
 * history). Voiced via TTS on the visitor's first interaction with the
 * page (autoplay policy blocks playing without a user gesture). If the
 * visitor types or taps a chip first, the greeting stays on screen but
 * isn't voiced — `ask()` suppresses it so we don't talk over their reply.
 */
const GREETING = '嗨——你来了。我是 Jessy 的数字自我，可以聊聊我的研究、艺术，或者别的什么。';

/**
 * Suggestion chip pool — always shown above the input (B variant: a
 * persistent UI element, not just a cold-start affordance). On each
 * fresh page load we pick 4 at random from this pool; they stay until
 * refresh.
 */
const SUGGESTIONS_POOL = [
  // 自我介绍 / 轻问
  '聊聊你自己',
  '建筑系为什么转走',
  '直博和读硕选哪个',
  'SJTU 体验怎么样',
  '工业工程冷门吗',
  '博士后想去哪',
  // 研究 / 学术
  'PhD 是什么感觉',
  '你做研究在做什么',
  '强化学习怎么入门',
  '智能运维到底干嘛',
  '智能制造前景',
  'GNN 现在还热吗',
  'MHGNN-PPO 是啥',
  '为什么选 RL',
  '学术圈水吗',
  '学术圈最大的瓶颈',
  '想留在学术圈吗',
  // 量化
  '量化的日子怎么样',
  '量化和学术哪个更累',
  '为什么离开量化',
  // AI 行业判断
  '怎么看这波 AI',
  'AGI 还要多久',
  'AI 哪里水分最大',
  'AI 哪里最被低估',
  '具身智能怎么看',
  '世界模型怎么看',
  '多模态先在哪爆发',
  'Sora 你怎么看',
  'agent 这波怎么看',
  'AI 能取代程序员吗',
  // 项目
  'AuraMate 是什么',
  'FateCouncil 是什么',
  'MangPai 在做什么',
  'Whack-a-Claude 是啥',
  'Kill Boss 是啥',
  'Rain Scripts 怎么来的',
  '这个网站怎么做的',
  '为什么做命理项目',
  '一个人做产品累吗',
  // 命理
  '命理是迷信吗',
  '怎么解释丁火',
  '为什么相信八字',
  '八字到底是什么',
  '盲派和正五行差在哪',
  '命理能帮人吗',
  // 审美 / 电影
  'Tears in Rain',
  '王家卫哪部最爱',
  '侯孝贤呢',
  '阿彼察邦看过吗',
  '宫崎骏哪部最爱',
  'Blade Runner 看几遍了',
  '推荐一部小众电影',
  '画里在画什么',
  '色彩有偏好吗',
  // 日常 / 生活
  '累了你做什么',
  '推荐一首歌',
  '推荐一本书',
  '最近在听什么',
  '最近在看什么',
  '最近爬过哪座山',
  '滑雪去哪',
  '上海哪里好吃',
  '上海最爱的角落',
  '失眠怎么办',
];

/** Pick N items from arr without repeats — used for the chip rotation. */
function sampleN<T>(arr: T[], n: number): T[] {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, n);
}

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

  // Greeting state — `greetedRef` flips true once the greeting has been
  // either voiced OR superseded by the visitor speaking first.
  // `suppressGreetingRef` is set by the greeting-listener effect so
  // `ask()` can detach the pending listeners synchronously when a turn
  // starts (avoids voicing the greeting and immediately cutting it off).
  const greetedRef = useRef(false);
  const suppressGreetingRef = useRef<(() => void) | null>(null);

  // Suggestion chips — initialised on mount, then re-shuffled after each
  // turn completes (see effect below) so the chip strip always offers
  // fresh prompts instead of stale ones.
  const [suggestions, setSuggestions] = useState<string[]>(() =>
    sampleN(SUGGESTIONS_POOL, 4),
  );
  const prevStreamingRef = useRef(false);

  // Pacing buffer
  const pendingRef = useRef<string>('');
  const netDoneRef = useRef<boolean>(true);
  const streamingRef = useRef<boolean>(false);

  const time = useBeijingTime();

  // Boot — load chat history. New visitors (empty history) get a greeting
  // line injected into the chat so the panel isn't blank on arrival; the
  // listener effect below then voices it on first interaction.
  useEffect(() => {
    sessionIdRef.current = getSessionId();
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/history?sessionId=${encodeURIComponent(sessionIdRef.current)}`,
        );
        if (cancelled) return;
        const j = res.ok
          ? ((await res.json()) as {
              messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
            })
          : { messages: [] };
        if (cancelled) return;
        if (j.messages?.length) {
          // Returning visitor — restore history, suppress greeting.
          greetedRef.current = true;
          setTurns(j.messages.map((m) => ({ role: m.role, content: m.content })));
        } else {
          setTurns([{ role: 'assistant', content: GREETING }]);
        }
      } catch {
        if (!cancelled) setTurns([{ role: 'assistant', content: GREETING }]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Greeting voicing — once the greeting is on screen, attach window
  // `click` + `keydown` listeners. Whichever fires first triggers TTS.
  // `click` (not `pointerdown`) lets React's synthetic onClick run first
  // when the visitor taps a chip — `ask()` then calls
  // `suppressGreetingRef.current()` to detach this listener before the
  // bubbled click reaches window, avoiding a half-second of greeting that
  // gets cut off by the chip's reply.
  useEffect(() => {
    if (greetedRef.current) return;
    const greetingShowing =
      turns.length === 1 &&
      turns[0]?.role === 'assistant' &&
      turns[0]?.content === GREETING;
    if (!greetingShowing) return;

    const playGreeting = () => {
      if (greetedRef.current) return;
      greetedRef.current = true;
      detach();
      unlockAudio();
      void (async () => {
        try {
          await speak(GREETING, {
            onAudioStart: () => setSpeaking(true),
          });
        } catch {
          /* TTS failure shouldn't break the page */
        } finally {
          setSpeaking(false);
        }
      })();
    };
    const detach = () => {
      window.removeEventListener('click', playGreeting);
      window.removeEventListener('keydown', playGreeting);
      suppressGreetingRef.current = null;
    };
    suppressGreetingRef.current = () => {
      greetedRef.current = true;
      detach();
    };
    window.addEventListener('click', playGreeting);
    window.addEventListener('keydown', playGreeting);
    return detach;
  }, [turns]);

  // Auto-scroll on new content.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, streaming]);

  // Re-shuffle suggestion chips right after Jessy finishes streaming a
  // reply — gives the visitor a fresh set of prompts each turn.
  useEffect(() => {
    if (prevStreamingRef.current && !streaming) {
      setSuggestions(sampleN(SUGGESTIONS_POOL, 4));
    }
    prevStreamingRef.current = streaming;
  }, [streaming]);

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

    // Visitor is starting a turn — detach any pending greeting listeners
    // so the bubbled window-click doesn't fire greeting TTS that we'd
    // immediately have to cut off.
    suppressGreetingRef.current?.();

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


  // Unified status indicator — drives the thin line under the avatar and
  // the top-right HUD dot. Cool-blue when idle so the loud pink dot from
  // the previous design doesn't fight the figure's own rim light.
  const statusText = speaking ? 'SPEAKING' : streaming ? 'COMPOSING' : 'STANDBY';
  const statusColor = speaking ? '#f5b8d6' : streaming ? '#c8a5ff' : '#7ec5ff';

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#06030f] text-[#f4ecdc] select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) inputRef.current?.focus();
      }}
    >
      <AmbientBackdrop />

      {/* vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.62) 100%)',
        }}
      />

      {/* hairline scanlines — 0.04 alpha, only over the dark backdrop */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(200,165,255,0.045) 0 1px, transparent 1px 3px)',
          mixBlendMode: 'overlay',
        }}
      />

      {/* HUD corner brackets — 4 minimal Ls at the viewport corners */}
      {[
        { cls: 'top-3 left-3', rot: 0 },
        { cls: 'top-3 right-3', rot: 90 },
        { cls: 'bottom-3 right-3', rot: 180 },
        { cls: 'bottom-3 left-3', rot: 270 },
      ].map((c, i) => (
        <svg
          key={i}
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 18 18"
          className={`absolute ${c.cls} pointer-events-none z-20`}
          style={{ transform: `rotate(${c.rot}deg)` }}
        >
          <path
            d="M0 13 L0 0 L13 0"
            fill="none"
            stroke="rgba(244,236,220,0.32)"
            strokeWidth="0.9"
          />
        </svg>
      ))}

      {/* ── HUD: top-left brand ─────────────────────────── */}
      <div className="absolute top-5 left-6 pointer-events-none z-30">
        <BrandMark subtitle="DIGITAL SELF" size="lg" />
      </div>

      {/* ── HUD: top-right · time + status (desktop only) ── */}
      <div className="absolute top-6 right-6 text-right pointer-events-none font-mono text-[10px] tracking-[0.32em] text-[#f4ecdc]/60 hidden md:block z-30">
        <div className="flex items-center justify-end gap-2.5">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
              background: statusColor,
              boxShadow: `0 0 8px ${statusColor}`,
              animation: 'v2_pulse 1.8s ease-in-out infinite',
            }}
          />
          <span className="text-[#f4ecdc]/82 tabular-nums">{time}</span>
          <span className="text-[#f4ecdc]/30">·</span>
          <span style={{ color: statusColor }}>{statusText}</span>
        </div>
      </div>

      {/* ── HUD: bottom-right page nav (desktop only) ───── */}
      <div className="absolute bottom-6 right-6 font-mono text-[10px] tracking-[0.32em] uppercase pointer-events-auto hidden md:block z-30">
        <Link to="/projects" className="text-[#f4ecdc]/45 hover:text-[#c8a5ff] transition-colors">PROJECTS</Link>
        <span className="mx-2 text-[#f4ecdc]/18">·</span>
        <Link to="/arts" className="text-[#f4ecdc]/45 hover:text-[#c8a5ff] transition-colors">ARTS</Link>
        <span className="mx-2 text-[#f4ecdc]/18">·</span>
        <a
          href="https://chenjiangxi.github.io/home-page/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#f4ecdc]/45 hover:text-[#c8a5ff] transition-colors"
        >
          RESEARCH
        </a>
        <span className="mx-2 text-[#f4ecdc]/18">·</span>
        <Link to="/contact" className="text-[#f4ecdc]/45 hover:text-[#c8a5ff] transition-colors">CONTACT</Link>
      </div>

      {/* ── HUD: mobile nav — single MENU toggle, drops a compact panel.
          Collapsed state takes one short word so the top doesn't crowd
          the brand on the left or the avatar in the centre. */}
      <MobileNav />

      {/* main column */}
      <div className="absolute inset-0 flex flex-col items-center px-6 pt-[2vh] pb-[3vh] z-20">
        {/* head — cyber HUD frame: chamfered (45°-cut) corner brackets,
            edge tick marks, a slow vertical scan-sweep, and a small
            telemetry rail to the right. Uses preserveAspectRatio="none"
            with non-scaling strokes — viewBox 100×125 matches the 4:5
            wrapper exactly so 45° cuts stay 45°. */}
        <div
          className="relative shrink-0 w-[min(280px,62vw)] md:w-[min(290px,26vw)]"
          style={{ aspectRatio: '4 / 5' }}
        >
          <VideoHead playing={speaking} />

          <svg
            aria-hidden
            viewBox="0 0 100 125"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {/* chamfered corner brackets — pink on her left, blue on her
                right. Top brighter than bottom (bottom sits in the body
                fade region). */}
            <path d="M 0 10 L 0 4 L 4 0 L 10 0"
                  fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke"
                  stroke="rgba(245,184,214,0.72)" />
            <path d="M 90 0 L 96 0 L 100 4 L 100 10"
                  fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke"
                  stroke="rgba(126,197,255,0.72)" />
            <path d="M 0 115 L 0 121 L 4 125 L 10 125"
                  fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke"
                  stroke="rgba(245,184,214,0.45)" />
            <path d="M 90 125 L 96 125 L 100 121 L 100 115"
                  fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke"
                  stroke="rgba(126,197,255,0.45)" />

            {/* targeting tick marks on the side edges */}
            <line x1="0" y1="35" x2="3" y2="35"
                  strokeWidth="1" vectorEffect="non-scaling-stroke"
                  stroke="rgba(245,184,214,0.55)" />
            <line x1="0" y1="92" x2="3" y2="92"
                  strokeWidth="1" vectorEffect="non-scaling-stroke"
                  stroke="rgba(245,184,214,0.40)" />
            <line x1="100" y1="35" x2="97" y2="35"
                  strokeWidth="1" vectorEffect="non-scaling-stroke"
                  stroke="rgba(126,197,255,0.55)" />
            <line x1="100" y1="92" x2="97" y2="92"
                  strokeWidth="1" vectorEffect="non-scaling-stroke"
                  stroke="rgba(126,197,255,0.40)" />

            {/* center-axis cross-tick: tiny + at the eye line, the way a
                HUD targeting reticle would lock on a face */}
            <line x1="48" y1="36" x2="52" y2="36"
                  strokeWidth="0.8" vectorEffect="non-scaling-stroke"
                  stroke="rgba(200,165,255,0.55)" />
            <line x1="50" y1="34" x2="50" y2="38"
                  strokeWidth="0.8" vectorEffect="non-scaling-stroke"
                  stroke="rgba(200,165,255,0.55)" />
          </svg>

          {/* slow vertical scan-sweep — sweeps top to bottom every 6.4s,
              fades in/out at the edges so it doesn't pop. */}
          <div
            aria-hidden
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              height: 2,
              top: 0,
              background:
                'linear-gradient(90deg, transparent 0%, rgba(200,165,255,0.50) 30%, rgba(245,184,214,0.55) 50%, rgba(126,197,255,0.50) 70%, transparent 100%)',
              boxShadow: '0 0 10px rgba(200,165,255,0.40)',
              animation: 'v2_scan 6.4s linear infinite',
            }}
          />

          {/* right-side telemetry rail (desktop only) — three stacked
              mono micro-readouts, positioned just outside the frame. */}
          <div className="hidden md:block absolute top-[12%] -right-2 translate-x-full font-mono text-[8.5px] tracking-[0.18em] text-[#f4ecdc]/40 leading-[1.85] pointer-events-none whitespace-nowrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[#7ec5ff]/70">·</span>
              <span>BIO &nbsp;&nbsp;98.4%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#c8a5ff]/70">·</span>
              <span>LNK &nbsp;&nbsp;ESTBL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#f5b8d6]/70">·</span>
              <span>FRQ &nbsp;&nbsp;2.40G</span>
            </div>
          </div>
        </div>

        {/* status line — replaces the old JESSY_DIGITAL_AGENT label.
            Sits in the breathing room between the head and the chat,
            morphs between STANDBY / COMPOSING / SPEAKING. */}
        <div className="shrink-0 mt-1 mb-2 flex items-center gap-3 font-mono text-[9.5px] tracking-[0.45em] text-[#f4ecdc]/45 pointer-events-none relative z-10">
          <span
            className="h-px w-10"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(244,236,220,0.30))',
            }}
          />
          <span
            className="inline-block w-1 h-1 rounded-full"
            style={{
              background: statusColor,
              boxShadow: `0 0 6px ${statusColor}`,
              animation: 'v2_pulse 1.8s ease-in-out infinite',
            }}
          />
          <span style={{ color: statusColor, opacity: 0.85 }}>{statusText}</span>
          <span
            className="h-px w-10"
            style={{
              background:
                'linear-gradient(90deg, rgba(244,236,220,0.30), transparent)',
            }}
          />
        </div>

        {/* chat panel — wraps both history + input. */}
        <div className="flex-1 w-full max-w-xl mt-1 flex flex-col items-center min-h-0">
          <div className="flex-1 w-full min-h-0 flex flex-col justify-end">
            <div
              ref={scrollRef}
              className="overflow-y-auto px-1 space-y-3.5 pb-2 pointer-events-auto"
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
                    <div
                      className="max-w-[78%] px-3.5 py-2 font-sans text-[12px] md:text-[13px] text-[#f4ecdc]/92 leading-[1.6]"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(245,184,214,0.10), rgba(200,165,255,0.06))',
                        border: '1px solid rgba(245,184,214,0.20)',
                        borderRadius: '14px 14px 4px 14px',
                      }}
                    >
                      {t.content}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-start">
                    <div
                      className="max-w-[82%] px-3.5 py-2 font-sans text-[12px] md:text-[13.5px] text-[#f4ecdc]/88 leading-[1.6]"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(126,197,255,0.06), rgba(200,165,255,0.04))',
                        border: '1px solid rgba(200,165,255,0.16)',
                        borderRadius: '4px 14px 14px 14px',
                      }}
                    >
                      {t.content}
                      {streaming && i === turns.length - 1 && (
                        <span className="inline-block w-[2px] h-[0.85em] ml-1 bg-[#c8a5ff]/85 align-middle animate-pulse" />
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* suggestion chips — always present above the input as a
              persistent affordance. Hidden only while she's composing
              a reply so the chips don't seem clickable mid-stream. */}
          {!streaming && (
            <div className="shrink-0 w-full mt-2.5 mb-2 flex flex-wrap gap-x-3 gap-y-1.5 justify-center items-center font-mono text-[10px] md:text-[10.5px] tracking-[0.12em] pointer-events-auto">
              {suggestions.map((s, i) => (
                <span key={s} className="flex items-center gap-x-3">
                  <button
                    type="button"
                    onClick={() => ask(s)}
                    className="text-[#f4ecdc]/50 hover:text-[#c8a5ff] transition-colors"
                  >
                    {s}
                  </button>
                  {i < suggestions.length - 1 && (
                    <span className="text-[#f4ecdc]/15">·</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* input — hairline border that picks up a violet→blue gradient
              tint while focused. Smaller, calmer send button. */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="shrink-0 w-full group"
          >
            <div
              className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 transition-all"
              style={{
                borderRadius: 16,
                background: 'rgba(8,4,20,0.72)',
                border: '1px solid rgba(244,236,220,0.16)',
                boxShadow: 'inset 0 0 0 0 transparent',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  'rgba(200,165,255,0.55)';
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 0 0 1px rgba(200,165,255,0.20), 0 0 24px -6px rgba(126,197,255,0.35)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  'rgba(244,236,220,0.16)';
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  'inset 0 0 0 0 transparent';
              }}
            >
              {/* leading prompt glyph — keeps the input feeling like
                  a terminal line rather than a generic chat field. */}
              <span className="font-mono text-[12px] text-[#c8a5ff]/55 select-none">›</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={streaming}
                placeholder={streaming ? '她在说…' : '与 Jessy 对话…'}
                className="flex-1 bg-transparent outline-none font-mono text-[13px] tracking-[0.04em] text-[#f4ecdc] placeholder:text-[#f4ecdc]/28 disabled:opacity-50"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={!input.trim() || streaming}
                aria-label="send"
                className="shrink-0 grid place-items-center w-8 h-8 rounded-full text-[#f4ecdc]/80 hover:text-[#c8a5ff] disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                style={{
                  border: '1px solid rgba(244,236,220,0.22)',
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
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
        @keyframes v2_scan {
          0%   { top: 0%;   opacity: 0; }
          5%   { opacity: 0.95; }
          95%  { opacity: 0.95; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ============================================================================
   MobileNav — collapsed = single MENU toggle word; opens to a small
   right-aligned dropdown with the four routes. md:hidden — desktop has
   its own bottom-right nav and never sees this.
============================================================================ */

function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* full-screen backdrop catches outside taps when open */}
      {open && (
        <button
          type="button"
          aria-label="close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'transparent' }}
        />
      )}
      <div className="absolute top-5 right-5 md:hidden z-40 flex flex-col items-end">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#f4ecdc]/55 active:text-[#c8a5ff] pointer-events-auto"
          aria-expanded={open}
          aria-label={open ? 'close menu' : 'open menu'}
        >
          {open ? 'CLOSE' : 'MENU'}
        </button>
        {open && (
          <div
            className="mt-3 flex flex-col items-end gap-2 font-mono text-[10px] tracking-[0.32em] uppercase pointer-events-auto"
            style={{
              animation: 'v2_menu_fade 200ms ease-out forwards',
            }}
          >
            <Link
              to="/projects"
              onClick={() => setOpen(false)}
              className="text-[#f4ecdc]/75 active:text-[#c8a5ff]"
            >
              PROJECTS
            </Link>
            <Link
              to="/arts"
              onClick={() => setOpen(false)}
              className="text-[#f4ecdc]/75 active:text-[#c8a5ff]"
            >
              ARTS
            </Link>
            <a
              href="https://chenjiangxi.github.io/home-page/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="text-[#f4ecdc]/75 active:text-[#c8a5ff]"
            >
              RESEARCH
            </a>
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="text-[#f4ecdc]/75 active:text-[#c8a5ff]"
            >
              CONTACT
            </Link>
          </div>
        )}
      </div>
      <style>{`
        @keyframes v2_menu_fade {
          0%   { opacity: 0; transform: translateY(-4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
