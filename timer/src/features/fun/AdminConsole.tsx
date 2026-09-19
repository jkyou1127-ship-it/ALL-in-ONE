import { useEffect, useRef, useState } from 'react';

const LOG_LINES = [
  '[SYSTEM] 큐브 서버 정상 가동 중...',
  '[SYSTEM] 전 세계 큐버들의 평균 심박수: 72bpm',
  '[SYSTEM] 오늘도 스크램블은 무한 생성 가능',
  '[SYSTEM] 관리자 권한 확인 완료 ✔',
  '[SYSTEM] 커피 재고: 충분함 ☕',
  '[SYSTEM] 버그 0개... 라고 믿고 싶다',
  '[SYSTEM] 큐브 회전 감지 센서 이상 없음',
  '[SYSTEM] 오늘의 명언: "그래도 되는대로 풀리겠지"',
  '[SYSTEM] 사용자를 몰래 훔쳐보는 중은 아님 (진짜로)',
  '[SYSTEM] 관리자 큐브 왕관 광택 98%',
];

function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function formatUptime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// A joke "admin panel" - every stat and button here is fake/decorative.
// Nothing on this screen reads or writes any real data.
export function AdminConsole() {
  const [users, setUsers] = useState(() => randomInt(120, 900));
  const [temp, setTemp] = useState(() => randomInt(35, 45));
  const [uptime, setUptime] = useState(0);
  const [log, setLog] = useState<string[]>([LOG_LINES[0]]);
  const [toast, setToast] = useState<string | null>(null);
  const logIdxRef = useRef(1);

  useEffect(() => {
    const id = setInterval(() => {
      setUsers((u) => Math.max(0, u + randomInt(-6, 8)));
      setTemp((t) => Math.min(60, Math.max(30, t + randomInt(-1, 1))));
      setUptime((u) => u + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setLog((prev) => {
        const line = LOG_LINES[logIdxRef.current % LOG_LINES.length];
        logIdxRef.current += 1;
        const next = [...prev, line];
        return next.length > 30 ? next.slice(next.length - 30) : next;
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="mini-game">
      <div className="row mini-game__stats">
        <span className="badge badge-accent">🛡️ 관리자 전용</span>
      </div>

      <div className="stat-grid">
        <div className="stat-tile stat-tile--primary">
          <div className="stat-tile__label">동시 접속자</div>
          <div className="stat-tile__value mono">{users}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">서버 온도</div>
          <div className="stat-tile__value mono">{temp}°C</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">가동 시간</div>
          <div className="stat-tile__value mono">{formatUptime(uptime)}</div>
        </div>
      </div>

      <div className="hacker-terminal" style={{ height: 'min(34vh, 240px)' }}>
        <pre className="hacker-terminal__text">{log.join('\n')}</pre>
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn btn-block" onClick={() => setToast('📢 전체 공지를 보냈어요 (사실 아무도 못 받아요)')}>
          📢 전체 공지 보내기
        </button>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn btn-danger btn-block" onClick={() => setToast('😈 장난이었어요, 아무것도 안 지워졌어요')}>
          🗑️ 전체 유저 데이터 삭제
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}

      <p className="faint" style={{ textAlign: 'center', marginTop: 10 }}>
        관리자 큐브를 장착했을 때만 보이는 비밀 콘솔이에요. 버튼은 전부 장난이라 실제로는 아무 일도 안 일어나요.
      </p>
    </div>
  );
}
