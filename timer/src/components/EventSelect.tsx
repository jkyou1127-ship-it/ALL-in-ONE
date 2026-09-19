import { useEffect, useRef, useState } from 'react';
import { EVENTS, getEvent, type EventId } from '../lib/events';

export function EventSelect({ value, onChange }: { value: EventId; onChange: (id: EventId) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = getEvent(value);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('pointerdown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="event-picker" ref={rootRef}>
      <button
        type="button"
        className="event-picker__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{current.name}</span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="event-picker__menu" role="listbox">
          {EVENTS.map((ev) => (
            <button
              key={ev.id}
              type="button"
              role="option"
              aria-selected={ev.id === value}
              className={`event-picker__option${ev.id === value ? ' active' : ''}`}
              onClick={() => {
                onChange(ev.id);
                setOpen(false);
              }}
            >
              {ev.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
