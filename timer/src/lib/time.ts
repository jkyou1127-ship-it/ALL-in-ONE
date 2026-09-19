export function formatTime(ms: number): string {
  const totalCs = Math.round(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60);

  const csStr = cs.toString().padStart(2, '0');
  const sStr = s.toString().padStart(m > 0 ? 2 : 1, '0');
  return m > 0 ? `${m}:${sStr}.${csStr}` : `${sStr}.${csStr}`;
}

export function formatSolveResult(ms: number, penalty: '+2' | 'DNF' | null): string {
  if (penalty === 'DNF') return 'DNF';
  const effective = penalty === '+2' ? ms + 2000 : ms;
  const base = formatTime(effective);
  return penalty === '+2' ? `${base}+` : base;
}

export function formatRelativeDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const hh = d.getHours();
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ampm = hh < 12 ? '오전' : '오후';
  const hh12 = hh % 12 === 0 ? 12 : hh % 12;
  const timeStr = `${ampm} ${hh12}:${mm}`;

  if (sameDay) return timeStr;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate();

  if (isYesterday) return `어제 ${timeStr}`;

  return `${d.getMonth() + 1}.${d.getDate()} ${timeStr}`;
}

export function dateKey(ts: number | Date): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts;
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}
