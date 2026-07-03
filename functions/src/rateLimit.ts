import * as admin from 'firebase-admin';

/**
 * Simple Firestore-backed fixed-window rate limiter for callable functions
 * that run BEFORE the caller is authenticated (login/recovery lookups) —
 * Firebase Auth's own brute-force protection doesn't cover these, since they
 * don't call signInWithPassword themselves (see AGENTS.md security notes /
 * audit S4). Not perfectly precise under heavy concurrency, but Firestore
 * transactions make it safe against races, which is what matters here.
 *
 * Returns true if the action is allowed (and records it against `key`),
 * false if `key` has already hit `maxAttempts` within the last `windowMs`.
 */
export async function checkRateLimit(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  const db = admin.firestore();
  const ref = db.collection('rateLimits').doc(key);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();

    if (!snap.exists) {
      tx.set(ref, { count: 1, windowStart: now });
      return true;
    }

    const data = snap.data()!;
    const windowStart = data.windowStart as number;
    const count = data.count as number;

    if (now - windowStart > windowMs) {
      tx.set(ref, { count: 1, windowStart: now });
      return true;
    }

    if (count >= maxAttempts) {
      return false;
    }

    tx.update(ref, { count: count + 1 });
    return true;
  });
}

/** Normalizes an email/phone identifier into a rate-limit key component. */
export function identifierKey(email?: string, phone?: string): string {
  const raw = (email || phone || 'unknown').trim().toLowerCase();
  // Firestore doc ids can't contain '/'; strip anything that isn't safe.
  return raw.replace(/[^a-z0-9@+._-]/gi, '_');
}
