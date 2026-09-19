import { useEffect, useRef, useState } from 'react';

const CELL = 12;

function nextGeneration(cols: number, rows: number, cur: Uint8Array): Uint8Array {
  const next = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let n = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = (r + dr + rows) % rows;
          const cc = (c + dc + cols) % cols;
          n += cur[rr * cols + cc];
        }
      }
      const alive = cur[r * cols + c] === 1;
      next[r * cols + c] = alive ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0;
    }
  }
  return next;
}

interface SeedPattern {
  label: string;
  /** [row, col] offsets, small and non-negative - centered onto the live grid when seeded */
  cells: [number, number][];
}

interface Props {
  seedPattern?: SeedPattern;
}

export function GameOfLife({ seedPattern }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRef = useRef<Uint8Array>(new Uint8Array(0));
  const dimsRef = useRef({ cols: 0, rows: 0 });
  const drawingRef = useRef(false);
  const eraseRef = useRef(false);
  const hueRef = useRef(140);
  const genRef = useRef(0);
  const [running, setRunning] = useState(false);

  function draw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { cols, rows } = dimsRef.current;
    const grid = gridRef.current;

    ctx.fillStyle = 'rgba(6, 8, 14, 0.14)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `hsl(${hueRef.current}, 85%, 62%)`;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r * cols + c] === 1) {
          ctx.fillRect(c * CELL + 1, r * CELL + 1, CELL - 2, CELL - 2);
        }
      }
    }
  }

  function setup() {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const cssW = wrap.clientWidth;
    const cssH = wrap.clientHeight;
    const cols = Math.max(1, Math.floor(cssW / CELL));
    const rows = Math.max(1, Math.floor(cssH / CELL));
    dimsRef.current = { cols, rows };
    canvas.width = cols * CELL;
    canvas.height = rows * CELL;
    canvas.style.width = `${cols * CELL}px`;
    canvas.style.height = `${rows * CELL}px`;
    gridRef.current = new Uint8Array(cols * rows);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#06080e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  useEffect(() => {
    setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const { cols, rows } = dimsRef.current;
      gridRef.current = nextGeneration(cols, rows, gridRef.current);
      hueRef.current = (hueRef.current + 2) % 360;
      genRef.current += 1;
      draw();
    }, 110);
    return () => clearInterval(id);
  }, [running]);

  function toggleCell(clientX: number, clientY: number, erase: boolean) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const { cols, rows } = dimsRef.current;
    const c = Math.floor((x / rect.width) * cols);
    const r = Math.floor((y / rect.height) * rows);
    if (c < 0 || c >= cols || r < 0 || r >= rows) return;
    gridRef.current[r * cols + c] = erase ? 0 : 1;
    draw();
  }

  function handlePointerDown(e: React.PointerEvent) {
    drawingRef.current = true;
    eraseRef.current = gridRef.current[cellIndexFromEvent(e)] === 1;
    toggleCell(e.clientX, e.clientY, eraseRef.current);
  }

  function cellIndexFromEvent(e: React.PointerEvent): number {
    const canvas = canvasRef.current;
    const { cols } = dimsRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * dimsRef.current.cols);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * dimsRef.current.rows);
    return r * cols + c;
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    toggleCell(e.clientX, e.clientY, eraseRef.current);
  }

  useEffect(() => {
    function up() {
      drawingRef.current = false;
    }
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  function randomize() {
    const { cols, rows } = dimsRef.current;
    const grid = new Uint8Array(cols * rows);
    for (let i = 0; i < grid.length; i++) grid[i] = Math.random() < 0.22 ? 1 : 0;
    gridRef.current = grid;
    draw();
  }

  function clear() {
    const { cols, rows } = dimsRef.current;
    gridRef.current = new Uint8Array(cols * rows);
    setRunning(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#06080e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function seedFromPattern() {
    if (!seedPattern) return;
    const { cols, rows } = dimsRef.current;
    const grid = new Uint8Array(cols * rows);
    const maxR = Math.max(...seedPattern.cells.map(([r]) => r));
    const maxC = Math.max(...seedPattern.cells.map(([, c]) => c));
    const offR = Math.floor((rows - maxR) / 2);
    const offC = Math.floor((cols - maxC) / 2);
    for (const [r, c] of seedPattern.cells) {
      const rr = r + offR;
      const cc = c + offC;
      if (rr >= 0 && rr < rows && cc >= 0 && cc < cols) grid[rr * cols + cc] = 1;
    }
    gridRef.current = grid;
    draw();
  }

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <button className="btn btn-sm btn-primary" onClick={() => setRunning((r) => !r)}>
          {running ? '일시정지' : '시작'}
        </button>
        <button className="btn btn-sm btn-ghost" onClick={randomize}>
          무작위
        </button>
        {seedPattern && (
          <button className="btn btn-sm btn-ghost" onClick={seedFromPattern}>
            {seedPattern.label}
          </button>
        )}
        <button className="btn btn-sm btn-ghost" onClick={clear}>
          지우기
        </button>
      </div>
      <div className="life-wrap" ref={wrapRef}>
        <canvas
          ref={canvasRef}
          className="life-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        />
      </div>
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        화면을 톡톡 찍어 씨앗을 만들고 시작을 눌러보세요.
      </p>
    </div>
  );
}
