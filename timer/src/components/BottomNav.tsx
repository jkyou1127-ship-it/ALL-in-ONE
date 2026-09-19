import type { ReactElement } from 'react';
import type { TabKey } from '../types';

const ITEMS: { key: TabKey; label: string; icon: ReactElement }[] = [
  {
    key: 'timer',
    label: '타이머',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l3 2" />
        <path d="M9 2h6" />
      </svg>
    ),
  },
  {
    key: 'records',
    label: '내 기록',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 15l4-5 3 3 5-7" />
      </svg>
    ),
  },
  {
    key: 'fun',
    label: '심심풀이',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l2.4 5.4L20 9l-4.6 3.6L17 18l-5-3.2L7 18l1.6-5.4L4 9l5.6-1.6z" />
      </svg>
    ),
  },
];

export function BottomNav({ active, onChange }: { active: TabKey; onChange: (tab: TabKey) => void }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <button
          key={item.key}
          className={`bottom-nav__item${active === item.key ? ' active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
