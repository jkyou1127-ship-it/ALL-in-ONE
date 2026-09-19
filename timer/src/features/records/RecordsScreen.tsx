import { useState } from 'react';
import type { Penalty, Session, Settings, Solve } from '../../types';
import { average, bestOf, computeStreak, effectiveMs, sessionMean, todayCount } from '../../lib/stats';
import { formatTime } from '../../lib/time';
import { isNotificationSupported, requestNotificationPermission } from '../../lib/notifications';
import { visibleCharacters } from '../../lib/mascotCharacters';
import { PixelMascot } from '../../components/PixelMascot';
import { getEvent } from '../../lib/events';
import { SolveRow } from './SolveRow';

interface Props {
  solves: Solve[];
  sessions: Session[];
  settings: Settings;
  unlockedSecrets: Set<string>;
  isAdmin: boolean;
  onDailyGoalMinusClick: (wasAtFloor: boolean) => void;
  onInspectionToggle: () => void;
  onPbTileClick: () => void;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onUpdatePenalty: (id: string, penalty: Penalty) => void;
  onDeleteSolve: (id: string) => void;
  onClearAll: () => void;
  onCreateSession: (name: string) => void;
  onSwitchSession: (id: string) => void;
  onRenameSession: (id: string, name: string) => void;
  onDeleteSession: (id: string) => void;
}

function fmt(v: number | 'DNF' | null): string {
  if (v === null) return '-';
  if (v === 'DNF') return 'DNF';
  return formatTime(v);
}

function formatCopyResult(ms: number, penalty: Penalty): string {
  if (penalty === 'DNF') return `DNF(${formatTime(ms)})`;
  if (penalty === '+2') return `${formatTime(ms + 2000)}+`;
  return formatTime(ms);
}

export function RecordsScreen({
  solves,
  sessions,
  settings,
  unlockedSecrets,
  isAdmin,
  onDailyGoalMinusClick,
  onInspectionToggle,
  onPbTileClick,
  onUpdateSettings,
  onUpdatePenalty,
  onDeleteSolve,
  onClearAll,
  onCreateSession,
  onSwitchSession,
  onRenameSession,
  onDeleteSession,
}: Props) {
  const eventName = getEvent(settings.currentEvent).name;
  const eventSessions = sessions.filter((s) => s.event === settings.currentEvent);
  const sessionSolves = solves.filter((s) => s.event === settings.currentEvent && s.sessionId === settings.currentSessionId);
  const [copied, setCopied] = useState(false);
  const [copyFrom, setCopyFrom] = useState('');
  const [copyTo, setCopyTo] = useState('');
  const best = bestOf(sessionSolves);
  const ao5 = average(sessionSolves, 5);
  const ao12 = average(sessionSolves, 12);
  const mean = sessionMean(sessionSolves);
  const streak = computeStreak(solves, settings.dailyGoal);
  const today = todayCount(solves);
  const goalProgress = settings.dailyGoal > 0 ? Math.min(1, today / settings.dailyGoal) : 0;

  async function handleReminderToggle(checked: boolean) {
    if (!checked) {
      onUpdateSettings({ reminderEnabled: false });
      return;
    }
    if (!isNotificationSupported()) {
      window.alert('이 브라우저는 알림을 지원하지 않아요.');
      return;
    }
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      onUpdateSettings({ reminderEnabled: true });
    } else {
      window.alert('알림 권한이 필요해요. 브라우저 설정에서 허용해주세요.');
    }
  }

  async function handleCopy() {
    const chronological = [...sessionSolves].reverse();
    const from = copyFrom.trim() ? Math.max(1, parseInt(copyFrom, 10)) : 1;
    const to = copyTo.trim() ? Math.min(chronological.length, parseInt(copyTo, 10)) : chronological.length;
    const lines = [
      'cubeapp(by cupompu)',
      '기록',
      ...chronological
        .map((s, i) => ({ s, n: i + 1 }))
        .filter(({ n }) => n >= from && n <= to)
        .map(({ s, n }) => `${n}. ${formatCopyResult(s.ms, s.penalty)} ${s.scramble}`),
    ];
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.alert('복사에 실패했어요. 브라우저 설정을 확인해주세요.');
    }
  }

  function handleClearAll() {
    if (sessionSolves.length === 0) return;
    if (window.confirm('이 세션의 기록을 모두 삭제할까요? 이 작업은 되돌릴 수 없어요.')) {
      onClearAll();
    }
  }

  function handleCreateSession() {
    const name = window.prompt('새 세션 이름', `세션 ${eventSessions.length + 1}`);
    if (name && name.trim()) onCreateSession(name.trim());
  }

  function handleRenameSession(s: Session) {
    const name = window.prompt('세션 이름 변경', s.name);
    if (name && name.trim() && name.trim() !== s.name) onRenameSession(s.id, name.trim());
  }

  function handleDeleteSession(s: Session) {
    if (eventSessions.length <= 1) {
      window.alert('마지막 남은 세션은 삭제할 수 없어요.');
      return;
    }
    if (window.confirm(`'${s.name}' 세션과 그 안의 모든 기록을 삭제할까요? 이 작업은 되돌릴 수 없어요.`)) {
      onDeleteSession(s.id);
    }
  }

  return (
    <div className="screen">
      <div className="stat-grid">
        <div className="stat-tile stat-tile--primary" onPointerDown={onPbTileClick}>
          <div className="stat-tile__label">PB</div>
          <div className="stat-tile__value mono">{best ? fmt(effectiveMs(best)) : '-'}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">Ao5</div>
          <div className="stat-tile__value mono">{fmt(ao5)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">Ao12</div>
          <div className="stat-tile__value mono">{fmt(ao12)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">평균</div>
          <div className="stat-tile__value mono">{fmt(mean)}</div>
        </div>
        <div className="stat-tile">
          <div className="stat-tile__label">횟수</div>
          <div className="stat-tile__value mono">{sessionSolves.length}</div>
        </div>
      </div>
      <p className="faint" style={{ marginTop: -4, marginBottom: 4 }}>
        {eventName} 기록 · 상단에서 종목을 바꿀 수 있어요
      </p>

      <div className="section-title">세션</div>
      <div className="card">
        <div className="session-list">
          {eventSessions.map((s) => (
            <div key={s.id} className={`session-pill${s.id === settings.currentSessionId ? ' active' : ''}`}>
              <button className="session-pill__name" onClick={() => onSwitchSession(s.id)}>
                {s.name}
              </button>
              <button className="session-pill__edit" aria-label="세션 이름 변경" onClick={() => handleRenameSession(s)}>
                ✎
              </button>
              {eventSessions.length > 1 && (
                <button className="session-pill__delete" aria-label="세션 삭제" onClick={() => handleDeleteSession(s)}>
                  ×
                </button>
              )}
            </div>
          ))}
          <button className="session-pill session-pill--add" onClick={handleCreateSession}>
            + 새 세션
          </button>
        </div>
      </div>

      <div className="section-title">목표 &amp; 스트릭</div>
      <div className="card">
        <div className="row">
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              {streak > 0 ? `🔥 ${streak}일 연속 달성` : '오늘부터 스트릭을 시작해보세요'}
            </div>
            <div className="muted">
              오늘 {today} / {settings.dailyGoal}회
            </div>
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${goalProgress * 100}%` }} />
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <span className="muted">하루 목표 솔빙 횟수</span>
          <div className="stepper">
            <button
              className="icon-btn"
              onClick={() => {
                onDailyGoalMinusClick(settings.dailyGoal <= 1);
                onUpdateSettings({ dailyGoal: Math.max(1, settings.dailyGoal - 1) });
              }}
            >
              −
            </button>
            <span className="mono stepper__value">{settings.dailyGoal}</span>
            <button className="icon-btn" onClick={() => onUpdateSettings({ dailyGoal: settings.dailyGoal + 1 })}>
              +
            </button>
          </div>
        </div>
      </div>

      <div className="section-title">마스코트</div>
      <div className="card">
        <div className="mascot-picker">
          {visibleCharacters(unlockedSecrets, isAdmin).map((c) => (
            <button
              key={c.id}
              className={`mascot-picker__item${settings.mascotCharacter === c.id ? ' active' : ''}`}
              onClick={() => onUpdateSettings({ mascotCharacter: c.id })}
            >
              <PixelMascot characterId={c.id} size={5} interactive={false} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section-title">검사 시간</div>
      <div className="card">
        <div className="row">
          <div>
            <div style={{ fontWeight: 600 }}>검사(인스펙션) 15초</div>
            <div className="faint">15초 초과 +2, 17초 초과 DNF (WCA 규정)</div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.inspectionEnabled}
              onChange={(e) => {
                onInspectionToggle();
                onUpdateSettings({ inspectionEnabled: e.target.checked });
              }}
            />
            <span className="switch-track" />
          </label>
        </div>
      </div>

      <div className="section-title">알림</div>
      <div className="card">
        <div className="row">
          <div>
            <div style={{ fontWeight: 600 }}>연습 리마인드</div>
            <div className="faint">앱이 열려있을 때만 동작해요</div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.reminderEnabled}
              onChange={(e) => handleReminderToggle(e.target.checked)}
            />
            <span className="switch-track" />
          </label>
        </div>
        {settings.reminderEnabled && (
          <div className="row" style={{ marginTop: 12 }}>
            <span className="muted">알림 시간</span>
            <input
              type="time"
              className="time-input"
              style={{ width: 120 }}
              value={settings.reminderTime}
              onChange={(e) => onUpdateSettings({ reminderTime: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="section-title section-title--row">
        <span>{eventName} 솔브 기록</span>
        {sessionSolves.length > 0 && (
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? '복사됨!' : '📋 복사'}
          </button>
        )}
      </div>
      {sessionSolves.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 32, marginBottom: 8 }}>🧊</div>
          <p>아직 {eventName} 기록이 없어요. 타이머 탭에서 첫 솔브를 시작해보세요!</p>
        </div>
      ) : (
        <>
          <div className="copy-range">
            <span className="muted">복사 범위</span>
            <input
              type="number"
              className="copy-range__input"
              placeholder="1"
              min={1}
              value={copyFrom}
              onChange={(e) => setCopyFrom(e.target.value)}
            />
            <span className="muted">~</span>
            <input
              type="number"
              className="copy-range__input"
              placeholder={String(sessionSolves.length)}
              min={1}
              value={copyTo}
              onChange={(e) => setCopyTo(e.target.value)}
            />
            <span className="faint">비워두면 전체</span>
          </div>
          <div className="solve-list">
            {sessionSolves.map((s, i) => (
              <SolveRow
                key={s.id}
                index={sessionSolves.length - i}
                solve={s}
                onUpdatePenalty={onUpdatePenalty}
                onDelete={onDeleteSolve}
              />
            ))}
          </div>
          <button className="btn btn-danger btn-block" style={{ marginTop: 16 }} onClick={handleClearAll}>
            이 세션 기록 전체 삭제
          </button>
        </>
      )}
    </div>
  );
}
