import { useEffect, useRef, useState } from 'react';
import { randomPhrase } from './phrases';

export function TypingGame() {
  const [target, setTarget] = useState(() => randomPhrase());
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [resultMs, setResultMs] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (resultMs !== null) return;
    const v = e.target.value;
    setInput(v);
    if (startTime === null && v.length > 0) setStartTime(performance.now());
    if (v === target) {
      const elapsed = Math.round(performance.now() - (startTime ?? performance.now()));
      setResultMs(elapsed);
    }
  }

  function next() {
    setTarget((prev) => randomPhrase(prev));
    setInput('');
    setStartTime(null);
    setResultMs(null);
    inputRef.current?.focus();
  }

  const cpm = resultMs && resultMs > 0 ? Math.round((target.length / resultMs) * 60000) : null;

  return (
    <div className="mini-game">
      <div className="typing-phrase">
        {target.split('').map((ch, i) => {
          const typed = input[i];
          const cls = typed === undefined ? 'pending' : typed === ch ? 'correct' : 'incorrect';
          return (
            <span key={i} className={`typing-phrase__ch typing-phrase__ch--${cls}`}>
              {ch}
            </span>
          );
        })}
      </div>

      <input
        ref={inputRef}
        className="text-input typing-input"
        value={input}
        onChange={handleChange}
        placeholder="여기에 그대로 따라 입력하세요"
        disabled={resultMs !== null}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {resultMs !== null ? (
        <div className="card typing-result">
          <div className="row">
            <span className="muted">완료 시간</span>
            <span className="mono" style={{ fontWeight: 800 }}>
              {(resultMs / 1000).toFixed(2)}초
            </span>
          </div>
          <div className="row">
            <span className="muted">타수(CPM)</span>
            <span className="mono" style={{ fontWeight: 800 }}>
              {cpm}
            </span>
          </div>
          <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={next}>
            다음 문장
          </button>
        </div>
      ) : (
        <button className="btn btn-ghost btn-block" onClick={next}>
          다른 문장으로 건너뛰기
        </button>
      )}
    </div>
  );
}
