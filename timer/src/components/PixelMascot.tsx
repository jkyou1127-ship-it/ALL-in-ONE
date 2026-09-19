import { useEffect, useRef, useState } from 'react';
import { getCharacter, type CharacterId } from '../lib/mascotCharacters';

const LINES = [
  '화이팅!',
  '오늘도 큐브데이 🧊',
  '심심하면 놀이 탭도 가봐요',
  '잘하고 있어요!',
  '한 판 더?',
  '손가락 스트레칭 잊지 마요',
  '눈 깜빡할 새 지나가요',
];

export function PixelMascot({
  characterId = 'blob-blue',
  size = 10,
  interactive = true,
  isAdmin = false,
}: {
  characterId?: CharacterId;
  size?: number;
  interactive?: boolean;
  /** mixes in admin-exclusive bonus lines regardless of which mascot is equipped */
  isAdmin?: boolean;
}) {
  const [bubble, setBubble] = useState<string | null>(null);
  const timeoutRef = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const character = getCharacter(characterId);

  function handleTap(e: React.SyntheticEvent) {
    e.stopPropagation();
    const basePool = character.quotes ?? LINES;
    const pool = isAdmin && character.adminQuotes ? [...basePool, ...character.adminQuotes] : basePool;
    const line = pool[Math.floor(Math.random() * pool.length)];
    setBubble(line);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setBubble(null), 2400);
  }

  const w = character.sprite[0].length * size;
  const h = character.sprite.length * size;

  const sprite = (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mascot__sprite">
      {character.sprite.map((row, r) =>
        row.split('').map((code, c) => {
          if (code === '.') return null;
          return <rect key={`${r}-${c}`} x={c * size} y={r * size} width={size} height={size} fill={character.colors[code]} />;
        })
      )}
    </svg>
  );

  if (!interactive) {
    return <div className="mascot mascot--static">{sprite}</div>;
  }

  return (
    <div
      className="mascot"
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={handleTap}
      role="button"
      aria-label="마스코트"
    >
      {bubble && <div className="mascot__bubble">{bubble}</div>}
      {sprite}
    </div>
  );
}
