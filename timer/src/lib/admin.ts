import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Admin perks (every mascot character unlocked, plus an admin-only character)
// are granted to whoever is an admin in the shared OBD Cube app - the same
// Firestore `admins/{uid}` collection that ../../obdcube/firestore.rules and
// public/js/admin.js read and write. This keeps admin status in sync across
// both apps in this ALL-in-ONE site instead of hardcoding a UID here.
export async function checkIsAdmin(uid: string | null | undefined): Promise<boolean> {
  if (!uid) return false;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}
