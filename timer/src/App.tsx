import { useEffect, useRef, useState } from 'react';
import './App.css';
import type { Penalty, Session, Settings, Solve, TabKey } from './types';
import { loadSettings, loadSolves, makeSolveId, saveSettings, saveSolves } from './lib/storage';
import { ensureDefaultSession, loadSessions, makeSessionId, resolveSessionForEvent, saveSessions } from './lib/sessions';
import { bestOf, effectiveMs } from './lib/stats';
import { msUntilNextTime, registerServiceWorker, showLocalNotification, RETURN_REMINDER_THRESHOLD_MS } from './lib/notifications';
import { firebaseConfigured } from './lib/firebase';
import { onAuthChange, type User } from './lib/auth';
import { checkIsAdmin } from './lib/admin';
import { deleteAllCloudSolves, deleteCloudSolve, fetchCloudSolves, subscribeCloudSolves, uploadSolves } from './lib/cloudSync';
import { BottomNav } from './components/BottomNav';
import { Confetti } from './components/Confetti';
import { EventSelect } from './components/EventSelect';
import { ThemeSelect } from './components/ThemeSelect';
import { AccountButton } from './components/AccountButton';
import { AuthModal } from './components/AuthModal';
import { DeleteAccountModal } from './components/DeleteAccountModal';
import { TimerScreen } from './features/timer/TimerScreen';
import { RecordsScreen } from './features/records/RecordsScreen';
import { FunScreen } from './features/fun/FunScreen';
import { getTheme } from './lib/themes';
import {
  getUnlockedIds,
  trackDailyGoalMinusClick,
  trackEventChange,
  trackInspectionToggle,
  trackLogoClick,
  trackPbTileClick,
  trackThemeChange,
} from './lib/easterEgg';

function mergeSolves(local: Solve[], remote: Solve[]): Solve[] {
  const byId = new Map(local.map((s) => [s.id, s]));
  for (const s of remote) byId.set(s.id, s);
  return Array.from(byId.values()).sort((a, b) => b.date - a.date);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('timer');
  const [solves, setSolves] = useState<Solve[]>(() => loadSolves());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [running, setRunning] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showComeback, setShowComeback] = useState(false);
  const [lastSolveId, setLastSolveId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [unlockedSecrets, setUnlockedSecrets] = useState<Set<string>>(() => getUnlockedIds());
  const [sessions, setSessionsState] = useState<Session[]>(() => {
    const initial = ensureDefaultSession(loadSessions(), loadSettings().currentEvent);
    saveSessions(initial);
    return initial;
  });
  const solvesRef = useRef(solves);
  solvesRef.current = solves;

  function setSessions(next: Session[]) {
    setSessionsState(next);
    saveSessions(next);
  }

  useEffect(() => {
    if (!firebaseConfigured) return;
    return onAuthChange(setUser);
  }, []);

  useEffect(() => {
    let cancelled = false;
    checkIsAdmin(user?.uid).then((admin) => {
      if (!cancelled) setIsAdmin(admin);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const cloudSolves = await fetchCloudSolves(user.uid);
        if (cancelled) return;
        const cloudIds = new Set(cloudSolves.map((s) => s.id));
        const localOnly = solvesRef.current.filter((s) => !cloudIds.has(s.id));
        if (localOnly.length > 0) await uploadSolves(user.uid, localOnly);
        if (cancelled) return;
        const merged = mergeSolves(solvesRef.current, cloudSolves);
        setSolves(merged);
        saveSolves(merged);
      } catch {
        // offline or permission issue - keep using local data
      }

      if (cancelled) return;
      unsubscribe = subscribeCloudSolves(user.uid, (remoteSolves) => {
        setSolves((prev) => {
          const merged = mergeSolves(prev, remoteSolves);
          saveSolves(merged);
          return merged;
        });
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    const themeDef = getTheme(settings.theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeDef.bg);
  }, [settings.theme]);

  useEffect(() => {
    registerServiceWorker();
    const now = Date.now();
    if (settings.lastOpenedAt && now - settings.lastOpenedAt >= RETURN_REMINDER_THRESHOLD_MS) {
      setShowComeback(true);
    }
    updateSettings({ lastOpenedAt: now });
    // the app already starts on the saved currentEvent without the user
    // explicitly "selecting" it, so seed the rainbow-cube visited-events
    // tracker with it - otherwise the starting event could never count
    trackEventChange(settings.currentEvent, () => setUnlockedSecrets(getUnlockedIds()));
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!settings.reminderEnabled) return;
    let timeoutId: number;
    const schedule = () => {
      const delay = msUntilNextTime(settings.reminderTime);
      timeoutId = window.setTimeout(() => {
        showLocalNotification('큐브 연습 시간이에요 🧊', {
          body: '오늘의 목표를 채우러 가볼까요?',
          tag: 'cube-practice-reminder',
        });
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(timeoutId);
  }, [settings.reminderEnabled, settings.reminderTime]);

  function updateSettings(patch: Partial<Settings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }

  function addSolve(ms: number, scramble: string, penalty: Penalty = null) {
    const eventId = settings.currentEvent;
    const sessionId = settings.currentSessionId;
    const previousBest = bestOf(solves.filter((s) => s.event === eventId && s.sessionId === sessionId));
    const solve: Solve = { id: makeSolveId(), ms, scramble, date: Date.now(), penalty, event: eventId, sessionId };
    const next = [solve, ...solves];
    setSolves(next);
    saveSolves(next);
    setLastSolveId(solve.id);
    if (user) uploadSolves(user.uid, [solve]).catch(() => {});

    const newMs = effectiveMs(solve);
    const prevMs = previousBest ? effectiveMs(previousBest) : null;
    if (newMs !== null && prevMs !== null && newMs < prevMs) {
      setConfettiKey((k) => k + 1);
    }
  }

  function updateSolvePenalty(id: string, penalty: Solve['penalty']) {
    const next = solves.map((s) => (s.id === id ? { ...s, penalty } : s));
    setSolves(next);
    saveSolves(next);
    if (user) {
      const updated = next.find((s) => s.id === id);
      if (updated) uploadSolves(user.uid, [updated]).catch(() => {});
    }
  }

  function deleteSolve(id: string) {
    const next = solves.filter((s) => s.id !== id);
    setSolves(next);
    saveSolves(next);
    if (user) deleteCloudSolve(user.uid, id).catch(() => {});
  }

  function clearAllSolves() {
    const sessionId = settings.currentSessionId;
    const removedIds = solves.filter((s) => s.sessionId === sessionId).map((s) => s.id);
    const next = solves.filter((s) => s.sessionId !== sessionId);
    setSolves(next);
    saveSolves(next);
    if (user) deleteAllCloudSolves(user.uid, removedIds).catch(() => {});
  }

  function changeEvent(id: Settings['currentEvent']) {
    trackEventChange(id, () => setUnlockedSecrets(getUnlockedIds()));
    const resolved = resolveSessionForEvent(sessions, id);
    if (resolved.sessions !== sessions) setSessions(resolved.sessions);
    updateSettings({ currentEvent: id, currentSessionId: resolved.sessionId });
  }

  function changeTheme(id: Settings['theme']) {
    trackThemeChange(id, () => setUnlockedSecrets(getUnlockedIds()));
    updateSettings({ theme: id });
  }

  function clickLogo() {
    trackLogoClick(() => setUnlockedSecrets(getUnlockedIds()));
  }

  function clickDailyGoalMinus(wasAtFloor: boolean) {
    trackDailyGoalMinusClick(wasAtFloor, () => setUnlockedSecrets(getUnlockedIds()));
  }

  function toggleInspection() {
    trackInspectionToggle(() => setUnlockedSecrets(getUnlockedIds()));
  }

  function clickPbTile() {
    trackPbTileClick(() => setUnlockedSecrets(getUnlockedIds()));
  }

  function createSession(name: string) {
    const session: Session = { id: makeSessionId(), event: settings.currentEvent, name, createdAt: Date.now() };
    setSessions([...sessions, session]);
    updateSettings({ currentSessionId: session.id });
  }

  function switchSession(id: string) {
    updateSettings({ currentSessionId: id });
  }

  function renameSession(id: string, name: string) {
    setSessions(sessions.map((s) => (s.id === id ? { ...s, name } : s)));
  }

  function deleteSession(id: string) {
    const target = sessions.find((s) => s.id === id);
    const remaining = sessions.filter((s) => s.id !== id);
    const removedIds = solves.filter((s) => s.sessionId === id).map((s) => s.id);
    const nextSolves = solves.filter((s) => s.sessionId !== id);
    setSolves(nextSolves);
    saveSolves(nextSolves);
    if (user && removedIds.length > 0) deleteAllCloudSolves(user.uid, removedIds).catch(() => {});

    if (settings.currentSessionId === id) {
      const resolved = resolveSessionForEvent(remaining, target?.event ?? settings.currentEvent);
      setSessions(resolved.sessions);
      updateSettings({ currentSessionId: resolved.sessionId });
    } else {
      setSessions(remaining);
    }
  }

  const showChrome = !running;

  return (
    <>
      {showChrome && (
        <header className="app-header">
          <div className="app-header__title" onClick={clickLogo}>
            🧊<span className="app-header__beta">Release Build 1.0</span>
          </div>
          <EventSelect value={settings.currentEvent} onChange={changeEvent} />
          <div className="app-header__actions">
            <a
              className="icon-btn"
              href="../obdcube/"
              aria-label="OBD Cube 대회 플랫폼으로 이동"
              title="OBD Cube 대회 플랫폼"
            >
              🏆
            </a>
            {firebaseConfigured && (
              <AccountButton
                user={user}
                onRequestLogin={() => setAuthModalOpen(true)}
                onRequestDelete={() => setDeleteModalOpen(true)}
              />
            )}
            <ThemeSelect value={settings.theme} onChange={changeTheme} currentCharacterId={settings.mascotCharacter} />
          </div>
        </header>
      )}

      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
      {deleteModalOpen && user && (
        <DeleteAccountModal
          uid={user.uid}
          onClose={() => setDeleteModalOpen(false)}
          onDeleted={() => setDeleteModalOpen(false)}
        />
      )}

      <main className="app-main">
        {showComeback && (
          <div className="screen" style={{ paddingBottom: 0 }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: 22 }}>👋</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>다시 오신 것을 환영해요!</div>
                <div className="muted">오랜만이에요. 오늘 목표를 채우러 가볼까요?</div>
              </div>
              <button className="icon-btn" aria-label="닫기" onClick={() => setShowComeback(false)}>
                ✕
              </button>
            </div>
          </div>
        )}

        {activeTab === 'timer' && (
          <TimerScreen
            solves={solves}
            event={settings.currentEvent}
            dailyGoal={settings.dailyGoal}
            inspectionEnabled={settings.inspectionEnabled}
            characterId={settings.mascotCharacter}
            isAdmin={isAdmin}
            lastSolveId={lastSolveId}
            onRunningChange={setRunning}
            onFinishSolve={addSolve}
            onUpdatePenalty={updateSolvePenalty}
          />
        )}
        {activeTab === 'records' && (
          <RecordsScreen
            solves={solves}
            sessions={sessions}
            settings={settings}
            unlockedSecrets={unlockedSecrets}
            isAdmin={isAdmin}
            onDailyGoalMinusClick={clickDailyGoalMinus}
            onInspectionToggle={toggleInspection}
            onPbTileClick={clickPbTile}
            onUpdateSettings={updateSettings}
            onUpdatePenalty={updateSolvePenalty}
            onDeleteSolve={deleteSolve}
            onClearAll={clearAllSolves}
            onCreateSession={createSession}
            onSwitchSession={switchSession}
            onRenameSession={renameSession}
            onDeleteSession={deleteSession}
          />
        )}
        {activeTab === 'fun' && <FunScreen mascotCharacter={settings.mascotCharacter} isAdmin={isAdmin} />}
      </main>

      {showChrome && <BottomNav active={activeTab} onChange={setActiveTab} />}
      <Confetti triggerKey={confettiKey} />
    </>
  );
}
