import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Soul editor — paste a key, edit the agent's `systemPrompt` and `memory`.
 * Pattern lifted from sway-lab/admin/agent.tsx, restyled to match the
 * pale-lavender chrome of this site.
 *
 * Auth: shared secret in `ADMIN_SECRET_KEY` env. Verified via /api/admin/verify;
 * cached in localStorage so a refresh doesn't kick you out.
 */
type View = 'gate' | 'loading' | 'editor';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const KEY_STORAGE = 'personal_site/admin_key';

export default function Admin() {
  const [view, setView] = useState<View>('gate');
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [memory, setMemory] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const keyInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(KEY_STORAGE);
    if (saved) {
      setAdminKey(saved);
      setView('loading');
    }
  }, []);

  useEffect(() => {
    if (view !== 'loading' || !adminKey) return;
    let aborted = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/config?key=${encodeURIComponent(adminKey)}`);
        if (!res.ok) {
          if (aborted) return;
          localStorage.removeItem(KEY_STORAGE);
          setAdminKey('');
          setKeyError('SESSION EXPIRED — re-enter key');
          setView('gate');
          return;
        }
        const json = (await res.json()) as { systemPrompt: string; memory: string };
        if (aborted) return;
        setSystemPrompt(json.systemPrompt);
        setMemory(json.memory);
        setView('editor');
      } catch {
        if (aborted) return;
        setKeyError('NETWORK ERROR');
        setView('gate');
      }
    })();
    return () => {
      aborted = true;
    };
  }, [view, adminKey]);

  const submitKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const k = keyInput.trim();
    if (!k) return;
    setVerifying(true);
    setKeyError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: k }),
      });
      if (!res.ok) {
        setKeyError('ACCESS DENIED — invalid key');
        setKeyInput('');
        keyInputRef.current?.focus();
        return;
      }
      localStorage.setItem(KEY_STORAGE, k);
      setAdminKey(k);
      setView('loading');
    } catch {
      setKeyError('NETWORK ERROR');
    } finally {
      setVerifying(false);
    }
  };

  const save = async () => {
    if (!adminKey) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: adminKey, systemPrompt, memory }),
      });
      if (!res.ok) {
        setSaveStatus('error');
      } else {
        setSaveStatus('saved');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      window.setTimeout(() => setSaveStatus('idle'), 1800);
    }
  };

  const logout = () => {
    localStorage.removeItem(KEY_STORAGE);
    setAdminKey('');
    setKeyInput('');
    setSystemPrompt('');
    setMemory('');
    setView('gate');
  };

  return (
    <div className="min-h-screen w-full text-ink paper-wash relative">
      <div className="absolute inset-0 z-0 pointer-events-none dot-grid" />
      <div className="grain" />

      <header className="relative z-10 px-8 pt-6 flex items-center justify-between font-mono text-[10px] tracking-[0.3em] uppercase text-ink-mute">
        <Link to="/" className="hover:text-ink">← back to flame</Link>
        <span>admin · soul editor</span>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        {view === 'gate' && (
          <div className="border border-ink/30 bg-paper/70 backdrop-blur-sm p-8 mt-12">
            <div className="font-mono text-[10px] tracking-[0.35em] uppercase text-ink-mute mb-4">
              ACCESS_CONTROL.SYS
            </div>
            <p className="font-zh text-sm text-ink-soft mb-6">
              这一页只有姜希自己能进来。<br />
              输入 <span className="font-mono text-[12px]">ADMIN_SECRET_KEY</span>。
            </p>
            <form onSubmit={submitKey} className="space-y-3">
              <div className="flex items-center gap-2 border border-ink/40 px-3 py-2 bg-white/40">
                <span className="font-mono text-ink">{'>'}</span>
                <input
                  ref={keyInputRef}
                  type="password"
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    setKeyError('');
                  }}
                  placeholder="enter access key…"
                  autoFocus
                  className="flex-1 bg-transparent font-mono text-sm text-ink placeholder:text-ink-faint outline-none"
                />
              </div>
              {keyError && (
                <p className="font-mono text-[11px] tracking-wider text-rose-700/80">{keyError}</p>
              )}
              <button
                type="submit"
                disabled={verifying || !keyInput.trim()}
                className="w-full bg-ink text-paper font-mono text-[11px] tracking-[0.3em] uppercase py-2.5 disabled:opacity-30 hover:bg-ink-soft transition-colors"
              >
                {verifying ? 'VERIFYING…' : 'AUTHENTICATE'}
              </button>
            </form>
          </div>
        )}

        {view === 'loading' && (
          <div className="text-center py-32 font-mono text-[12px] tracking-[0.3em] uppercase text-ink-mute">
            loading config<span className="inline-block w-[2px] h-3 ml-2 bg-ink animate-pulse align-middle" />
          </div>
        )}

        {view === 'editor' && (
          <div className="space-y-6">
            <div className="flex items-end justify-between mb-2">
              <div>
                <h1 className="font-display text-2xl text-ink">Agent Configuration</h1>
                <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink-mute mt-1">
                  changes apply on next chat (60s cache invalidated on save)
                </p>
              </div>
              <button
                onClick={logout}
                className="font-mono text-[10px] tracking-[0.25em] uppercase border border-ink/40 px-3 py-1.5 text-ink-mute hover:text-ink hover:border-ink"
              >
                LOGOUT
              </button>
            </div>

            <Section title="SYSTEM_PROMPT" subtitle="persona / behavior / tool rules">
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={20}
                className="w-full bg-white/50 border border-ink/30 text-[13px] font-mono text-ink p-3 outline-none resize-y leading-relaxed focus:border-neon-magenta transition-colors"
              />
            </Section>

            <Section title="MEMORY" subtitle="background / context — agent reads this verbatim">
              <textarea
                value={memory}
                onChange={(e) => setMemory(e.target.value)}
                rows={14}
                placeholder="例如：今天有人在邮件里问起 AuraMate；最近在读《重新思考》；本周想推进 FateCouncil 的 onboarding…"
                className="w-full bg-white/50 border border-ink/30 text-[13px] font-mono text-ink p-3 outline-none resize-y leading-relaxed focus:border-neon-magenta transition-colors placeholder:text-ink-faint"
              />
            </Section>

            <div className="flex items-center justify-between">
              <button
                onClick={save}
                disabled={saveStatus === 'saving'}
                className="bg-ink text-paper font-mono text-[11px] tracking-[0.3em] uppercase px-8 py-2.5 disabled:opacity-30 hover:bg-ink-soft transition-colors"
              >
                {saveStatus === 'saving'
                  ? 'SAVING…'
                  : saveStatus === 'saved'
                    ? 'SAVED ✓'
                    : saveStatus === 'error'
                      ? 'ERROR — RETRY'
                      : 'SAVE'}
              </button>
              <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-ink-faint">
                applies to all sessions
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-ink/30 bg-paper/70 backdrop-blur-sm">
      <div className="px-4 py-2 flex items-center justify-between bg-ink text-paper">
        <span className="font-mono text-[11px] tracking-[0.3em] uppercase">{title}</span>
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-paper/60">
          {subtitle}
        </span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
