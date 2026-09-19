import { useEffect, useRef, useState } from 'react';

export interface ModeOption<K extends string> {
  key: K;
  label: string;
  /** renders a thin divider above this option - e.g. to set apart an admin-only section */
  dividerBefore?: boolean;
}

interface Props<K extends string> {
  value: K;
  options: ModeOption<K>[];
  onChange: (key: K) => void;
}

// A collapsible dropdown list for screens with too many tabs to fit in one
// scrolling chip row (the fun tab picked up 11+ modes once the admin arcade
// was added, and several were getting clipped off-screen).
export function ModeSelect<K extends string>({ value, options, onChange }: Props<K>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.key === value) ?? options[0];

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
    <div className="mode-select" ref={rootRef}>
      <button type="button" className="mode-select__trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{current?.label}</span>
        <span className={`mode-select__chevron${open ? ' open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="mode-select__menu" role="listbox">
          {options.map((o) => (
            <div key={o.key}>
              {o.dividerBefore && <div className="mode-select__divider" />}
              <button
                type="button"
                role="option"
                aria-selected={o.key === value}
                className={`mode-select__option${o.key === value ? ' active' : ''}`}
                onClick={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
              >
                {o.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
