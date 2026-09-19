import { useEffect, useRef, useState } from 'react';
import { HACKER_CODE } from './hackerCode';

const MAX_LEN = 6000;

interface Props {
  code?: string;
  hint?: string;
}

export function HackerTerminal({ code = HACKER_CODE, hint = '키보드가 없다면 화면을 톡톡 두드려도 돼요.' }: Props) {
  const [output, setOutput] = useState('');
  const idxRef = useRef(0);
  const outRef = useRef<HTMLDivElement>(null);

  function reveal() {
    const n = 1 + Math.floor(Math.random() * 3);
    let chunk = code.slice(idxRef.current, idxRef.current + n);
    idxRef.current += n;
    if (idxRef.current >= code.length) {
      idxRef.current = 0;
      chunk += '\n\n// -- re-establishing uplink --\n\n';
    }
    setOutput((prev) => {
      const next = prev + chunk;
      return next.length > MAX_LEN ? next.slice(next.length - MAX_LEN) : next;
    });
  }

  function clear() {
    setOutput('');
    idxRef.current = 0;
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1 && e.key !== 'Enter' && e.key !== 'Backspace') return;
      e.preventDefault();
      reveal();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const el = outRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [output]);

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge">키보드를 마구 두드려보세요</span>
        <button className="btn btn-sm btn-ghost" onClick={clear}>
          지우기
        </button>
      </div>
      <div className="hacker-terminal" ref={outRef} onPointerDown={reveal} tabIndex={0}>
        <pre className="hacker-terminal__text">
          {output}
          <span className="hacker-cursor">▊</span>
        </pre>
      </div>
      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        {hint}
      </p>
    </div>
  );
}
