import { useState } from 'react';
import { authErrorMessage, signIn, signUp } from '../lib/auth';
import { recordPrivacyConsent } from '../lib/userProfile';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'signup' && !agreed) {
      setError('개인정보 수집·이용에 동의해주셔야 가입할 수 있어요.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const cred = await signUp(email, password);
        await recordPrivacyConsent(cred.user.uid);
      } else {
        await signIn(email, password);
      }
      onClose();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__tabs">
          <button
            type="button"
            className={`auth-modal__tab${mode === 'signin' ? ' active' : ''}`}
            onClick={() => setMode('signin')}
          >
            로그인
          </button>
          <button
            type="button"
            className={`auth-modal__tab${mode === 'signup' ? ' active' : ''}`}
            onClick={() => setMode('signup')}
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-modal__form">
          <input
            type="email"
            required
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
          {mode === 'signup' && (
            <label className="auth-modal__consent">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>
                <button type="button" className="auth-modal__policy-link" onClick={() => setShowPolicy(true)}>
                  개인정보처리방침
                </button>
                에 동의합니다 (필수)
              </span>
            </label>
          )}
          {error && <p className="auth-modal__error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy || (mode === 'signup' && !agreed)}>
            {busy ? '처리 중...' : mode === 'signup' ? '가입하고 시작하기' : '로그인'}
          </button>
        </form>

        <button type="button" className="auth-modal__guest" onClick={onClose}>
          로그인 없이 계속하기
        </button>
      </div>
      {showPolicy && <PrivacyPolicyModal onClose={() => setShowPolicy(false)} />}
    </div>
  );
}
