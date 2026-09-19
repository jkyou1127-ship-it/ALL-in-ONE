import { useEffect, useRef } from 'react';

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#06b6d4', '#eab308'];

interface Props {
  logo?: string;
  colors?: string[];
  hint?: string;
}

export function DvdScreensaver({ logo = '🧊 CUBE', colors = COLORS, hint = '모서리에 정확히 부딪히는 순간을 가만히 기다려보세요.' }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: 24, y: 24 });
  const velRef = useRef({ x: (Math.random() < 0.5 ? -1 : 1) * 2.4, y: (Math.random() < 0.5 ? -1 : 1) * 1.9 });
  const colorIdxRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const box = boxRef.current;
    if (box) box.style.color = colors[0];

    function frame() {
      const wrap = wrapRef.current;
      const box = boxRef.current;
      if (wrap && box) {
        const W = wrap.clientWidth;
        const H = wrap.clientHeight;
        const bw = box.offsetWidth;
        const bh = box.offsetHeight;
        let { x, y } = posRef.current;
        let { x: vx, y: vy } = velRef.current;
        x += vx;
        y += vy;
        let bounced = false;

        if (x <= 0) {
          x = 0;
          vx = Math.abs(vx);
          bounced = true;
        } else if (x + bw >= W) {
          x = Math.max(0, W - bw);
          vx = -Math.abs(vx);
          bounced = true;
        }
        if (y <= 0) {
          y = 0;
          vy = Math.abs(vy);
          bounced = true;
        } else if (y + bh >= H) {
          y = Math.max(0, H - bh);
          vy = -Math.abs(vy);
          bounced = true;
        }

        posRef.current = { x, y };
        velRef.current = { x: vx, y: vy };
        box.style.transform = `translate(${x}px, ${y}px)`;
        if (bounced) {
          colorIdxRef.current = (colorIdxRef.current + 1) % colors.length;
          box.style.color = colors[colorIdxRef.current];
        }
      }
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mini-game">
      <div className="dvd-wrap" ref={wrapRef}>
        <div className="dvd-logo" ref={boxRef}>
          {logo}
        </div>
      </div>
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        {hint}
      </p>
    </div>
  );
}
