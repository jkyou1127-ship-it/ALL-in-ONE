import { useEffect, useRef, useState } from 'react';
import type { User } from '../lib/auth';
import { signOutUser } from '../lib/auth';

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

export function AccountButton({
  user,
  onRequestLogin,
  onRequestDelete,
}: {
  user: User | null;
  onRequestLogin: () => void;
  onRequestDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('pointerdown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!user) {
    return (
      <button className="icon-btn" aria-label="로그인" onClick={onRequestLogin}>
        <UserIcon />
      </button>
    );
  }

  return (
    <div className="account-picker" ref={rootRef}>
      <button className="icon-btn icon-btn--active" aria-label="계정" onClick={() => setOpen((o) => !o)}>
        <UserIcon />
      </button>
      {open && (
        <div className="account-picker__menu">
          <p className="account-picker__email">{user.email}</p>
          <button
            type="button"
            className="account-picker__logout"
            onClick={() => {
              signOutUser();
              setOpen(false);
            }}
          >
            로그아웃
          </button>
          <button
            type="button"
            className="account-picker__delete"
            onClick={() => {
              setOpen(false);
              onRequestDelete();
            }}
          >
            회원탈퇴
          </button>
        </div>
      )}
    </div>
  );
}
