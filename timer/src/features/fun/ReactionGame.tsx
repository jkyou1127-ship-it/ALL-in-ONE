import { useEffect, useRef, useState } from 'react';

type RState = 'idle' | 'waiting' | 'ready' | 'result' | 'early';

const BEST_KEY = 'cube_app.reaction_best.v1';

function loadBest(): number | null {
  const raw = localStorage.getItem(BEST_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

export function ReactionGame() {
  const [state, setState] = useState<RState>('idle');
  const [resultMs, setResultMs] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(() => loadBest());
  const timeoutRef = useRef<number>(0);
  const startRef = useRef(0);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  function arm() {
    setState('waiting');
    const delay = 1000 + Math.random() * 2500;
    timeoutRef.current = window.setTimeout(() => {
      startRef.current = performance.now();
      setState('ready');
    }, delay);
  }

  function handlePress() {
    if (state === 'idle' || state === 'result' || state === 'early') {
      arm();
      return;
    }
    if (state === 'waiting') {
      window.clearTimeout(timeoutRef.current);
      setState('early');
      return;
    }
    if (state === 'ready') {
      const ms = Math.round(performance.now() - startRef.current);
      setResultMs(ms);
      setState('result');
      if (best === null || ms < best) {
        setBest(ms);
        localStorage.setItem(BEST_KEY, String(ms));
      }
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        handlePress();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, best]);

  const label =
    state === 'idle'
      ? '탭하거나 스페이스바를 눌러 시작'
      : state === 'waiting'
        ? '초록색이 되면 최대한 빨리!'
        : state === 'ready'
          ? '지금!'
          : state === 'early'
            ? '너무 빨랐어요 😅'
            : `${resultMs}ms`;

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge">최고 기록 {best !== null ? `${best}ms` : '-'}</span>
        {state === 'result' && resultMs !== null && (
          <span className="badge badge-accent">{resultMs === best ? '🎉 신기록!' : '다시 도전'}</span>
        )}
      </div>
      <button className={`reaction-pad reaction-pad--${state}`} onClick={handlePress}>
        <span className="reaction-pad__label">{label}</span>
      </button>
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        너무 일찍 누르면 false start! 스페이스바로도 플레이할 수 있어요.
      </p>
    </div>
  );
}
