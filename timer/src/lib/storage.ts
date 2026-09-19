import type { Settings, Solve } from '../types';
import { defaultSessionId } from './sessions';

const SOLVES_KEY = 'cube_app.solves.v1';
const SETTINGS_KEY = 'cube_app.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  dailyGoal: 10,
  reminderEnabled: false,
  reminderTime: '19:00',
  lastOpenedAt: null,
  inspectionEnabled: true,
  mascotCharacter: 'blob-blue',
  currentEvent: '333',
  currentSessionId: defaultSessionId('333'),
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadSolves(): Solve[] {
  const raw = localStorage.getItem(SOLVES_KEY);
  const solves = safeParse<Solve[]>(raw, []);
  for (const s of solves) {
    // older records saved before events were introduced default to 3x3x3
    if (!s.event) s.event = '333';
    // older records saved before sessions were introduced land in that event's default session
    if (!s.sessionId) s.sessionId = defaultSessionId(s.event);
  }
  return solves.sort((a, b) => b.date - a.date);
}

export function saveSolves(solves: Solve[]): void {
  try {
    localStorage.setItem(SOLVES_KEY, JSON.stringify(solves));
  } catch {
    // localStorage full / unavailable - silently ignore, in-memory state still works
  }
}

export function loadSettings(): Settings {
  const raw = localStorage.getItem(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...safeParse<Partial<Settings>>(raw, {}) };
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function makeSolveId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
