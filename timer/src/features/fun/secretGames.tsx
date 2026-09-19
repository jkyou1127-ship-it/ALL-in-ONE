import { useEffect, useRef, useState } from 'react';

// Each secret mascot gets one exclusive mini toy, shown only while that
// character is the currently-equipped mascot (same rule as its matching
// secret theme). Kept intentionally small - one idea per character.

// ---------- 스퀘어-1 유령: 숨바꼭질 ----------

const HUNT_SIZE = 16;

export function GhostHunt() {
  const [ghostIdx, setGhostIdx] = useState(() => Math.floor(Math.random() * HUNT_SIZE));
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [found, setFound] = useState(0);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  function reveal(i: number) {
    if (status !== 'playing' || revealed.has(i)) return;
    setRevealed((prev) => new Set(prev).add(i));
    if (i === ghostIdx) {
      setFound((f) => f + 1);
      setStatus('won');
    } else {
      setAttemptsLeft((left) => {
        const next = left - 1;
        if (next <= 0) setStatus('lost');
        return next;
      });
    }
  }

  function restart() {
    setGhostIdx(Math.floor(Math.random() * HUNT_SIZE));
    setRevealed(new Set());
    setAttemptsLeft(5);
    setStatus('playing');
  }

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge">남은 기회 {attemptsLeft}</span>
        <span className="badge badge-accent">찾음 {found}</span>
      </div>
      <div className="bubble-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {Array.from({ length: HUNT_SIZE }).map((_, i) => {
          const isRevealed = revealed.has(i);
          const isGhost = i === ghostIdx;
          return (
            <button
              key={i}
              className={`bubble${isRevealed ? ' bubble--popped' : ''}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}
              onPointerDown={() => reveal(i)}
            >
              {isRevealed ? (isGhost ? '👻' : '💨') : ''}
            </button>
          );
        })}
      </div>
      {status !== 'playing' && (
        <div className="card" style={{ textAlign: 'center', padding: 16, marginTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>{status === 'won' ? '유령을 찾았다!' : '유령이 도망갔어요...'}</div>
          <button className="btn btn-primary btn-block" onClick={restart}>
            다시 찾기
          </button>
        </div>
      )}
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        16칸 중 유령이 숨은 칸을 찾아보세요. 기회는 5번!
      </p>
    </div>
  );
}

// ---------- 황금 큐브: 황금 클리커 ----------

const GOLD_BEST_KEY = 'cube_app.egg_gold_best.v1';
const GOLD_MILESTONES = [10, 50, 100, 250, 500, 1000];

export function GoldClicker() {
  const [gold, setGold] = useState(0);
  const [best, setBest] = useState(() => {
    const n = Number(localStorage.getItem(GOLD_BEST_KEY));
    return Number.isFinite(n) ? n : 0;
  });
  const [message, setMessage] = useState('황금 큐브를 눌러보세요');

  function tap() {
    setGold((g) => {
      const next = g + 1;
      if (next > best) {
        setBest(next);
        localStorage.setItem(GOLD_BEST_KEY, String(next));
      }
      if (GOLD_MILESTONES.includes(next)) setMessage(`${next}골드 달성! 부자가 되어가는군요`);
      return next;
    });
  }

  function reset() {
    setGold(0);
    setMessage('다시 모아볼까요?');
  }

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge">✨ 골드 {gold}</span>
        <span className="badge badge-accent">최고 {best}</span>
        <button className="btn btn-sm btn-ghost" onClick={reset}>
          초기화
        </button>
      </div>
      <button className="keysound-pad" onPointerDown={tap}>
        <div style={{ fontSize: 56 }}>🪙</div>
        <div className="muted" style={{ marginTop: 8 }}>
          {gold} 골드
        </div>
      </button>
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        {message}
      </p>
    </div>
  );
}

// ---------- 낮잠 냥이: 인내심 테스트 (화면을 안 만지고 버티기) ----------

const PATIENCE_BEST_KEY = 'cube_app.egg_patience_best.v1';

export function IdlePatience() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [best, setBest] = useState(() => {
    const n = Number(localStorage.getItem(PATIENCE_BEST_KEY));
    return Number.isFinite(n) ? n : 0;
  });
  const startRef = useRef(0);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  function tick() {
    setElapsedMs(performance.now() - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }

  function start() {
    runningRef.current = true;
    setRunning(true);
    startRef.current = performance.now();
    setElapsedMs(0);
    rafRef.current = requestAnimationFrame(tick);
  }

  function touchedEarly() {
    if (!runningRef.current) return;
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    setRunning(false);
    const ms = performance.now() - startRef.current;
    if (ms > best) {
      setBest(ms);
      localStorage.setItem(PATIENCE_BEST_KEY, String(ms));
    }
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div className="mini-game" onPointerDown={touchedEarly}>
      <div className="row mini-game__stats">
        <span className="badge">최고 기록 {(best / 1000).toFixed(1)}초</span>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 46 }}>😴</div>
        <div className="mono" style={{ fontSize: 28, fontWeight: 800, marginTop: 12 }}>
          {(elapsedMs / 1000).toFixed(1)}초
        </div>
        {!running && (
          <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={start}>
            시작 (그리고 아무것도 하지 마세요)
          </button>
        )}
      </div>
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        시작을 누른 후 화면을 만지지 않고 버티면 기록이 올라가요. 만지는 순간 끝!
      </p>
    </div>
  );
}

// ---------- 레인보우 큐브: 색깔 기억력 게임 ----------

const RAINBOW_COLORS = ['#ff5c5c', '#ff9f43', '#ffd93d', '#4ade80', '#3b82f6', '#a78bfa'];
const MEMORY_BEST_KEY = 'cube_app.egg_rainbow_best.v1';

export function ColorMemory() {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'showing' | 'input' | 'lost'>('idle');
  const [best, setBest] = useState(() => {
    const n = Number(localStorage.getItem(MEMORY_BEST_KEY));
    return Number.isFinite(n) ? n : 0;
  });

  async function playSequence(seq: number[]) {
    setStatus('showing');
    for (const idx of seq) {
      await new Promise((r) => setTimeout(r, 260));
      setFlashIdx(idx);
      await new Promise((r) => setTimeout(r, 380));
      setFlashIdx(null);
    }
    setStatus('input');
    setPlayerIdx(0);
  }

  function start() {
    const first = [Math.floor(Math.random() * RAINBOW_COLORS.length)];
    setSequence(first);
    playSequence(first);
  }

  function tapColor(i: number) {
    if (status !== 'input') return;
    if (sequence[playerIdx] !== i) {
      setStatus('lost');
      if (sequence.length > best) {
        setBest(sequence.length);
        localStorage.setItem(MEMORY_BEST_KEY, String(sequence.length));
      }
      return;
    }
    const nextIdx = playerIdx + 1;
    if (nextIdx === sequence.length) {
      const next = [...sequence, Math.floor(Math.random() * RAINBOW_COLORS.length)];
      setSequence(next);
      window.setTimeout(() => playSequence(next), 500);
    } else {
      setPlayerIdx(nextIdx);
    }
  }

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge">현재 단계 {sequence.length}</span>
        <span className="badge badge-accent">최고 {best}</span>
      </div>
      <div className="bubble-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {RAINBOW_COLORS.map((c, i) => (
          <button
            key={i}
            className="bubble"
            style={{ background: flashIdx === i ? c : `${c}55` }}
            onPointerDown={() => tapColor(i)}
          />
        ))}
      </div>
      {status === 'idle' && (
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={start}>
          시작
        </button>
      )}
      {status === 'lost' && (
        <div className="card" style={{ textAlign: 'center', padding: 16, marginTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>틀렸어요! {sequence.length - 1}단계까지 기억했어요</div>
          <button className="btn btn-primary btn-block" onClick={start}>
            다시 시작
          </button>
        </div>
      )}
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        색이 켜지는 순서를 기억했다가 그대로 따라 눌러보세요.
      </p>
    </div>
  );
}

// ---------- 번개 큐브: 정지 챌린지 ----------

const PRECISION_TARGET_MS = 3000;
const PRECISION_BEST_KEY = 'cube_app.egg_precision_best.v1';

export function PrecisionStop() {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [diffMs, setDiffMs] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(() => {
    const n = Number(localStorage.getItem(PRECISION_BEST_KEY));
    return Number.isFinite(n) && n > 0 ? n : null;
  });
  const startRef = useRef(0);
  const rafRef = useRef<number>(0);

  function tick() {
    setElapsedMs(performance.now() - startRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }

  function start() {
    setDiffMs(null);
    setRunning(true);
    startRef.current = performance.now();
    setElapsedMs(0);
    rafRef.current = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(rafRef.current);
    const finalMs = performance.now() - startRef.current;
    setElapsedMs(finalMs);
    setRunning(false);
    const diff = Math.abs(finalMs - PRECISION_TARGET_MS);
    setDiffMs(diff);
    if (best === null || diff < best) {
      setBest(diff);
      localStorage.setItem(PRECISION_BEST_KEY, String(diff));
    }
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge">목표 {(PRECISION_TARGET_MS / 1000).toFixed(2)}초</span>
        <span className="badge badge-accent">최고 오차 {best !== null ? `${best.toFixed(0)}ms` : '-'}</span>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div className="mono" style={{ fontSize: 36, fontWeight: 800 }}>
          {(elapsedMs / 1000).toFixed(2)}초
        </div>
        {diffMs !== null && !running && (
          <div className="muted" style={{ marginTop: 8 }}>
            오차 {diffMs.toFixed(0)}ms
          </div>
        )}
        <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={running ? stop : start}>
          {running ? '지금 멈추기!' : '시작'}
        </button>
      </div>
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        정확히 3.00초에 멈춰보세요. 오차가 적을수록 좋아요.
      </p>
    </div>
  );
}

// ---------- 별똥별 큐브: 소원 잡기 ----------

const STAR_GRID = 16;
const STAR_BEST_KEY = 'cube_app.egg_star_best.v1';
const WISHES = ['빠른 손을 갖게 해주세요', '오늘은 신기록!', 'PB 경신을 기원합니다', '연습이 배신하지 않기를', '큐브가 손에 착 붙기를'];

export function StarCatch() {
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => {
    const n = Number(localStorage.getItem(STAR_BEST_KEY));
    return Number.isFinite(n) ? n : 0;
  });
  const [wish, setWish] = useState<string | null>(null);
  const nextRef = useRef<number>(0);
  const missRef = useRef<number>(0);

  useEffect(
    () => () => {
      window.clearTimeout(nextRef.current);
      window.clearTimeout(missRef.current);
    },
    []
  );

  function scheduleNext(currentStreak: number) {
    const delay = 700 + Math.random() * 900;
    nextRef.current = window.setTimeout(() => {
      const idx = Math.floor(Math.random() * STAR_GRID);
      setActive(idx);
      const limit = Math.max(500, 1200 - currentStreak * 30);
      missRef.current = window.setTimeout(() => {
        setActive(null);
        setStreak(0);
        scheduleNext(0);
      }, limit);
    }, delay);
  }

  function start() {
    setRunning(true);
    setStreak(0);
    setActive(null);
    setWish(null);
    scheduleNext(0);
  }

  function stop() {
    setRunning(false);
    setActive(null);
    window.clearTimeout(nextRef.current);
    window.clearTimeout(missRef.current);
  }

  function tap(i: number) {
    if (!running || i !== active) return;
    window.clearTimeout(missRef.current);
    const nextStreak = streak + 1;
    setStreak(nextStreak);
    setActive(null);
    setWish(WISHES[Math.floor(Math.random() * WISHES.length)]);
    if (nextStreak > best) {
      setBest(nextStreak);
      localStorage.setItem(STAR_BEST_KEY, String(nextStreak));
    }
    scheduleNext(nextStreak);
  }

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge">연속 {streak}</span>
        <span className="badge badge-accent">최고 {best}</span>
        <button className="btn btn-sm" onClick={running ? stop : start}>
          {running ? '중지' : '시작'}
        </button>
      </div>
      <div className="bubble-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {Array.from({ length: STAR_GRID }).map((_, i) => (
          <button
            key={i}
            className="bubble"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
            onPointerDown={() => tap(i)}
          >
            {i === active ? '⭐' : ''}
          </button>
        ))}
      </div>
      {wish && (
        <div className="card" style={{ textAlign: 'center', padding: 12, marginTop: 12 }}>
          🌠 {wish}
        </div>
      )}
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        별이 뜨면 바로 탭해서 소원을 빌어보세요.
      </p>
    </div>
  );
}
