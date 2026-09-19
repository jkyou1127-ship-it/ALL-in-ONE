import { useEffect, useRef, useState } from 'react';
import type { Penalty, Solve } from '../../types';
import { getEvent, type EventId } from '../../lib/events';
import { formatSolveResult, formatTime } from '../../lib/time';
import { randomQuote } from '../../lib/quotes';
import { bestOf, computeStreak, effectiveMs, todayCount as computeTodayCount } from '../../lib/stats';
import { GanTimerLink } from '../../lib/ganTimer';
import { PixelMascot } from '../../components/PixelMascot';
import type { CharacterId } from '../../lib/mascotCharacters';

type Phase = 'idle' | 'armed' | 'inspecting' | 'inspecting-armed' | 'running';

const INSPECTION_SECONDS = 15;
const INSPECTION_LIMIT_SECONDS = 17;

interface Props {
  solves: Solve[];
  event: EventId;
  dailyGoal: number;
  inspectionEnabled: boolean;
  characterId: CharacterId;
  isAdmin: boolean;
  lastSolveId: string | null;
  onRunningChange: (running: boolean) => void;
  onFinishSolve: (ms: number, scramble: string, penalty: Penalty) => void;
  onUpdatePenalty: (id: string, penalty: Penalty) => void;
}

const bluetoothSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

export function TimerScreen({
  solves,
  event,
  dailyGoal,
  inspectionEnabled,
  characterId,
  isAdmin,
  lastSolveId,
  onRunningChange,
  onFinishSolve,
  onUpdatePenalty,
}: Props) {
  const eventDef = getEvent(event);
  const inspectionActive = inspectionEnabled && eventDef.usesInspection;

  const [phase, setPhase] = useState<Phase>('idle');
  const [scramble, setScramble] = useState('');
  const [scrambleLoading, setScrambleLoading] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [inspectMs, setInspectMs] = useState(0);
  const [lastResultMs, setLastResultMs] = useState<number | null>(null);
  const [lastPenalty, setLastPenalty] = useState<Penalty>(null);
  const [resultPending, setResultPending] = useState(false);
  const [quote, setQuote] = useState(() => randomQuote());
  const [btConnected, setBtConnected] = useState(false);
  const [btBusy, setBtBusy] = useState(false);
  const [btError, setBtError] = useState<string | null>(null);

  const startTimeRef = useRef(0);
  const inspectStartRef = useRef(0);
  const rafRef = useRef<number>(0);
  const pendingPenaltyRef = useRef<Penalty>(null);
  const ganRef = useRef<GanTimerLink | null>(null);
  // scramble generation is async (it may hit a WASM-backed solver) - guarded by
  // a request id so a fast event switch can't let a stale in-flight promise
  // overwrite a newer one.
  const scrambleRequestIdRef = useRef(0);
  // true from the moment a solve is stopped (by either path below) until hands
  // finally lift off the pads - guards against the same physical "hands down to
  // stop" contact being misread as a brand new "hands down to arm" a moment later
  const stoppedRecentlyRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      ganRef.current?.disconnect();
    };
  }, []);

  function advanceScramble(evt: typeof eventDef) {
    const requestId = ++scrambleRequestIdRef.current;
    setScrambleLoading(true);
    evt
      .generateScramble()
      .then((s) => {
        if (scrambleRequestIdRef.current !== requestId) return; // superseded by a newer request
        setScramble(s);
        setScrambleLoading(false);
      })
      .catch(() => {
        if (scrambleRequestIdRef.current !== requestId) return;
        setScramble('');
        setScrambleLoading(false);
      });
  }

  useEffect(() => {
    advanceScramble(eventDef);
    setPhase('idle');
    setLastResultMs(null);
    setResultPending(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event]);

  function tickSolve() {
    setElapsedMs(performance.now() - startTimeRef.current);
    rafRef.current = requestAnimationFrame(tickSolve);
  }

  function tickInspect() {
    const elapsed = performance.now() - inspectStartRef.current;
    setInspectMs(elapsed);
    if (elapsed >= INSPECTION_LIMIT_SECONDS * 1000) {
      finish(0, 'DNF');
      return;
    }
    rafRef.current = requestAnimationFrame(tickInspect);
  }

  function computeInspectionPenalty(ms: number): Penalty {
    const sec = ms / 1000;
    if (sec >= INSPECTION_LIMIT_SECONDS) return 'DNF';
    if (sec >= INSPECTION_SECONDS) return '+2';
    return null;
  }

  function startInspection() {
    cancelAnimationFrame(rafRef.current);
    onRunningChange(true);
    setPhase('inspecting');
    inspectStartRef.current = performance.now();
    setInspectMs(0);
    rafRef.current = requestAnimationFrame(tickInspect);
  }

  function startTimer(penalty: Penalty) {
    cancelAnimationFrame(rafRef.current);
    onRunningChange(true);
    pendingPenaltyRef.current = penalty;
    setPhase('running');
    startTimeRef.current = performance.now();
    setElapsedMs(0);
    rafRef.current = requestAnimationFrame(tickSolve);
  }

  function stopTimer() {
    cancelAnimationFrame(rafRef.current);
    const finalMs = Math.round(performance.now() - startTimeRef.current);
    finish(finalMs, pendingPenaltyRef.current);
  }

  function finish(ms: number, penalty: Penalty) {
    cancelAnimationFrame(rafRef.current);
    setPhase('idle');
    onRunningChange(false);
    setLastResultMs(ms);
    setLastPenalty(penalty);
    setResultPending(true);
    onFinishSolve(ms, scramble, penalty);
    advanceScramble(eventDef);
    setQuote(randomQuote());
    pendingPenaltyRef.current = null;
  }

  function applyQuickPenalty(penalty: Penalty) {
    setLastPenalty(penalty);
    if (lastSolveId) onUpdatePenalty(lastSolveId, penalty);
  }

  // The GAN Bluetooth event subscription lives far longer than any single
  // render, so its callbacks must always dispatch through the *current*
  // render's closures (which close over the current `scramble`/`event`/
  // `onFinishSolve` etc.) rather than whichever ones existed when connect()
  // was called - otherwise a solve finished via the physical timer could be
  // recorded with a stale scramble or get lost against a stale solve list.
  const latestRef = useRef({
    phase,
    inspectMs,
    inspectionActive,
    resultPending,
    startTimer,
    stopTimer,
    finish,
    startInspection,
  });
  latestRef.current = {
    phase,
    inspectMs,
    inspectionActive,
    resultPending,
    startTimer,
    stopTimer,
    finish,
    startInspection,
  };

  function armOrStop() {
    const p = latestRef.current.phase;
    if (p === 'running') {
      latestRef.current.stopTimer();
    } else if (p === 'idle') {
      setResultPending(false);
      setPhase('armed');
    } else if (p === 'inspecting') {
      setPhase('inspecting-armed');
    }
  }

  function releaseAndGo() {
    const p = latestRef.current.phase;
    if (p === 'armed') {
      if (latestRef.current.inspectionActive) {
        latestRef.current.startInspection();
      } else {
        latestRef.current.startTimer(null);
      }
    } else if (p === 'inspecting-armed') {
      latestRef.current.startTimer(computeInspectionPenalty(latestRef.current.inspectMs));
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    armOrStop();
  }

  function handlePointerUp() {
    releaseAndGo();
  }

  function handlePointerCancel() {
    if (phase === 'armed') setPhase('idle');
    else if (phase === 'inspecting-armed') setPhase('inspecting');
  }

  // Space bar mirrors the touch/click gesture (hold = arm, release = go), the
  // conventional speedcubing-timer keyboard shortcut. Listens on window (not the
  // timer element) so it works regardless of focus, and dispatches through
  // latestRef so the handlers never act on a stale phase snapshot.
  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space' || e.repeat || isTypingTarget(e.target)) return;
      e.preventDefault();
      armOrStop();
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code !== 'Space' || isTypingTarget(e.target)) return;
      e.preventDefault();
      releaseAndGo();
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBluetoothConnect(e: React.SyntheticEvent) {
    e.stopPropagation();
    setBtError(null);
    setBtBusy(true);
    try {
      if (!ganRef.current) ganRef.current = new GanTimerLink();
      await ganRef.current.connect({
        onConnectionChange: (connected) => setBtConnected(connected),
        onHandsOn: () => {
          const p = latestRef.current.phase;
          // placing hands back on the pads while running IS the stop action on real
          // cube timers - don't wait on a separate STOPPED packet for this, since the
          // app's own clock is enough and is more robust to hardware quirks
          if (p === 'running') {
            stoppedRecentlyRef.current = true;
            latestRef.current.stopTimer();
            return;
          }
          if (p === 'idle') {
            // this HANDS_ON may just be the tail end of the same stop contact above,
            // not a request to arm a new solve - wait for hands to actually lift first
            if (stoppedRecentlyRef.current) return;
            setPhase('armed');
          } else if (p === 'inspecting') {
            setPhase('inspecting-armed');
          }
        },
        onHandsOff: () => {
          stoppedRecentlyRef.current = false;
          const p = latestRef.current.phase;
          if (p === 'armed') setPhase('idle');
          else if (p === 'inspecting-armed') setPhase('inspecting');
        },
        onRunning: () => {
          const p = latestRef.current.phase;
          if (p === 'running') return;
          if (p === 'inspecting' || p === 'inspecting-armed') {
            latestRef.current.startTimer(computeInspectionPenalty(latestRef.current.inspectMs));
            return;
          }
          // armed with inspection off (or any unexpected state) - just start solving
          latestRef.current.startTimer(null);
        },
        onStopped: (ms) => {
          // guard against double-finishing: onHandsOn's stopTimer() above may have
          // already ended the solve by the time this (possibly late) packet arrives
          if (latestRef.current.phase !== 'running') return;
          stoppedRecentlyRef.current = true;
          latestRef.current.finish(ms, pendingPenaltyRef.current);
        },
        onFinished: () => {
          // last-resort stop fallback: on some units the STOPPED packet doesn't parse
          // (or never arrives) but FINISHED always follows right after a real stop -
          // if we're still "running" by this point, use the app's own clock to close
          // out the solve rather than leaving the display stuck mid-count
          if (latestRef.current.phase !== 'running') return;
          stoppedRecentlyRef.current = true;
          latestRef.current.stopTimer();
        },
        onIdle: () => {
          // the round center logo button resets the display to 0.00 - this fires as an
          // IDLE broadcast. First press after a solve just acknowledges the pending
          // result; press it again (now that resultPending is already cleared) to
          // actually kick off inspection.
          const p = latestRef.current.phase;
          if (p !== 'idle') return;
          if (latestRef.current.resultPending) {
            setResultPending(false);
            setLastResultMs(0);
            return;
          }
          if (latestRef.current.inspectionActive) {
            latestRef.current.startInspection();
          }
        },
      });
      setBtConnected(true);
    } catch (err) {
      setBtError(err instanceof Error ? err.message : '연결에 실패했어요.');
    } finally {
      setBtBusy(false);
    }
  }

  function handleBluetoothDisconnect(e: React.SyntheticEvent) {
    e.stopPropagation();
    ganRef.current?.disconnect();
    setBtConnected(false);
  }

  const chromeHidden = phase === 'running' || phase === 'inspecting' || phase === 'inspecting-armed';
  const showTop = phase !== 'running';
  const showBottom = phase === 'idle' || phase === 'armed';
  const inspecting = phase === 'inspecting' || phase === 'inspecting-armed';
  const inspectRemaining = INSPECTION_SECONDS - inspectMs / 1000;

  const displayMs = phase === 'running' ? elapsedMs : lastResultMs ?? 0;
  const streak = computeStreak(solves, dailyGoal);
  const today = computeTodayCount(solves);

  const eventSolves = solves.filter((s) => s.event === event);
  const best = bestOf(eventSolves);
  const pbMs = best ? effectiveMs(best) : null;
  const pbProgress = phase === 'running' && pbMs ? Math.min(1, elapsedMs / pbMs) : null;
  const pbDiffMs = phase === 'running' && pbMs ? elapsedMs - pbMs : null;

  return (
    <div
      className={`timer-screen ${chromeHidden ? 'timer-screen--running' : 'timer-screen--idle'}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
    >
      {showTop && (
        <div className="timer-top">
          {showBottom && (
            <div className="timer-mascot-slot">
              <PixelMascot characterId={characterId} size={11} isAdmin={isAdmin} />
            </div>
          )}
          <div className="scramble-chip">
            <div className="scramble-text mono">{scrambleLoading && !scramble ? '스크램블 생성 중...' : scramble}</div>
          </div>
          <div className="timer-goal-row">
            {inspecting ? (
              <span className="badge badge-accent">🔍 검사 중</span>
            ) : (
              <>
                {streak > 0 && <span className="badge badge-accent">🔥 {streak}일 연속</span>}
                <span className="badge">
                  오늘 {today}/{dailyGoal}
                </span>
                {bluetoothSupported && (
                  <button
                    className={`badge bt-badge${btConnected ? ' badge-accent' : ''}`}
                    onClick={btConnected ? handleBluetoothDisconnect : handleBluetoothConnect}
                    onPointerDown={(e) => e.stopPropagation()}
                    disabled={btBusy}
                  >
                    {btBusy ? '연결 중...' : btConnected ? '🔵 GAN 타이머 연결됨' : '📶 GAN 타이머 연결'}
                  </button>
                )}
              </>
            )}
          </div>
          {btError && (
            <p className="faint" style={{ marginTop: 8 }}>
              {btError}
            </p>
          )}
        </div>
      )}

      {inspecting ? (
        <div className={`timer-display mono ${inspectRemaining <= 0 ? 'inspect-over' : inspectRemaining <= 3 ? 'inspect-warn' : ''}`}>
          {inspectRemaining > 0 ? Math.ceil(inspectRemaining) : '+2'}
        </div>
      ) : (
        <div className={`timer-display mono ${phase}`}>
          {phase === 'idle' && lastResultMs !== null ? formatSolveResult(lastResultMs, lastPenalty) : formatTime(displayMs)}
        </div>
      )}

      {phase === 'running' && pbProgress !== null && pbDiffMs !== null && (
        <div className="pb-race">
          <div className="pb-race__bar">
            <div
              className={`pb-race__fill${pbDiffMs >= 0 ? ' pb-race__fill--over' : ''}`}
              style={{ width: `${pbProgress * 100}%` }}
            />
          </div>
          <div className={`pb-race__label${pbDiffMs >= 0 ? ' pb-race__label--over' : ''}`}>
            PB {pbDiffMs >= 0 ? '+' : '-'}
            {formatTime(Math.abs(pbDiffMs))}
          </div>
        </div>
      )}

      {resultPending && phase === 'idle' && (
        <div className="quick-penalty" onPointerDown={(e) => e.stopPropagation()}>
          <button className={`btn btn-sm${lastPenalty === null ? ' btn-primary' : ''}`} onClick={() => applyQuickPenalty(null)}>
            OK
          </button>
          <button className={`btn btn-sm${lastPenalty === '+2' ? ' btn-primary' : ''}`} onClick={() => applyQuickPenalty('+2')}>
            +2
          </button>
          <button className={`btn btn-sm${lastPenalty === 'DNF' ? ' btn-primary' : ''}`} onClick={() => applyQuickPenalty('DNF')}>
            DNF
          </button>
        </div>
      )}

      {showBottom && (
        <div className="timer-bottom">
          <p className="timer-hint">
            {phase === 'armed'
              ? inspectionActive
                ? '손을 떼면 검사가 시작돼요'
                : '손을 떼면 시작해요'
              : '화면을 터치했다가 손을 떼면 시작돼요'}
          </p>
          <p className="timer-quote">{quote}</p>
        </div>
      )}
    </div>
  );
}
