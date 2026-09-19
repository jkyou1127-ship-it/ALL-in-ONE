import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Solve } from '../types';

function solvesCollection(uid: string) {
  return collection(db, 'users', uid, 'solves');
}

export async function fetchCloudSolves(uid: string): Promise<Solve[]> {
  const snap = await getDocs(solvesCollection(uid));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Solve, 'id'>) }));
}

export function subscribeCloudSolves(uid: string, onChange: (solves: Solve[]) => void): Unsubscribe {
  return onSnapshot(solvesCollection(uid), (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Solve, 'id'>) })));
  });
}

export async function uploadSolves(uid: string, solves: Solve[]): Promise<void> {
  if (solves.length === 0) return;
  const batch = writeBatch(db);
  for (const solve of solves) {
    const { id, ...rest } = solve;
    batch.set(doc(solvesCollection(uid), id), rest);
  }
  await batch.commit();
}

export async function deleteCloudSolve(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(solvesCollection(uid), id));
}

export async function deleteAllCloudSolves(uid: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const batch = writeBatch(db);
  for (const id of ids) {
    batch.delete(doc(solvesCollection(uid), id));
  }
  await batch.commit();
}
