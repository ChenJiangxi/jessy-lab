/**
 * Session identity + minimal client prefs.
 *
 * Identity is just a UUID kept in localStorage. The server stores the
 * conversation history keyed by this id (sway-lab pattern). No cookies,
 * no visitor table, no server-side identity beyond "messages with this id".
 */

const SESSION_KEY = 'personal_site/session_id';
const PREFS_KEY = 'personal_site/prefs';

export type Prefs = { voice: boolean };
const DEFAULT_PREFS: Prefs = { voice: true };

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — silently ignore */
  }
}

function safeSetRaw(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function getSessionId(): string {
  let id = '';
  try {
    id = localStorage.getItem(SESSION_KEY) ?? '';
  } catch {
    /* ignore */
  }
  if (!id) {
    id = crypto.randomUUID();
    safeSetRaw(SESSION_KEY, id);
  }
  return id;
}

/** Force a fresh session — drops the old id, returns a new one. */
export function newSession(): string {
  const id = crypto.randomUUID();
  safeSetRaw(SESSION_KEY, id);
  return id;
}

export function getPrefs(): Prefs {
  return { ...DEFAULT_PREFS, ...safeGet<Partial<Prefs>>(PREFS_KEY, {}) };
}

export function setPrefs(patch: Partial<Prefs>) {
  safeSet(PREFS_KEY, { ...getPrefs(), ...patch });
}
