import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { PRIVACY_POLICY_VERSION } from './privacyPolicy';
import { fetchCloudSolves, deleteAllCloudSolves } from './cloudSync';

export async function recordPrivacyConsent(uid: string): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { privacyPolicyVersion: PRIVACY_POLICY_VERSION, privacyPolicyAgreedAt: Date.now() },
    { merge: true }
  );
}

/** wipes every trace of this account's data from Firestore - call before deleting the
 * auth account itself, while still authenticated (security rules require a live uid match).
 * Also frees the nickname reservation (nicknames/{nickname}) shared with the OBD Cube app,
 * matching that app's own account-deletion cleanup. */
export async function deleteAllUserData(uid: string): Promise<void> {
  const solves = await fetchCloudSolves(uid);
  await deleteAllCloudSolves(uid, solves.map((s) => s.id));

  const userSnap = await getDoc(doc(db, 'users', uid));
  const nickname = userSnap.exists() ? (userSnap.data().nickname as string | undefined) : undefined;

  await deleteDoc(doc(db, 'users', uid));
  if (nickname) await deleteDoc(doc(db, 'nicknames', nickname)).catch(() => {});
}
