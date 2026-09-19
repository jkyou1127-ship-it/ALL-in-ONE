import { PRIVACY_POLICY_TEXT } from '../lib/privacyPolicy';

export function PrivacyPolicyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal privacy-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 12px' }}>개인정보처리방침</h3>
        <div className="privacy-modal__body">{PRIVACY_POLICY_TEXT}</div>
        <button type="button" className="btn btn-primary" style={{ marginTop: 14, width: '100%' }} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
