import { useEffect, useRef, useState } from 'react';
import { playKeySound, type SwitchType } from '../../lib/keySound';

const SWITCHES: { key: SwitchType; label: string }[] = [
  { key: 'blue', label: '청축' },
  { key: 'brown', label: '갈축' },
  { key: 'red', label: '적축' },
  { key: 'silent', label: '무접점' },
];

export function KeyboardSound() {
  const [type, setType] = useState<SwitchType>('blue');
  const [count, setCount] = useState(0);
  // guards the on-screen pad against firing twice for one physical press -
  // pointerdown can otherwise double-fire (e.g. a drag re-entering the pad)
  const pressedRef = useRef(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;
      playKeySound(type);
      setCount((c) => c + 1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [type]);

  useEffect(() => {
    function up() {
      pressedRef.current = false;
    }
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  function press() {
    if (pressedRef.current) return;
    pressedRef.current = true;
    playKeySound(type);
    setCount((c) => c + 1);
  }

  return (
    <div className="mini-game">
      <div className="pill-toggle" style={{ marginBottom: 14 }}>
        {SWITCHES.map((s) => (
          <button key={s.key} className={type === s.key ? 'active' : ''} onClick={() => setType(s.key)}>
            {s.label}
          </button>
        ))}
      </div>
      <button className="keysound-pad" onPointerDown={press}>
        <div style={{ fontSize: 40 }}>⌨️</div>
        <div className="muted" style={{ marginTop: 8 }}>
          키보드를 눌러보세요 ({count}타)
        </div>
      </button>
    </div>
  );
}
