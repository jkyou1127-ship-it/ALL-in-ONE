interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'rect' | 'circle';
}

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#eab308'];

/** Fires a full-canvas confetti burst. Returns a cleanup/cancel function. */
export function fireConfetti(canvas: HTMLCanvasElement, durationMs = 2400): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;

  const count = 150;
  const particles: Particle[] = Array.from({ length: count }, () => ({
    x: w / 2 + (Math.random() - 0.5) * w * 0.4,
    y: h * 0.35 + (Math.random() - 0.5) * 40,
    vx: (Math.random() - 0.5) * 11,
    vy: -(Math.random() * 11 + 6),
    size: Math.random() * 7 + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.3,
    shape: Math.random() < 0.5 ? 'rect' : 'circle',
  }));

  const gravity = 0.35;
  const start = performance.now();
  let rafId = 0;
  let cancelled = false;

  function frame(now: number) {
    if (cancelled) return;
    const elapsed = now - start;
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    ctx!.scale(dpr, dpr);

    const alpha = Math.max(0, 1 - elapsed / durationMs);
    for (const p of particles) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      ctx!.save();
      ctx!.globalAlpha = alpha;
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.fillStyle = p.color;
      if (p.shape === 'rect') {
        ctx!.fillRect(-p.size / 2, (-p.size * 0.6) / 2, p.size, p.size * 0.6);
      } else {
        ctx!.beginPath();
        ctx!.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.restore();
    }

    if (elapsed < durationMs) {
      rafId = requestAnimationFrame(frame);
    } else {
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  rafId = requestAnimationFrame(frame);

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    ctx!.setTransform(1, 0, 0, 1, 0, 0);
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
  };
}
