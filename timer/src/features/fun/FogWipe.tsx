import { useEffect, useRef } from 'react';

interface Props {
  fogColor?: string;
  sparkleColor?: string;
  revealEmoji?: string;
  revealText?: string;
}

export function FogWipe({
  fogColor = 'rgba(226, 230, 236, 0.96)',
  sparkleColor = '255, 255, 255',
  revealEmoji = '🧊✨',
  revealText = '짜잔, 찾았다!',
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  function fillFog() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = fogColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = `rgba(${sparkleColor}, ${Math.random() * 0.14})`;
      const r = Math.random() * 36 + 8;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function setup() {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    fillFog();
  }

  useEffect(() => {
    setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function wipeAt(x: number, y: number) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const radius = 30;
    ctx.globalCompositeOperation = 'destination-out';
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.85)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function wipeStroke(x: number, y: number) {
    const last = lastPointRef.current;
    if (last) {
      const dist = Math.hypot(x - last.x, y - last.y);
      const steps = Math.max(1, Math.floor(dist / 8));
      for (let i = 1; i <= steps; i++) {
        wipeAt(last.x + ((x - last.x) * i) / steps, last.y + ((y - last.y) * i) / steps);
      }
    } else {
      wipeAt(x, y);
    }
    lastPointRef.current = { x, y };
  }

  function toLocal(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function handlePointerDown(e: React.PointerEvent) {
    drawingRef.current = true;
    lastPointRef.current = null;
    const { x, y } = toLocal(e.clientX, e.clientY);
    wipeStroke(x, y);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    const { x, y } = toLocal(e.clientX, e.clientY);
    wipeStroke(x, y);
  }

  useEffect(() => {
    function up() {
      drawingRef.current = false;
      lastPointRef.current = null;
    }
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge">화면을 문질러 보세요</span>
        <button className="btn btn-sm btn-ghost" onClick={fillFog}>
          다시 서리 채우기
        </button>
      </div>
      <div className="fog-wrap" ref={wrapRef}>
        <div className="fog-reveal">
          <div style={{ fontSize: 46 }}>{revealEmoji}</div>
          <div style={{ fontWeight: 800, marginTop: 8, fontSize: 18 }}>{revealText}</div>
        </div>
        <canvas
          ref={canvasRef}
          className="fog-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
        />
      </div>
    </div>
  );
}
