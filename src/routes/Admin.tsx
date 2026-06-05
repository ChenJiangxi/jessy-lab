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
type Tab = 'soul' | 'conv';

const KEY_STORAGE = 'personal_site/admin_key';

type SessionSummary = {
  sessionId: string;
  msgCount: number;
  firstAt: number;
  lastAt: number;
  firstUserSnippet: string;
  lastSnippet: string;
  lastRole: 'user' | 'assistant' | '';
};

type StoredMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
};

export default function Admin() {
  const [view, setView] = useState<View>('gate');
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [memory, setMemory] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [tab, setTab] = useState<Tab>('soul');
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
                  {tab === 'soul'
                    ? 'changes apply on next chat (60s cache invalidated on save)'
                    : 'visitor conversations · anonymous · session-id keyed'}
                </p>
              </div>
              <button
                onClick={logout}
                className="font-mono text-[10px] tracking-[0.25em] uppercase border border-ink/40 px-3 py-1.5 text-ink-mute hover:text-ink hover:border-ink"
              >
                LOGOUT
              </button>
            </div>

            {/* tab switcher */}
            <div className="flex gap-2 font-mono text-[11px] tracking-[0.3em] uppercase">
              <TabButton active={tab === 'soul'} onClick={() => setTab('soul')}>
                Soul
              </TabButton>
              <TabButton active={tab === 'conv'} onClick={() => setTab('conv')}>
                Conversations
              </TabButton>
            </div>

            {tab === 'soul' && (
              <>
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
              </>
            )}

            {tab === 'conv' && <ConversationsPanel adminKey={adminKey} />}
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

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'px-4 py-2 border transition-colors ' +
        (active
          ? 'bg-ink text-paper border-ink'
          : 'bg-paper/40 text-ink-mute border-ink/30 hover:text-ink hover:border-ink')
      }
    >
      {children}
    </button>
  );
}

/* ============================================================================
   ConversationsPanel — master-detail layout.
   Left: sessions list (search + dual-snippet + relative time).
   Right: sticky thread pane.
   Mobile (<lg): stacks; list collapses when a thread is open.
============================================================================ */

function ConversationsPanel({ adminKey }: { adminKey: string }) {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [thread, setThread] = useState<StoredMessage[] | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [query, setQuery] = useState('');

  const fetchSessions = async () => {
    setRefreshing(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/conversations?key=${encodeURIComponent(adminKey)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { sessions: SessionSummary[] };
      setSessions(json.sessions);
    } catch (e: any) {
      setError(e?.message || 'failed to load');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSession = async (id: string) => {
    setActiveId(id);
    setThread(null);
    setThreadLoading(true);
    try {
      const res = await fetch(
        `/api/admin/conversation?key=${encodeURIComponent(adminKey)}&id=${encodeURIComponent(id)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { messages: StoredMessage[] };
      setThread(json.messages);
    } catch {
      setThread([]);
    } finally {
      setThreadLoading(false);
    }
  };

  const deleteSession = async (id: string) => {
    if (!window.confirm('删除这条 session 的所有消息？此操作无法撤销。')) return;
    try {
      const res = await fetch(
        `/api/admin/conversation?key=${encodeURIComponent(adminKey)}&id=${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (activeId === id) {
        setActiveId(null);
        setThread(null);
      }
      fetchSessions();
    } catch (e: any) {
      window.alert('删除失败：' + (e?.message || 'unknown'));
    }
  };

  const filtered = sessions
    ? sessions.filter((s) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return (
          s.firstUserSnippet.toLowerCase().includes(q) ||
          s.lastSnippet.toLowerCase().includes(q) ||
          s.sessionId.toLowerCase().includes(q)
        );
      })
    : null;

  const active = activeId && sessions ? sessions.find((s) => s.sessionId === activeId) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] gap-4">
      {/* LEFT — sessions list */}
      <aside
        className={
          'border border-ink/30 bg-paper/70 backdrop-blur-sm flex flex-col ' +
          'lg:max-h-[calc(100vh-220px)] ' +
          (activeId ? 'hidden lg:flex' : 'flex')
        }
      >
        <div className="px-4 py-2 flex items-center justify-between bg-ink text-paper shrink-0">
          <span className="font-mono text-[11px] tracking-[0.3em] uppercase">SESSIONS</span>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-paper/60">
            {sessions
              ? `${filtered?.length ?? 0}/${sessions.length} · max 200`
              : '…'}
          </span>
        </div>

        <div className="px-3 pt-3 pb-2 shrink-0 space-y-2">
          <div className="flex items-center gap-2 border border-ink/30 px-2 py-1 bg-white/40">
            <span className="font-mono text-[11px] text-ink-faint">⌕</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜首条 / 末条 / id…"
              className="flex-1 bg-transparent font-zh text-[12px] text-ink placeholder:text-ink-faint outline-none min-w-0"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="font-mono text-[10px] text-ink-faint hover:text-ink shrink-0"
                title="clear"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-ink-faint">
              newest activity first
            </span>
            <button
              onClick={fetchSessions}
              disabled={refreshing}
              className="font-mono text-[9px] tracking-[0.25em] uppercase border border-ink/40 px-2 py-0.5 text-ink-mute hover:text-ink hover:border-ink disabled:opacity-30"
            >
              {refreshing ? 'REFRESH…' : 'REFRESH'}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {error && (
            <p className="font-mono text-[11px] tracking-wider text-rose-700/80 px-3 py-3">
              {error}
            </p>
          )}
          {!sessions && !error && (
            <p className="font-mono text-[11px] tracking-[0.2em] text-ink-faint px-3 py-4">
              loading…
            </p>
          )}
          {sessions && sessions.length === 0 && (
            <p className="font-zh text-[13px] text-ink-mute px-3 py-4">
              还没有访客对话过。等等看。
            </p>
          )}
          {sessions && sessions.length > 0 && filtered && filtered.length === 0 && (
            <p className="font-zh text-[12px] text-ink-mute px-3 py-4">
              没匹配上「{query}」。
            </p>
          )}
          {filtered && filtered.length > 0 && (
            <ul className="divide-y divide-ink/10">
              {filtered.map((s) => {
                const isActive = activeId === s.sessionId;
                return (
                  <li
                    key={s.sessionId}
                    className={
                      'group relative ' +
                      (isActive
                        ? 'bg-ink/5 border-l-2 border-l-neon-magenta'
                        : 'border-l-2 border-l-transparent hover:bg-ink/[0.03]')
                    }
                  >
                    <button
                      onClick={() => openSession(s.sessionId)}
                      className="text-left w-full px-3 py-2.5 min-w-0"
                    >
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-mono text-[9px] tracking-[0.2em] text-ink-faint shrink-0">
                          {s.sessionId.slice(0, 6)}
                        </span>
                        <span className="font-mono text-[9px] tracking-[0.2em] text-ink-mute shrink-0">
                          ×{s.msgCount}
                        </span>
                        <span className="font-mono text-[9px] tracking-[0.2em] text-ink-faint shrink-0 ml-auto">
                          {fmtRelative(s.lastAt)}
                        </span>
                      </div>
                      <div
                        className={
                          'font-zh text-[12px] leading-snug line-clamp-2 ' +
                          (isActive ? 'text-ink' : 'text-ink-soft')
                        }
                      >
                        {s.firstUserSnippet || '(empty)'}
                      </div>
                      {s.lastSnippet && s.lastSnippet !== s.firstUserSnippet && (
                        <div className="flex gap-1.5 mt-1 items-baseline">
                          <span
                            className={
                              'font-mono text-[8px] tracking-[0.2em] uppercase shrink-0 ' +
                              (s.lastRole === 'user'
                                ? 'text-neon-magenta'
                                : 'text-ink-faint')
                            }
                          >
                            {s.lastRole === 'user' ? '→u' : '←a'}
                          </span>
                          <span className="font-zh text-[11px] text-ink-faint line-clamp-1 min-w-0">
                            {s.lastSnippet}
                          </span>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* RIGHT — thread pane */}
      <section
        className={
          'border border-ink/30 bg-paper/70 backdrop-blur-sm flex flex-col ' +
          'lg:max-h-[calc(100vh-220px)] lg:sticky lg:top-4 ' +
          (activeId ? 'flex' : 'hidden lg:flex')
        }
      >
        {!activeId && (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-ink-faint">
              select a session
            </p>
          </div>
        )}

        {activeId && (
          <>
            <div className="px-4 py-2 flex items-center justify-between bg-ink text-paper shrink-0">
              <div className="flex items-baseline gap-3 min-w-0">
                <button
                  onClick={() => {
                    setActiveId(null);
                    setThread(null);
                  }}
                  className="lg:hidden font-mono text-[11px] tracking-[0.3em] uppercase text-paper/70 hover:text-paper shrink-0"
                  title="back to list"
                >
                  ← LIST
                </button>
                <span className="font-mono text-[11px] tracking-[0.3em] uppercase">THREAD</span>
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-paper/60 truncate">
                  {activeId.slice(0, 12)}…
                  {active && ` · ${active.msgCount} msg`}
                  {active && ` · ${fmtTime(active.firstAt)} → ${fmtTime(active.lastAt)}`}
                </span>
              </div>
              <button
                onClick={() => deleteSession(activeId)}
                className="font-mono text-[9px] tracking-[0.25em] uppercase text-paper/60 hover:text-rose-300 shrink-0 ml-2"
                title="delete this session"
              >
                DEL
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-3">
              {threadLoading && (
                <p className="font-mono text-[11px] tracking-[0.2em] text-ink-faint py-4">
                  loading thread…
                </p>
              )}
              {!threadLoading && thread && thread.length === 0 && (
                <p className="font-zh text-[13px] text-ink-mute py-4">
                  这条 session 没有内容（可能刚被清掉）。
                </p>
              )}
              {!threadLoading && thread && thread.length > 0 && (
                <ol className="space-y-3">
                  {thread.map((m) => (
                    <li
                      key={m.id}
                      className={
                        'border-l-2 pl-3 py-1 ' +
                        (m.role === 'user' ? 'border-neon-magenta/60' : 'border-ink/40')
                      }
                    >
                      <div className="flex items-baseline gap-3 mb-1 font-mono text-[10px] tracking-[0.25em] uppercase">
                        <span
                          className={
                            m.role === 'user' ? 'text-neon-magenta' : 'text-ink-mute'
                          }
                        >
                          {m.role}
                        </span>
                        <span className="text-ink-faint">{fmtTime(m.createdAt)}</span>
                      </div>
                      <div className="font-zh text-[13px] text-ink leading-relaxed whitespace-pre-wrap break-words">
                        {m.content}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function fmtTime(ts: number): string {
  // CST display, no library — keep it tight.
  const d = new Date(ts);
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return fmt.format(d).replace(/,/g, '').replace(/\//g, '-');
}

function fmtRelative(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(mo / 12)}y`;
}
