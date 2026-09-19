import { createUserWithEmailAndPassword, updateProfile, type User } from 'firebase/auth';
import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// OBD Cube 앱(../../obdcube/public/js/data.js, auth.js)과 같은 사용자 문서 모양
// ({ nickname, email, obdId, createdAt } in users/{uid}, nicknames/{nickname} = { uid })을
// 그대로 따라서, 어느 앱에서 가입하든 같은 프로필 스키마·닉네임·OBD ID 체계를 공유한다.

/** WCA ID를 본뜬 OBD ID(가입연도 + 닉네임 4자 + 일련번호). 같은 Firestore 프로젝트를 쓰므로
 * obdIdCounters/{prefix} 카운터도 OBD Cube 앱과 공유된다. */
async function generateObdId(nickname: string): Promise<string> {
  const year = new Date().getFullYear();
  const nameCode = nickname
    .replace(/\s/g, '')
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, 'X');
  const prefix = `${year}${nameCode}`;
  const counterRef = doc(db, 'obdIdCounters', prefix);
  const seq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.exists() ? (snap.data().count as number) : 0) + 1;
    tx.set(counterRef, { count: next });
    return next;
  });
  return `${prefix}${String(seq).padStart(2, '0')}`;
}

export function validateNickname(nickname: string): string | null {
  const trimmed = nickname.trim();
  if (trimmed.length < 2 || trimmed.length > 16) return '닉네임은 2~16자로 입력해주세요.';
  return null;
}

export async function isNicknameTaken(nickname: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'nicknames', nickname.trim()));
  return snap.exists();
}

/** OBD Cube의 auth.js signUp()과 같은 순서: 닉네임 검증/중복 확인 -> 계정 생성 -> 닉네임 예약 ->
 * 프로필 문서 -> OBD ID -> displayName. 중간에 실패하면 만들어진 계정을 정리한다. */
export async function signUpWithNickname(nickname: string, email: string, password: string): Promise<User> {
  const trimmed = nickname.trim();
  const nicknameError = validateNickname(trimmed);
  if (nicknameError) throw new Error(nicknameError);
  if (await isNicknameTaken(trimmed)) throw new Error('이미 사용 중인 닉네임입니다.');

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  try {
    const obdId = await generateObdId(trimmed);
    await setDoc(doc(db, 'nicknames', trimmed), { uid });
    await setDoc(doc(db, 'users', uid), { nickname: trimmed, email, obdId, createdAt: serverTimestamp() }, { merge: true });
    await updateProfile(cred.user, { displayName: trimmed });
  } catch (err) {
    await cred.user.delete().catch(() => {});
    throw err;
  }

  return cred.user;
}
