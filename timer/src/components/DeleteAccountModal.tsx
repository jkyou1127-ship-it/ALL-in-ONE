import { useState } from 'react';
import { authErrorMessage, deleteAccount } from '../lib/auth';
import { deleteAllUserData } from '../lib/userProfile';

export function DeleteAccountModal({ uid, onClose, onDeleted }: { uid: string; onClose: () => void; onDeleted: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await deleteAllUserData(uid);
      await deleteAccount(password);
      onDeleted();
    } catch (err) {
      setError(authErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 8px' }}>회원탈퇴</h3>
        <p className="faint" style={{ margin: '0 0 16px' }}>
          계정과 클라우드에 저장된 모든 기록이 영구적으로 삭제돼요. 이 기기에 남아있는 로컬 기록은 그대로 유지됩니다. 이
          작업은 되돌릴 수 없어요.
        </p>
        <form onSubmit={handleSubmit} className="auth-modal__form">
          <input
            type="password"
            required
            placeholder="본인 확인을 위해 비밀번호를 입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className="auth-modal__error">{error}</p>}
          <button type="submit" className="btn btn-danger" disabled={busy}>
            {busy ? '처리 중...' : '탈퇴하기'}
          </button>
        </form>
        <button type="button" className="auth-modal__guest" onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  );
}
