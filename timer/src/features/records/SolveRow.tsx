import { useState } from 'react';
import type { Penalty, Solve } from '../../types';
import { formatRelativeDate, formatSolveResult } from '../../lib/time';

export function SolveRow({
  index,
  solve,
  onUpdatePenalty,
  onDelete,
}: {
  index: number;
  solve: Solve;
  onUpdatePenalty: (id: string, penalty: Penalty) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="solve-row">
      <button className="solve-row__main" onClick={() => setOpen((o) => !o)}>
        <span className="solve-row__index">#{index}</span>
        <span className={`solve-row__time mono${solve.penalty === 'DNF' ? ' dnf' : ''}`}>
          {formatSolveResult(solve.ms, solve.penalty)}
        </span>
        <span className="solve-row__date">{formatRelativeDate(solve.date)}</span>
      </button>

      {open && (
        <div className="solve-row__detail">
          <div className="solve-row__scramble mono">{solve.scramble}</div>
          <div className="solve-row__actions">
            <button
              className={`btn btn-sm${solve.penalty === null ? ' btn-primary' : ''}`}
              onClick={() => onUpdatePenalty(solve.id, null)}
            >
              OK
            </button>
            <button
              className={`btn btn-sm${solve.penalty === '+2' ? ' btn-primary' : ''}`}
              onClick={() => onUpdatePenalty(solve.id, '+2')}
            >
              +2
            </button>
            <button
              className={`btn btn-sm${solve.penalty === 'DNF' ? ' btn-primary' : ''}`}
              onClick={() => onUpdatePenalty(solve.id, 'DNF')}
            >
              DNF
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => onDelete(solve.id)}>
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
