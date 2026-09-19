import type { Solve } from '../types';
import { dateKey } from './time';

/** Effective time in ms including penalty; null means DNF. */
export function effectiveMs(solve: Solve): number | null {
  if (solve.penalty === 'DNF') return null;
  if (solve.penalty === '+2') return solve.ms + 2000;
  return solve.ms;
}

/** Best single solve (lowest effective time, DNF excluded). Solves can be in any order. */
export function bestOf(solves: Solve[]): Solve | null {
  let best: Solve | null = null;
  let bestMs = Infinity;
  for (const s of solves) {
    const ms = effectiveMs(s);
    if (ms !== null && ms < bestMs) {
      bestMs = ms;
      best = s;
    }
  }
  return best;
}

/**
 * WCA-style trimmed average of the most recent `n` solves (best result first).
 * Trims the single best and single worst result, averages the remainder.
 * Returns null if there aren't yet `n` solves, 'DNF' if the average itself is a DNF.
 */
export function average(solvesNewestFirst: Solve[], n: number): number | 'DNF' | null {
  if (solvesNewestFirst.length < n) return null;
  const recent = solvesNewestFirst.slice(0, n);
  const values = recent.map(effectiveMs);
  const dnfCount = values.filter((v) => v === null).length;
  if (dnfCount >= 2) return 'DNF';

  const sorted = [...values].sort((a, b) => (a ?? Infinity) - (b ?? Infinity));
  const trimmed = sorted.slice(1, sorted.length - 1);
  if (trimmed.some((v) => v === null)) return 'DNF';

  const sum = trimmed.reduce<number>((acc, v) => acc + (v as number), 0);
  return Math.round(sum / trimmed.length);
}

/** Simple (non-trimmed) mean of all non-DNF solves in the given list. */
export function sessionMean(solves: Solve[]): number | null {
  const values = solves.map(effectiveMs).filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function countByDate(solves: Solve[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of solves) {
    if (s.penalty === 'DNF') continue;
    const key = dateKey(s.date);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

export function todayCount(solves: Solve[], today: Date = new Date()): number {
  return countByDate(solves).get(dateKey(today)) ?? 0;
}

/** Consecutive days (ending today) where the daily solve goal was met. */
export function computeStreak(solves: Solve[], goal: number, today: Date = new Date()): number {
  if (goal <= 0) return 0;
  const counts = countByDate(solves);
  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < 3650; offset++) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - offset);
    const met = (counts.get(dateKey(d)) ?? 0) >= goal;

    if (met) {
      streak++;
    } else if (offset === 0) {
      // today isn't over yet - not meeting the goal (yet) doesn't break the streak
      continue;
    } else {
      break;
    }
  }
  return streak;
}
