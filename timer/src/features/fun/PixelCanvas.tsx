import { useEffect, useRef, useState } from 'react';

const GRID = 16;
const PALETTE = [
  '#1b1c21',
  '#ffffff',
  '#e0362f',
  '#f2822a',
  '#ffc02e',
  '#17a34a',
  '#3b6cf6',
  '#7c4dff',
  '#ec4899',
  '#94a3b8',
];

export function PixelCanvas() {
  const [cells, setCells] = useState<(string | null)[]>(() => Array(GRID * GRID).fill(null));
  const [color, setColor] = useState(PALETTE[0]);
  const [erasing, setErasing] = useState(false);
  const drawingRef = useRef(false);

  useEffect(() => {
    function up() {
      drawingRef.current = false;
    }
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  function paint(i: number) {
    const next = erasing ? null : color;
    setCells((prev) => {
      if (prev[i] === next) return prev;
      const copy = prev.slice();
      copy[i] = next;
      return copy;
    });
  }

  function clearAll() {
    setCells(Array(GRID * GRID).fill(null));
  }

  return (
    <div className="mini-game">
      <div className="pixel-toolbar">
        {PALETTE.map((c) => (
          <button
            key={c}
            className={`palette-swatch${!erasing && color === c ? ' active' : ''}`}
            style={{ background: c }}
            aria-label={`색상 ${c}`}
            onClick={() => {
              setColor(c);
              setErasing(false);
            }}
          />
        ))}
        <button
          className={`palette-swatch palette-swatch--eraser${erasing ? ' active' : ''}`}
          aria-label="지우개"
          onClick={() => setErasing(true)}
        >
          ✕
        </button>
      </div>

      <div
        className="pixel-grid"
        style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}
        onPointerDown={() => {
          drawingRef.current = true;
        }}
      >
        {cells.map((c, i) => (
          <div
            key={i}
            className="pixel-cell"
            style={{ background: c ?? 'transparent' }}
            onPointerDown={() => paint(i)}
            onPointerEnter={() => {
              if (drawingRef.current) paint(i);
            }}
          />
        ))}
      </div>

      <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={clearAll}>
        전체 지우기
      </button>
    </div>
  );
}
