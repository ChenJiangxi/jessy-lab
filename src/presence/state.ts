/**
 * Reducer for the presence system.
 *
 * Two semi-independent axes drive everything visible:
 *   - depth (0..4):   how many user turns. monotonic; auto-advanced.
 *   - clarity (0..100): how revealed she is. agent-controlled via the
 *     advance_clarity tool. monotonic.
 *
 * presenceMode is derived from clarity:
 *   < 10  → signal   (flickering glass, almost invisible)
 *   < 40  → flame    (full flame, no portrait)
 *   < 75  → figure   (portrait bleeds through faintly)
 *   ≥ 75  → portrait (portrait dominates, flame becomes halo)
 */

export type PresenceMode = 'signal' | 'flame' | 'figure' | 'portrait';

export type ThreadId =
  | 'research_system'
  | 'creation_product'
  | 'memory_aesthetic'
  | 'body_world'
  | 'inner_core';

export type Mood = 'warm' | 'cold' | 'dreamy' | 'intimate';

export type RevealedCard = { kind: 'project' | 'paper'; id: string };

export type State = {
  depth: number;            // 0..4
  clarity: number;          // 0..100
  activeThread: ThreadId | null;
  revealedCards: RevealedCard[];
  mood: Mood;
};

export const INITIAL: State = {
  depth: 0,
  clarity: 0,
  activeThread: null,
  revealedCards: [],
  mood: 'warm',
};

export type Action =
  | { type: 'user_turn' }
  | { type: 'advance_clarity'; value: number }
  | { type: 'reveal_thread'; id: ThreadId }
  | { type: 'reveal_card'; kind: 'project' | 'paper'; id: string }
  | { type: 'shift_mood'; mood: Mood }
  | { type: 'hydrate'; depth: number; clarity: number };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'user_turn': {
      const next = Math.min(4, state.depth + (state.depth < 4 ? 1 : 0));
      return { ...state, depth: next };
    }
    case 'advance_clarity':
      return { ...state, clarity: Math.max(state.clarity, Math.min(100, action.value)) };
    case 'reveal_thread':
      return { ...state, activeThread: action.id };
    case 'reveal_card': {
      const exists = state.revealedCards.some(
        (c) => c.kind === action.kind && c.id === action.id,
      );
      if (exists) return state;
      const next = [...state.revealedCards, { kind: action.kind, id: action.id }];
      return { ...state, revealedCards: next.slice(-3) };
    }
    case 'shift_mood':
      return { ...state, mood: action.mood };
    case 'hydrate':
      return {
        ...state,
        depth: Math.max(state.depth, action.depth),
        clarity: Math.max(state.clarity, action.clarity),
      };
    default:
      return state;
  }
}

export function presenceMode(clarity: number): PresenceMode {
  if (clarity < 10) return 'signal';
  if (clarity < 40) return 'flame';
  if (clarity < 75) return 'figure';
  return 'portrait';
}

/** clarity drift: each user turn nudges clarity up by 6, capped at 60.
 *  Reaching ≥ 60 still requires the agent to call advance_clarity. */
export function driftClarity(prev: number, depth: number): number {
  const baseline = Math.min(60, depth * 12);
  return Math.max(prev, baseline);
}
