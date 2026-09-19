import { useEffect, useRef } from 'react';
import { fireConfetti } from '../lib/confetti';

/** Renders a fixed full-screen canvas and fires a confetti burst whenever triggerKey changes (and is > 0). */
export function Confetti({ triggerKey }: { triggerKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (triggerKey <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const stop = fireConfetti(canvas);
    return stop;
  }, [triggerKey]);

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden="true" />;
}
