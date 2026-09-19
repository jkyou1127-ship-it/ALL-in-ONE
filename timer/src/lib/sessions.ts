import type { EventId } from './events';
import type { Session } from '../types';

const SESSIONS_KEY = 'cube_app.sessions.v1';

export function defaultSessionId(event: EventId): string {
  return `default-${event}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSessions(): Session[] {
  const raw = localStorage.getItem(SESSIONS_KEY);
  return safeParse<Session[]>(raw, []);
}

export function saveSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage full / unavailable - silently ignore, in-memory state still works
  }
}

export function makeSessionId(): string {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** every event needs at least one session to hold its solves - create the default one on demand */
export function ensureDefaultSession(sessions: Session[], event: EventId): Session[] {
  const id = defaultSessionId(event);
  if (sessions.some((s) => s.id === id)) return sessions;
  return [...sessions, { id, event, name: '세션 1', createdAt: Date.now() }];
}

/** picks which session should become active when switching to `event` - the most recently
 * created one that already belongs to it, creating the default session if it has none yet */
export function resolveSessionForEvent(sessions: Session[], event: EventId): { sessions: Session[]; sessionId: string } {
  const forEvent = sessions.filter((s) => s.event === event);
  if (forEvent.length > 0) {
    const latest = forEvent.reduce((a, b) => (b.createdAt > a.createdAt ? b : a));
    return { sessions, sessionId: latest.id };
  }
  const next = ensureDefaultSession(sessions, event);
  return { sessions: next, sessionId: defaultSessionId(event) };
}
