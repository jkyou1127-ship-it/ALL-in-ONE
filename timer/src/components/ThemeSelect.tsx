import { useEffect, useRef, useState } from 'react';
import { getTheme, visibleThemes, type ThemeId } from '../lib/themes';

export function ThemeSelect({
  value,
  onChange,
  currentCharacterId,
}: {
  value: ThemeId;
  onChange: (id: ThemeId) => void;
  currentCharacterId: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = getTheme(value);
  const themes = visibleThemes(currentCharacterId);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
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
    <div className="theme-picker" ref={rootRef}>
      <button
        type="button"
        className="icon-btn"
        aria-label="테마 선택"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="theme-picker__dot" style={{ background: current.swatch }} />
      </button>
      {open && (
        <div className="theme-picker__menu" role="listbox">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={t.id === value}
              className={`theme-picker__option${t.id === value ? ' active' : ''}`}
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
            >
              <span className="theme-picker__swatch" style={{ background: t.swatch }} />
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
