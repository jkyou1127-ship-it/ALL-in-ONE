import type { CharacterId } from './lib/mascotCharacters';
import type { EventId } from './lib/events';
import type { ThemeId } from './lib/themes';

export type Penalty = null | '+2' | 'DNF';

export interface Solve {
  id: string;
  ms: number;
  scramble: string;
  date: number;
  penalty: Penalty;
  event: EventId;
  sessionId: string;
}

export interface Session {
  id: string;
  event: EventId;
  name: string;
  createdAt: number;
}

export interface Settings {
  theme: ThemeId;
  dailyGoal: number;
  reminderEnabled: boolean;
  reminderTime: string;
  lastOpenedAt: number | null;
  inspectionEnabled: boolean;
  mascotCharacter: CharacterId;
  currentEvent: EventId;
  currentSessionId: string;
}

export type TabKey = 'timer' | 'records' | 'fun';
