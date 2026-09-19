import { useEffect, useRef, useState } from 'react';
import { ModeSelect, type ModeOption } from '../../components/ModeSelect';
import { playPop } from '../../lib/popSound';
import { playKeySound, type SwitchType } from '../../lib/keySound';
import { BubbleWrap } from './BubbleWrap';
import { HackerTerminal } from './HackerTerminal';
import { GameOfLife } from './GameOfLife';
import { DvdScreensaver } from './DvdScreensaver';
import { FogWipe } from './FogWipe';

type ArcadeMode = 'crowngrab' | 'worddrop' | 'mirror' | 'gold-bubble' | 'secret-log' | 'crown-life' | 'crown-dvd' | 'royal-key' | 'crown-fog';

const ARCADE_MODES: ModeOption<ArcadeMode>[] = [
  { key: 'crowngrab', label: '👑 왕관 잡기' },
  { key: 'worddrop', label: '💬 낙하 단어' },
  { key: 'mirror', label: '🪞 대칭 낙서장' },
  { key: 'gold-bubble', label: '✨ 골드 뽁뽁이' },
  { key: 'secret-log', label: '📜 관리자 로그' },
  { key: 'crown-life', label: '🌀 왕관 시드' },
  { key: 'crown-dvd', label: '📀 왕관 DVD' },
  { key: 'royal-key', label: '⌨️ 10초 타건' },
  { key: 'crown-fog', label: '💨 왕관 서리' },
];

// ---------- 반응속도 리메이크: 3x3 격자 중 왕관이 뜬 칸을 빨리 탭 ----------

const GRAB_GRID = 9;
const GRAB_BEST_KEY = 'cube_app.admin_crowngrab_best.v1';

function loadGrabBest(): number {
  const n = Number(localStorage.getItem(GRAB_BEST_KEY));
  return Number.isFinite(n) ? n : 0;
}

function CrownGrab() {
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => loadGrabBest());
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
    const delay = Math.max(350, 1000 - currentStreak * 40);
    nextRef.current = window.setTimeout(() => {
      const idx = Math.floor(Math.random() * GRAB_GRID);
      setActive(idx);
      const limit = Math.max(500, 1100 - currentStreak * 30);
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
    scheduleNext(0);
  }

  function stop() {
    setRunning(false);
    setActive(null);
    window.clearTimeout(nextRef.current);
    window.clearTimeout(missRef.current);
  }

  function tap(i: number) {
    if (!running) return;
    if (i !== active) {
      setStreak(0);
      return;
    }
    window.clearTimeout(missRef.current);
    playPop();
    const nextStreak = streak + 1;
    setStreak(nextStreak);
    setActive(null);
    if (nextStreak > best) {
      setBest(nextStreak);
      localStorage.setItem(GRAB_BEST_KEY, String(nextStreak));
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
      <div className="bubble-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {Array.from({ length: GRAB_GRID }).map((_, i) => (
          <button
            key={i}
            className={`bubble${i === active ? ' bubble--gold' : ''}`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}
            onPointerDown={() => tap(i)}
          >
            {i === active ? '👑' : ''}
          </button>
        ))}
      </div>
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        왕관이 뜬 칸을 바로 탭! 다른 칸을 누르면 연속 기록이 끊겨요.
      </p>
    </div>
  );
}

// ---------- 타자연습 리메이크: 시간 안에 떨어지는 단어를 입력 ----------

const ADMIN_WORDS = ['큐브', '스크램블', '타이머', 'PB', 'AO5', 'AO12', '세션', '관리자', '이스터에그', '검사시간', '평균', '기록', '왕관', '뽁뽁이'];
const WORD_START_MS = 3200;
const WORD_MIN_MS = 1400;

function pickWord(prev?: string): string {
  if (ADMIN_WORDS.length === 1) return ADMIN_WORDS[0];
  let w = prev;
  while (w === prev) w = ADMIN_WORDS[Math.floor(Math.random() * ADMIN_WORDS.length)];
  return w!;
}

function WordDrop() {
  const [word, setWord] = useState(() => pickWord());
  const [input, setInput] = useState('');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const durationMs = Math.max(WORD_MIN_MS, WORD_START_MS - round * 140);

  useEffect(() => {
    if (!gameOver) inputRef.current?.focus();
  }, [round, gameOver]);

  useEffect(() => {
    if (gameOver) return;
    const id = window.setTimeout(() => {
      setLives((l) => {
        const next = l - 1;
        if (next <= 0) setGameOver(true);
        return next;
      });
      setWord((prev) => pickWord(prev));
      setInput('');
      setRound((r) => r + 1);
    }, durationMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, gameOver]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (gameOver) return;
    const v = e.target.value;
    setInput(v);
    if (v === word) {
      setScore((s) => s + 1);
      setWord((prev) => pickWord(prev));
      setInput('');
      setRound((r) => r + 1);
    }
  }

  function restart() {
    setWord(pickWord());
    setInput('');
    setRound(0);
    setScore(0);
    setLives(3);
    setGameOver(false);
  }

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge">점수 {score}</span>
        <span className="badge badge-accent">{'❤️'.repeat(Math.max(0, lives)) || '💔'}</span>
      </div>
      {gameOver ? (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>게임 오버</div>
          <div className="muted" style={{ marginBottom: 16 }}>
            최종 점수 {score}
          </div>
          <button className="btn btn-primary btn-block" onClick={restart}>
            다시 시작
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ textAlign: 'center', padding: '28px 16px', fontSize: 26, fontWeight: 800 }}>
            {word}
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-hover)', overflow: 'hidden', margin: '10px 0' }}>
            <div
              key={round}
              style={{ height: '100%', background: 'var(--accent)', width: '100%', animation: `word-drop-bar ${durationMs}ms linear forwards` }}
            />
          </div>
          <input
            ref={inputRef}
            className="text-input"
            value={input}
            onChange={handleChange}
            placeholder="떨어지기 전에 입력하세요"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </>
      )}
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        단어가 떨어지기 전에 정확히 입력하면 성공! 목숨은 3개예요.
      </p>
    </div>
  );
}

// ---------- 낙서장 리메이크: 4방향 대칭으로 찍히는 미러 낙서장 ----------

const MIRROR_GRID = 16;

function MirrorDoodle() {
  const [cells, setCells] = useState<boolean[]>(() => Array(MIRROR_GRID * MIRROR_GRID).fill(false));
  const drawingRef = useRef(false);
  const eraseRef = useRef(false);

  useEffect(() => {
    function up() {
      drawingRef.current = false;
    }
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  function paint(i: number, erase: boolean) {
    const r = Math.floor(i / MIRROR_GRID);
    const c = i % MIRROR_GRID;
    const mr = MIRROR_GRID - 1 - r;
    const mc = MIRROR_GRID - 1 - c;
    const targets = new Set([i, r * MIRROR_GRID + mc, mr * MIRROR_GRID + c, mr * MIRROR_GRID + mc]);
    setCells((prev) => {
      const next = prev.slice();
      for (const t of targets) next[t] = !erase;
      return next;
    });
  }

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge">✨ 4방향 대칭 낙서장</span>
      </div>
      <div className="pixel-grid" style={{ gridTemplateColumns: `repeat(${MIRROR_GRID}, 1fr)` }} onPointerDown={() => (drawingRef.current = true)}>
        {cells.map((on, i) => (
          <div
            key={i}
            className="pixel-cell"
            style={{ background: on ? '#a855f7' : 'transparent' }}
            onPointerDown={() => {
              eraseRef.current = cells[i];
              paint(i, cells[i]);
            }}
            onPointerEnter={() => {
              if (drawingRef.current) paint(i, eraseRef.current);
            }}
          />
        ))}
      </div>
      <button className="btn btn-ghost btn-block" style={{ marginTop: 12 }} onClick={() => setCells(Array(MIRROR_GRID * MIRROR_GRID).fill(false))}>
        전체 지우기
      </button>
    </div>
  );
}

// ---------- 타건감 리메이크: 10초 동안 최대한 많이 두드리기 ----------

const KEY_SWITCHES: { key: SwitchType; label: string }[] = [
  { key: 'blue', label: '청축' },
  { key: 'brown', label: '갈축' },
  { key: 'red', label: '적축' },
  { key: 'silent', label: '무접점' },
];
const KEY_CHALLENGE_MS = 10000;
const KEY_BEST_KEY = 'cube_app.admin_keysound_best.v1';

function RoyalKeySound() {
  const [type, setType] = useState<SwitchType>('blue');
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(KEY_CHALLENGE_MS);
  const [best, setBest] = useState(() => {
    const n = Number(localStorage.getItem(KEY_BEST_KEY));
    return Number.isFinite(n) ? n : 0;
  });
  const endRef = useRef(0);
  const countRef = useRef(0);
  const rafRef = useRef<number>(0);
  // guards the on-screen pad against firing twice for one physical press -
  // pointerdown can otherwise double-fire (e.g. a drag re-entering the pad)
  const padPressedRef = useRef(false);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    function up() {
      padPressedRef.current = false;
    }
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  function tick() {
    const left = Math.max(0, endRef.current - performance.now());
    setRemainingMs(left);
    if (left <= 0) {
      setRunning(false);
      if (countRef.current > best) {
        setBest(countRef.current);
        localStorage.setItem(KEY_BEST_KEY, String(countRef.current));
      }
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function start() {
    countRef.current = 0;
    setCount(0);
    setRunning(true);
    endRef.current = performance.now() + KEY_CHALLENGE_MS;
    setRemainingMs(KEY_CHALLENGE_MS);
    rafRef.current = requestAnimationFrame(tick);
  }

  function press() {
    if (!running) return;
    playKeySound(type);
    countRef.current += 1;
    setCount(countRef.current);
  }

  function handlePadPointerDown() {
    if (!running) {
      start();
      return;
    }
    if (padPressedRef.current) return;
    padPressedRef.current = true;
    press();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.repeat) return;
      press();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, type]);

  return (
    <div className="mini-game">
      <div className="pill-toggle" style={{ marginBottom: 14 }}>
        {KEY_SWITCHES.map((s) => (
          <button key={s.key} className={type === s.key ? 'active' : ''} onClick={() => setType(s.key)}>
            {s.label}
          </button>
        ))}
      </div>
      <div className="row mini-game__stats">
        <span className="badge">{running ? `${(remainingMs / 1000).toFixed(1)}초 남음` : '10초 챌린지'}</span>
        <span className="badge badge-accent">최고 {best}타</span>
      </div>
      <button className="keysound-pad" onPointerDown={handlePadPointerDown}>
        <div style={{ fontSize: 40 }}>👑</div>
        <div className="muted" style={{ marginTop: 8 }}>
          {running ? `${count}타` : '눌러서 10초 챌린지 시작'}
        </div>
      </button>
    </div>
  );
}

// ---------- 멍때리기 리메이크: 왕관 모양으로 셀룰러 오토마타 시드 ----------

const CROWN_SEED = {
  label: '👑 왕관 시드',
  cells: [
    [0, 1],
    [0, 4],
    [0, 7],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [1, 5],
    [1, 6],
    [1, 7],
    [1, 8],
    [2, 0],
    [2, 8],
    [3, 0],
    [3, 1],
    [3, 2],
    [3, 3],
    [3, 4],
    [3, 5],
    [3, 6],
    [3, 7],
    [3, 8],
  ] as [number, number][],
};

const ADMIN_DVD_COLORS = ['#a855f7', '#c084fc', '#ffd700', '#f5a524', '#c9960c', '#e879f9'];

const ADMIN_LOG = `[관리자 전용 로그]
03:12  큐브 서버 기동. 오늘도 무사히.
03:15  스크램블 생성기 워커 정상 응답.
03:20  이스터에그 해금 이벤트 5건 수신.
03:41  관리자 계정 로그인 감지 - 환영합니다.
04:02  버그 리포트 0건 (아직까지는).
04:10  커피 재고 부족 경보 발령 ☕
04:33  왕관 큐브 광택 점검 완료.
04:50  뽁뽁이 재고 무한대로 확인.
05:00  오늘의 한마디: "천천히, 그러나 꾸준히."
05:21  관리자 전용 게임 아케이드 배포 완료.
05:40  사용자 몰래 훔쳐보는 중은 아님 (진짜로).
06:02  다음 업데이트: 미정, 기분에 따라.
`;

export function AdminArcade() {
  const [mode, setMode] = useState<ArcadeMode>('crowngrab');

  return (
    <div>
      <ModeSelect value={mode} options={ARCADE_MODES} onChange={setMode} />

      {mode === 'crowngrab' && <CrownGrab />}
      {mode === 'worddrop' && <WordDrop />}
      {mode === 'mirror' && <MirrorDoodle />}
      {mode === 'gold-bubble' && <BubbleWrap cols={6} rows={9} bubbleClass="bubble--gold" label="남은 골드 뽁뽁이" />}
      {mode === 'secret-log' && <HackerTerminal code={ADMIN_LOG} hint="관리자만 볼 수 있는 (가짜) 서버 로그예요." />}
      {mode === 'crown-life' && <GameOfLife seedPattern={CROWN_SEED} />}
      {mode === 'crown-dvd' && <DvdScreensaver logo="👑 ADMIN" colors={ADMIN_DVD_COLORS} hint="관리자 전용 스크린세이버예요. 왕관이 모서리에 부딪히는 순간을 노려보세요." />}
      {mode === 'royal-key' && <RoyalKeySound />}
      {mode === 'crown-fog' && (
        <FogWipe fogColor="rgba(42, 24, 74, 0.96)" sparkleColor="255, 215, 0" revealEmoji="👑✨" revealText="관리자님, 찾으셨네요!" />
      )}
    </div>
  );
}
