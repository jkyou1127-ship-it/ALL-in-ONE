import { useEffect, useRef, useState } from 'react';
import { playPop } from '../../lib/popSound';

const COLS = 8;
const ROWS = 12;

interface Props {
  cols?: number;
  rows?: number;
  /** extra class applied to unpopped bubbles, e.g. for a reskinned palette */
  bubbleClass?: string;
  label?: string;
}

export function BubbleWrap({ cols = COLS, rows = ROWS, bubbleClass = '', label = '남은 뽁뽁이' }: Props) {
  const total = cols * rows;
  const [popped, setPopped] = useState<boolean[]>(() => Array(total).fill(false));
  const drawingRef = useRef(false);

  useEffect(() => {
    function up() {
      drawingRef.current = false;
    }
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  function pop(i: number) {
    if (popped[i]) return;
    playPop();
    setPopped((prev) => {
      if (prev[i]) return prev;
      const next = prev.slice();
      next[i] = true;
      return next;
    });
  }

  function refill() {
    setPopped(Array(total).fill(false));
  }

  const remaining = popped.filter((p) => !p).length;

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge">
          {label} {remaining}
        </span>
        <button className="btn btn-sm" onClick={refill}>
          다시 채우기
        </button>
      </div>
      <div
        className="bubble-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        onPointerDown={() => {
          drawingRef.current = true;
        }}
      >
        {popped.map((p, i) => (
          <button
            key={i}
            className={`bubble${p ? ' bubble--popped' : bubbleClass ? ` ${bubbleClass}` : ''}`}
            aria-label="뽁뽁이"
            onPointerDown={() => pop(i)}
            onPointerEnter={() => {
              if (drawingRef.current) pop(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}
