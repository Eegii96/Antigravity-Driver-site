// Users domain — reads, writes and the real-time subscription for the
// `users` Firestore collection.
import { collection, doc, getDocs, getDoc, setDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../../types';

function mapUserDoc(d: { id: string; data: () => unknown }): User {
  const data = d.data() as User;
  data.id = d.id;
  if (!data.fullName) data.fullName = 'Хэрэглэгч';
  if (!data.firstName) data.firstName = '';
  if (!data.lastName) data.lastName = '';
  if (!data.machineTypes) data.machineTypes = [];
  return data;
}

export async function getUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(mapUserDoc);
  } catch (err) {
    console.error('Error fetching users from Firestore:', err);
    return [];
  }
}

/**
 * Real-time subscription to the users collection.
 * Returns an unsubscribe function. Use instead of polling getUsers().
 */
export function subscribeToUsers(callback: (users: User[]) => void): () => void {
  return onSnapshot(
    collection(db, 'users'),
    (snap) => callback(snap.docs.map(mapUserDoc)),
    (err) => console.error('Error in users snapshot listener:', err)
  );
}

export async function saveUsers(users: User[]): Promise<void> {
  // Deprecated since Firestore manages individual documents, 
  // but kept for compatibility and writes all of them back.
  try {
    const batch = writeBatch(db);
    for (const u of users) {
      // Clean up any undefined properties to prevent Firestore "Unsupported field value: undefined" error
      const cleanUser = Object.fromEntries(
        Object.entries(u).filter(([_, v]) => v !== undefined)
      ) as unknown as User;
      batch.set(doc(db, 'users', u.id), cleanUser);
    }
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving users to Firestore:', err);
  }
}

export async function saveSingleUser(user: User): Promise<void> {
  try {
    // Clean up any undefined properties to prevent Firestore "Unsupported field value: undefined" error
    const cleanUser = Object.fromEntries(
      Object.entries(user).filter(([_, v]) => v !== undefined)
    ) as unknown as User;
    await setDoc(doc(db, 'users', user.id), cleanUser);
  } catch (err) {
    console.error('Error saving single user to Firestore:', err);
    throw err;
  }
}

export async function getSingleUser(userId: string): Promise<User | null> {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (snap.exists()) {
      const u = snap.data() as User;
      u.id = userId;
      if (!u.fullName) u.fullName = 'Хэрэглэгч';
      if (!u.firstName) u.firstName = '';
      if (!u.lastName) u.lastName = '';
      if (!u.machineTypes) u.machineTypes = [];
      return u;
    }
  } catch (err) {
    console.error('Error fetching single user from Firestore:', err);
  }
  return null;
}
