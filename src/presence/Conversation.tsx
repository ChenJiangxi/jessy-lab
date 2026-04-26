import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp, RotateCcw, Square, Volume2, VolumeX } from 'lucide-react';
import { streamChat, type ToolCall } from '../lib/chat';
import { getPrefs, getSessionId, newSession, setPrefs } from '../lib/session';
import { speak, stopAudio, unlockAudio } from '../lib/tts';
import { suggestionsForClarity, type SuggestionCard } from './suggestions';
import type { ThreadId, Mood } from './state';

type Turn = { role: 'user' | 'assistant'; content: string; ts: number };

type Props = {
  clarity: number;
  onStreamingChange: (s: boolean) => void;
  onAssistantDelta: (chunk: string) => void;
  onAudioAmplitude: (amp: number) => void;
  onUserTurn: () => void;
  onRevealThread: (id: ThreadId) => void;
  onRevealCard: (kind: 'project' | 'paper', id: string) => void;
  onAdvanceClarity: (value: number) => void;
  onShiftMood: (mood: Mood) => void;
  onHistoryLoaded?: (turnCount: number) => void;
};

const OPENING_TURN: Turn = {
  role: 'assistant',
  content: '我可以带你认识我。你想从哪一层开始？\nI can introduce her to you. Where would you like to begin?',
  ts: 0,
};

export default function Conversation({
  clarity,
  onStreamingChange,
  onAssistantDelta,
  onAudioAmplitude,
  onUserTurn,
  onRevealThread,
  onRevealCard,
  onAdvanceClarity,
  onShiftMood,
  onHistoryLoaded,
}: Props) {
  const navigate = useNavigate();
  const [turns, setTurns] = useState<Turn[]>([OPENING_TURN]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voice, setVoice] = useState(true);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [pickedCard, setPickedCard] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string>('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Boot
  useEffect(() => {
    sessionIdRef.current = getSessionId();
    setVoice(getPrefs().voice);
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/history?sessionId=${encodeURIComponent(sessionIdRef.current)}`,
        );
        if (!res.ok) {
          if (!aborted) {
            setHistoryLoaded(true);
            onHistoryLoaded?.(0);
          }
          return;
        }
        const json = (await res.json()) as { messages: Array<{ role: 'user' | 'assistant'; content: string; ts: number }> };
        if (aborted) return;
        const count = json.messages?.length ?? 0;
        if (count > 0) {
          setTurns(json.messages.map((m) => ({ role: m.role, content: m.content, ts: m.ts })));
        }
        setHistoryLoaded(true);
        onHistoryLoaded?.(count);
      } catch {
        if (aborted) return;
        setHistoryLoaded(true);
        onHistoryLoaded?.(0);
      }
    })();
    return () => {
      aborted = true;
    };
  }, [onHistoryLoaded]);

  useEffect(() => {
    onStreamingChange(streaming);
  }, [streaming, onStreamingChange]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, streaming]);

  const handleTool = useCallback(
    (call: ToolCall) => {
      const a = call.args || {};
      switch (call.name) {
        case 'reveal_thread':
          if (typeof a.id === 'string') onRevealThread(a.id as ThreadId);
          break;
        case 'reveal_project':
          if (typeof a.id === 'string') onRevealCard('project', a.id);
          break;
        case 'show_paper':
          if (typeof a.id === 'string') onRevealCard('paper', a.id);
          break;
        case 'advance_clarity':
          if (typeof a.value === 'number') onAdvanceClarity(a.value);
          break;
        case 'shift_mood':
          if (typeof a.mood === 'string') onShiftMood(a.mood as Mood);
          break;
        case 'navigate_to':
          if (typeof a.to === 'string') {
            window.setTimeout(() => navigate(a.to as string), 800);
          }
          break;
      }
    },
    [navigate, onRevealThread, onRevealCard, onAdvanceClarity, onShiftMood],
  );

  const toggleVoice = () => {
    const next = !voice;
    setVoice(next);
    setPrefs({ voice: next });
  };

  const startOver = async () => {
    abortRef.current?.abort();
    stopAudio();
    try {
      await fetch(
        `/api/history?sessionId=${encodeURIComponent(sessionIdRef.current)}`,
        { method: 'DELETE' },
      );
    } catch {
      /* ignore */
    }
    sessionIdRef.current = newSession();
    setTurns([OPENING_TURN]);
    setError(null);
    setPickedCard(null);
  };

  const cancel = () => {
    abortRef.current?.abort();
    stopAudio();
    setStreaming(false);
  };

  const ask = async (raw: string) => {
    const text = raw.trim();
    if (!text || streaming) return;

    // Unlock audio inside the user gesture (iOS / Safari / WeChat).
    unlockAudio();
    // Cut off any prior playback before the new turn starts.
    stopAudio();

    setInput('');
    setError(null);
    setStreaming(true);
    onUserTurn();

    const now = Date.now();
    const userTurn: Turn = { role: 'user', content: text, ts: now };
    const assistantTurn: Turn = { role: 'assistant', content: '', ts: now + 1 };
    setTurns((t) => [...t, userTurn, assistantTurn]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    let fullContent = '';

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
            fullContent += chunk;
            onAssistantDelta(chunk);
            setTurns((prev) => {
              const copy = prev.slice();
              const last = copy[copy.length - 1];
              if (last?.role === 'assistant') {
                copy[copy.length - 1] = { ...last, content: last.content + chunk };
              }
              return copy;
            });
          },
          onTool: handleTool,
          onDone: () => {
            // streaming flag stays true through TTS playback below
          },
          onError: (err) => {
            setError(err.message);
            setStreaming(false);
          },
        },
      );

      // sway-lab pattern: TTS the full message ONCE, after streaming.
      // Single shared <audio> = no overlap by construction.
      if (voice && fullContent.trim() && !ctrl.signal.aborted) {
        try {
          await speak(fullContent, {
            onAmplitude: onAudioAmplitude,
            signal: ctrl.signal,
          });
        } catch {
          /* TTS failure should not block the UI */
        }
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') setError(e?.message || 'stream failed');
    } finally {
      onAudioAmplitude(0);
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const cards = suggestionsForClarity(clarity);
  const showCards = !streaming && historyLoaded && turns.length <= 1;

  return (
    <div className="w-full max-w-3xl mx-auto px-6 flex flex-col">
      {/* Transcript */}
      <div
        ref={scrollRef}
        className="space-y-5 max-h-[44vh] overflow-y-auto pr-1"
        style={{
          maskImage:
            'linear-gradient(180deg, transparent 0, black 24px, black calc(100% - 8px), transparent 100%)',
        }}
      >
        <AnimatePresence initial={false}>
          {turns.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              {t.role === 'assistant' ? (
                <AgentBubble
                  text={t.content}
                  ts={t.ts}
                  streaming={streaming && i === turns.length - 1}
                />
              ) : (
                <UserBubble text={t.content} ts={t.ts} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {showCards && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            {cards.map((c) => (
              <CardChip
                key={c.title}
                card={c}
                active={pickedCard === c.title}
                onClick={() => {
                  setPickedCard(c.title);
                  ask(c.message);
                }}
              />
            ))}
          </div>
        )}

        {error && <div className="font-zh text-xs text-rose-700/80">× {error}</div>}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-5 relative flex items-center gap-3 rounded-2xl bg-white/85 backdrop-blur-sm border border-ink/10 shadow-[0_4px_24px_-6px_rgba(28,18,38,0.10)] px-4 py-2.5 focus-within:border-ink/30 transition-colors"
      >
        <SparkIcon />
        <div className="flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={streaming ? '她在说…' : '输入你想了解的问题...'}
            disabled={streaming}
            className="w-full bg-transparent outline-none font-zh text-[14px] text-ink placeholder:text-ink-faint leading-tight"
          />
          <div className="font-mono text-[10px] tracking-[0.18em] text-ink-faint/80 mt-0.5">
            ASK ANYTHING ABOUT JIANGXI
          </div>
        </div>
        <button
          type="button"
          onClick={toggleVoice}
          title={voice ? 'voice on' : 'voice off'}
          className="p-1.5 rounded-full text-ink-faint hover:text-ink focus-ring"
        >
          {voice ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
        <button
          type="button"
          onClick={startOver}
          title="开新对话"
          className="p-1.5 rounded-full text-ink-faint hover:text-ink focus-ring"
        >
          <RotateCcw size={12} />
        </button>
        {streaming ? (
          <button
            type="button"
            onClick={cancel}
            className="grid place-items-center w-9 h-9 rounded-full bg-ink/85 text-paper hover:bg-ink focus-ring"
            aria-label="stop"
          >
            <Square size={11} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="grid place-items-center w-9 h-9 rounded-full bg-[#a08fd0] text-paper disabled:opacity-30 disabled:cursor-not-allowed hover:brightness-110 focus-ring transition-all"
            aria-label="send"
          >
            <ArrowUp size={14} />
          </button>
        )}
      </form>
    </div>
  );
}

/* ─── Bubbles ─────────────────────────────────────────────────── */

function AgentBubble({
  text,
  ts,
  streaming,
}: {
  text: string;
  ts: number;
  streaming: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 mt-0.5 w-9 h-9 rounded-full grid place-items-center bg-gradient-to-br from-[#cdb8e6] to-[#9c83c4] text-white text-[14px] shadow-[0_2px_8px_rgba(160,143,208,0.35)]">
        ✦
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-mute mb-1">
          <span className="text-ink">AGENT</span>
          {ts > 0 && <span className="text-ink-faint">{formatTime(ts)}</span>}
        </div>
        <p className="font-zh text-ink text-[15px] leading-[1.85] whitespace-pre-wrap">
          {text}
          {streaming && (
            <span className="inline-block w-[3px] h-[14px] ml-1 bg-neon-magenta align-middle animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
}

function UserBubble({ text, ts }: { text: string; ts: number }) {
  return (
    <div className="flex items-start gap-3 justify-end">
      <div className="min-w-0 flex flex-col items-end max-w-[70%]">
        <div className="flex items-baseline gap-2 font-mono text-[10px] tracking-[0.22em] uppercase text-ink-mute mb-1 justify-end">
          {ts > 0 && <span className="text-ink-faint">{formatTime(ts)}</span>}
          <span className="text-ink">YOU</span>
        </div>
        <div className="rounded-2xl rounded-tr-md bg-[#e9e0f4]/80 border border-[#cebce5]/60 px-4 py-2.5 font-zh text-ink text-[14.5px] leading-[1.7]">
          {text}
        </div>
      </div>
      <div className="shrink-0 mt-0.5 w-9 h-9 rounded-full grid place-items-center bg-white border border-ink/15 text-ink-mute">
        <UserIcon />
      </div>
    </div>
  );
}

function CardChip({
  card,
  active,
  onClick,
}: {
  card: SuggestionCard;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl px-3.5 py-3 border transition-all focus-ring ${
        active
          ? 'border-[#a08fd0] bg-[#ece4f5]/70 shadow-[0_2px_12px_-4px_rgba(160,143,208,0.45)]'
          : 'border-ink/15 bg-white/60 hover:bg-white/80 hover:border-ink/30'
      }`}
    >
      <div className="flex items-center gap-2 font-zh text-ink text-[13.5px]">
        <span className="text-ink-faint text-[12px]">{card.icon}</span>
        <span>{card.title}</span>
      </div>
      <div className="font-zh text-ink-mute text-[11.5px] mt-1 leading-snug">
        {card.subtitle}
      </div>
    </button>
  );
}

function SparkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#a08fd0] shrink-0">
      <path
        d="M8 1.5l1.4 4.1L13.5 7l-4.1 1.4L8 12.5 6.6 8.4 2.5 7l4.1-1.4L8 1.5z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="5" r="2.4" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M2.5 12c.7-2 2.4-3 4.5-3s3.8 1 4.5 3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
