// Users domain — reads and writes for the `users` Firestore collection.
// Firestore rules only allow single-document `get`s (list is denied — see
// firestore.rules) so every function here fetches by known id; there is no
// whole-collection read to prevent bulk PII scraping.
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
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

/**
 * Fetch a batch of user profiles by known id (e.g. job employerId/hiredOperatorId/
 * applicants). Each id is a single-document `get`, which Firestore rules allow —
 * unlike a collection-wide `list`, this can't be used to enumerate all users.
 */
export async function getUsersByIds(ids: string[]): Promise<User[]> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];
  try {
    const results = await Promise.all(
      uniqueIds.map(id => getDoc(doc(db, 'users', id)).catch(() => null))
    );
    return results
      .filter((snap): snap is NonNullable<typeof snap> => !!snap && snap.exists())
      .map(snap => mapUserDoc({ id: snap.id, data: () => snap.data() }));
  } catch (err) {
    console.error('Error fetching users by id from Firestore:', err);
    return [];
  }
}

/**
 * Total registered user count for the public homepage stat. Backed by an
 * Admin-SDK count aggregation (Cloud Function) so no user documents are ever
 * transferred to the client to compute it.
 */
export async function getRegisteredUserCount(): Promise<number | null> {
  try {
    const { getFunctions, httpsCallable } = await import('firebase/functions');
    const functions = getFunctions();
    const fn = httpsCallable(functions, 'getUserCount');
    const result = await fn({});
    const data = result.data as { count: number };
    return data.count;
  } catch (err) {
    console.error('Error fetching registered user count:', err);
    return null;
  }
}

export async function saveUsers(users: User[]): Promise<void> {
  // Deprecated since Firestore manages individual documents, 
  // but kept for compatibility and writes all of them back.
  try {
    const batch = writeBatch(db);
    for (const u of users) {
      // Clean up any undefined properties to prevent Firestore "Unsupported field value: undefined" error
      const cleanUser = Object.fromEntries(
        Object.entries(u).filter(([, v]) => v !== undefined)
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
      Object.entries(user).filter(([, v]) => v !== undefined)
    ) as unknown as User;
    await setDoc(doc(db, 'users', user.id), cleanUser);
  } catch (err) {
    console.error('Error saving single user to Firestore:', err);
    throw err;
  }
}

/**
 * Records a self-service account deletion request in Firestore so it's
 * actually visible to an admin to act on. Previously the Settings UI's
 * "Илгээх" button only flipped local component state and persisted nothing
 * (audit S3) — the "24 цагийн дотор шийдвэрлэнэ" promise was never kept.
 */
export async function requestAccountDeletion(userId: string, reason: string): Promise<void> {
  const id = `delreq_${userId}_${Date.now()}`;
  await setDoc(doc(db, 'deletionRequests', id), {
    id,
    userId,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
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
